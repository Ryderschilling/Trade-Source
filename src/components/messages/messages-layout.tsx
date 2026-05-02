"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  FormEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, MessageSquareDashed, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OtherUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  business_name?: string | null;
}

interface ConversationItem {
  id: string;
  subject: string | null;
  quote_request_id: string | null;
  updated_at: string;
  last_read_at: string;
  quote_request: {
    name: string;
    description: string;
    categories?: { name: string } | null;
  } | null;
  other_user: OtherUser | null;
  last_message: { body: string; created_at: string; is_mine: boolean } | null;
  // All conversation IDs with this person (populated during dedup)
  allIds?: string[];
}

interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined, email: string) {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

function displayName(user: OtherUser | null, quoteRequest: ConversationItem["quote_request"]) {
  const name = user?.full_name || user?.email || quoteRequest?.name || "Unknown";
  if (user?.business_name) return `${name} / ${user.business_name}`;
  return name;
}

function formatConversationTime(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === todayStr) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMessageTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateSeparator(ts: string) {
  const date = new Date(ts);
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === todayStr) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Avatar component ─────────────────────────────────────────────────────────

function Avatar({
  user,
  quoteRequest,
  size = "md",
}: {
  user: OtherUser | null;
  quoteRequest: ConversationItem["quote_request"];
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-11 w-11 text-base" };
  const initial = initials(user?.full_name, user?.email ?? quoteRequest?.name ?? "?");

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-full bg-neutral-200 flex items-center justify-center font-semibold text-neutral-600",
        sizeClasses[size]
      )}
    >
      {initial}
    </div>
  );
}

// ─── Sidebar conversation item ────────────────────────────────────────────────

function ConversationRow({
  item,
  isSelected,
  currentUserId,
  onClick,
}: {
  item: ConversationItem;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}) {
  const name = displayName(item.other_user, item.quote_request);
  const preview = item.last_message
    ? (item.last_message.is_mine ? "You: " : "") + item.last_message.body
    : item.quote_request
    ? `Re: ${item.quote_request.categories?.name ?? "Quote"}`
    : "No messages yet";
  const time = item.last_message
    ? formatConversationTime(item.last_message.created_at)
    : formatConversationTime(item.updated_at);
  const unread =
    !item.last_message?.is_mine &&
    item.last_message &&
    new Date(item.last_message.created_at) > new Date(item.last_read_at);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
        isSelected
          ? "bg-neutral-100"
          : "hover:bg-neutral-50 active:bg-neutral-100"
      )}
    >
      <Avatar user={item.other_user} quoteRequest={item.quote_request} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unread ? "font-semibold text-neutral-900" : "font-medium text-neutral-800"
            )}
          >
            {name}
          </span>
          <span className="flex-shrink-0 text-xs text-neutral-400">{time}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p
            className={cn(
              "truncate text-xs",
              unread ? "font-medium text-neutral-700" : "text-neutral-400"
            )}
          >
            {preview}
          </p>
          {unread && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  conversations,
  selectedId,
  currentUserId,
  search,
  onSearch,
  onSelect,
  className,
}: {
  conversations: ConversationItem[];
  selectedId: string | null;
  currentUserId: string;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name = displayName(c.other_user, c.quote_request).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div
      className={cn(
        "flex flex-col border-r border-neutral-200 bg-white",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-neutral-100">
        <h1 className="text-lg font-semibold text-neutral-900">Messages</h1>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-lg bg-neutral-100 pl-8 pr-3 py-1.5 text-sm outline-none placeholder:text-neutral-400 focus:bg-neutral-50 transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 py-12 text-center">
            <MessageSquareDashed className="h-8 w-8 text-neutral-300" />
            <p className="text-sm text-neutral-400">
              {search ? "No conversations found" : "No messages yet"}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <ConversationRow
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              currentUserId={currentUserId}
              onClick={() => onSelect(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  isMine,
  showTime,
}: {
  message: ChatMessage;
  isMine: boolean;
  showTime: boolean;
}) {
  return (
    <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
          isMine
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-neutral-200 text-neutral-900 rounded-bl-sm"
        )}
      >
        {message.body}
      </div>
      {showTime && (
        <span className="mt-1 px-1 text-[10px] text-neutral-400">
          {formatMessageTime(message.created_at)}
        </span>
      )}
    </div>
  );
}

// ─── Chat window ──────────────────────────────────────────────────────────────

function ChatWindow({
  conversation,
  currentUserId,
  onBack,
  onRead,
}: {
  conversation: ConversationItem;
  currentUserId: string;
  onBack: () => void;
  onRead: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const allIds = conversation.allIds ?? [conversation.id];
  const primaryId = conversation.id;
  const name = displayName(conversation.other_user, conversation.quote_request);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);

  function mergeMessages(incoming: ChatMessage[]) {
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      const next = [...prev, ...incoming.filter((m) => !ids.has(m.id))];
      next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      messagesRef.current = next;
      return next;
    });
  }

  // Initial load — fetch from all conversation IDs in parallel
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    messagesRef.current = [];

    Promise.all(
      allIds.map((cid) =>
        fetch(`/api/messages?conversation_id=${cid}`)
          .then((r) => r.json())
          .then(({ messages }) => (messages as ChatMessage[]) ?? [])
          .catch(() => [] as ChatMessage[])
      )
    ).then((results) => {
      if (cancelled) return;
      const all = results.flat();
      all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(all);
      messagesRef.current = all;
      setLoading(false);
      setTimeout(() => scrollToBottom(), 50);
      onRead();
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId, scrollToBottom]);

  // Poll for new messages every 4 seconds across all conversation IDs
  useEffect(() => {
    const id = setInterval(() => {
      const last = messagesRef.current.at(-1);
      const after = last ? `&after=${encodeURIComponent(last.created_at)}` : "";
      Promise.all(
        allIds.map((cid) =>
          fetch(`/api/messages?conversation_id=${cid}${after}`)
            .then((r) => r.json())
            .then(({ messages }) => (messages as ChatMessage[]) ?? [])
            .catch(() => [] as ChatMessage[])
        )
      ).then((results) => {
        const incoming = results.flat();
        if (!incoming.length) return;
        const hadMessages = messagesRef.current.length > 0;
        mergeMessages(incoming);
        if (hadMessages) setTimeout(() => scrollToBottom(true), 50);
      });
    }, 4000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryId, scrollToBottom]);

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;

    setSending(true);
    setText("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversation.id, body }),
    });

    const resData = await res.json().catch(() => ({}));

    if (!res.ok) {
      setText(body);
      toast.error(resData.error ?? "Failed to send message");
    } else if (resData.message) {
      mergeMessages([resData.message]);
      setTimeout(() => scrollToBottom(true), 50);
    }

    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Build groups for date separators
  const messageGroups: { separator: string | null; messages: ChatMessage[] }[] = [];
  let lastDate = "";
  let currentGroup: ChatMessage[] = [];

  for (const msg of messages) {
    const dateStr = new Date(msg.created_at).toDateString();
    if (dateStr !== lastDate) {
      if (currentGroup.length > 0) {
        messageGroups.push({ separator: lastDate, messages: currentGroup });
      }
      lastDate = dateStr;
      currentGroup = [msg];
    } else {
      currentGroup.push(msg);
    }
  }
  if (currentGroup.length > 0) {
    messageGroups.push({ separator: lastDate, messages: currentGroup });
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200 bg-white">
        <button
          onClick={onBack}
          className="md:hidden -ml-1 p-1.5 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar user={conversation.other_user} quoteRequest={conversation.quote_request} size="md" />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-neutral-900 truncate">{name}</p>
          {conversation.quote_request && (
            <p className="text-xs text-neutral-400 truncate">
              Re: {conversation.quote_request.categories?.name ?? "Quote Request"}
            </p>
          )}
        </div>
      </div>

      {/* Quote request details banner */}
      {conversation.quote_request && (
        <div className="mx-4 mt-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
            Quote Request — {conversation.quote_request.categories?.name}
          </p>
          <p className="text-sm text-blue-900 line-clamp-2">{conversation.quote_request.description}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-5 w-5 rounded-full border-2 border-neutral-200 border-t-blue-500 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-sm text-neutral-400">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messageGroups.map((group, gi) => (
            <div key={gi} className="space-y-1">
              {/* Date separator */}
              <div className="flex items-center justify-center py-2">
                <span className="text-[11px] text-neutral-400 font-medium">
                  {formatDateSeparator(group.messages[0].created_at)}
                </span>
              </div>
              {group.messages.map((msg, mi) => {
                const isMine = msg.sender_id === currentUserId;
                const isLast =
                  mi === group.messages.length - 1 ||
                  group.messages[mi + 1]?.sender_id !== msg.sender_id;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isMine={isMine}
                    showTime={isLast}
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 px-4 pt-3 border-t border-neutral-200 bg-white"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
          placeholder="Type a message"
          rows={1}
          className="flex-1 resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-neutral-300 focus:bg-white transition-colors placeholder:text-neutral-400 leading-relaxed overflow-hidden"
          style={{ minHeight: "44px" }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || sending}
          className={cn(
            "h-11 w-11 flex-shrink-0 rounded-full transition-all",
            text.trim()
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
          )}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div className="rounded-full bg-neutral-100 p-5">
        <MessageSquareDashed className="h-8 w-8 text-neutral-400" />
      </div>
      <div className="text-center">
        <p className="font-medium text-neutral-700">No conversation selected</p>
        <p className="text-sm text-neutral-400 mt-1">
          Choose a conversation from the list
        </p>
      </div>
    </div>
  );
}

// ─── Main layout ──────────────────────────────────────────────────────────────

export function MessagesLayout({
  currentUserId,
  initialConversations,
}: {
  currentUserId: string;
  initialConversations: ConversationItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState(initialConversations);
  const [search, setSearch] = useState("");
  const selectedId = searchParams.get("c");
  const fetchedIds = useRef(new Set<string>());

  // Deduplicate: per other_user, keep most recent conversation but track all IDs.
  // Always surface the most recent last_message across all merged conversations.
  const deduped = conversations.reduce<ConversationItem[]>((acc, c) => {
    const key = c.other_user?.id ?? c.id;
    const existing = acc.findIndex((x) => (x.other_user?.id ?? x.id) === key);
    if (existing === -1) {
      acc.push({ ...c, allIds: [c.id] });
    } else {
      const prev = acc[existing];
      const allIds = [...(prev.allIds ?? [prev.id]), c.id];
      // Pick the best last_message (most recent across both)
      const prevMsgTime = prev.last_message ? new Date(prev.last_message.created_at).getTime() : -1;
      const thisMsgTime = c.last_message ? new Date(c.last_message.created_at).getTime() : -1;
      const bestLastMessage = thisMsgTime > prevMsgTime ? c.last_message : prev.last_message;
      // Primary is the most recently updated conversation
      const prevTime = new Date(prev.updated_at).getTime();
      const thisTime = new Date(c.updated_at).getTime();
      const primary = thisTime > prevTime ? { ...c } : { ...prev };
      acc[existing] = { ...primary, allIds, last_message: bestLastMessage };
    }
    return acc;
  }, []);

  // Find in deduped first (has allIds), fall back to raw conversations for freshly-added items
  const selectedConversation =
    deduped.find((c) => c.id === selectedId || c.allIds?.includes(selectedId ?? "")) ??
    conversations.find((c) => c.id === selectedId) ??
    null;

  // If the URL has a ?c= that isn't in our list (e.g. just created), fetch it client-side
  useEffect(() => {
    if (!selectedId) return;
    if (conversations.some((c) => c.id === selectedId)) return;
    if (fetchedIds.current.has(selectedId)) return;
    fetchedIds.current.add(selectedId);

    const client = createClient();
    Promise.all([
      client
        .from("conversations")
        .select("id, subject, quote_request_id, updated_at, quote_requests(name, description, categories(name))")
        .eq("id", selectedId)
        .maybeSingle(),
      client
        .from("conversation_participants")
        .select("conversation_id, user_id, profiles(id, full_name, email, avatar_url)")
        .eq("conversation_id", selectedId)
        .neq("user_id", currentUserId),
    ]).then(async ([{ data: convoData }, { data: coParticipants }]) => {
      if (!convoData) return;
      const otherParticipant = (coParticipants ?? [])[0];
      const otherUserId = (otherParticipant as any)?.user_id;
      let businessName: string | null = null;
      if (otherUserId) {
        const { data: contractor } = await client
          .from("contractors")
          .select("business_name")
          .eq("user_id", otherUserId)
          .maybeSingle();
        businessName = (contractor as any)?.business_name ?? null;
      }
      const baseProfile = (otherParticipant as any)?.profiles ?? null;
      const item: ConversationItem = {
        id: convoData.id,
        subject: (convoData as any).subject ?? null,
        quote_request_id: (convoData as any).quote_request_id ?? null,
        updated_at: (convoData as any).updated_at,
        last_read_at: new Date().toISOString(),
        quote_request: (convoData as any).quote_requests ?? null,
        other_user: baseProfile ? { ...baseProfile, business_name: businessName } : null,
        last_message: null,
      };
      setConversations((prev) => {
        if (prev.some((c) => c.id === item.id)) return prev;
        return [item, ...prev];
      });
    });
  }, [selectedId, conversations, currentUserId]);

  function handleSelect(id: string) {
    // Optimistically mark the conversation as read in local state so the
    // sidebar blue dot disappears immediately without waiting for a refresh.
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, last_read_at: new Date().toISOString() } : c
      )
    );
    const params = new URLSearchParams(searchParams.toString());
    params.set("c", id);
    router.push(`/messages?${params.toString()}`, { scroll: false });
  }

  function handleRead() {
    // Re-fetch server components so the navbar blue dot reflects the updated
    // last_read_at that the messages API just wrote to the DB.
    router.refresh();
  }

  function handleBack() {
    router.push("/messages", { scroll: false });
  }

  // Subscribe to conversation updates (for last-message preview refresh)
  const supabase = createClient();
  useEffect(() => {
    if (conversations.length === 0) return;
    const ids = conversations.map((c) => c.id);

    const channel = supabase
      .channel("conversations:all")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const msg = payload.new as {
            conversation_id: string;
            body: string;
            created_at: string;
            sender_id: string;
          };
          if (!ids.includes(msg.conversation_id)) return;

          setConversations((prev) =>
            prev
              .map((c) =>
                c.id === msg.conversation_id
                  ? {
                      ...c,
                      updated_at: msg.created_at,
                      last_message: {
                        body: msg.body,
                        created_at: msg.created_at,
                        is_mine: msg.sender_id === currentUserId,
                      },
                    }
                  : c
              )
              .sort(
                (a, b) =>
                  new Date(b.updated_at).getTime() -
                  new Date(a.updated_at).getTime()
              )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, initialConversations, supabase]);

  return (
    // Fills the space between navbar and viewport bottom, accounting for safe area
    <div className="flex overflow-hidden bg-white" style={{ height: "calc(100dvh - 4rem - env(safe-area-inset-top))" }}>
      {/* Sidebar */}
      <Sidebar
        conversations={deduped}
        selectedId={selectedId}
        currentUserId={currentUserId}
        search={search}
        onSearch={setSearch}
        onSelect={handleSelect}
        className={cn(
          "w-full md:w-80 flex-shrink-0",
          // On mobile, hide sidebar when a chat is open
          selectedId ? "hidden md:flex" : "flex"
        )}
      />

      {/* Chat area */}
      {selectedConversation ? (
        <ChatWindow
          conversation={selectedConversation}
          currentUserId={currentUserId}
          onBack={handleBack}
          onRead={handleRead}
        />
      ) : (
        <EmptyState className="hidden md:flex flex-1" />
      )}
    </div>
  );
}
