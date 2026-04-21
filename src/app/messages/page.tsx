import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MessagesLayout } from "@/components/messages/messages-layout";

export const metadata: Metadata = { title: "Messages" };

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get all conversations this user participates in
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);

  const conversationIds = (participations ?? []).map((p: any) => p.conversation_id);

  // Fetch conversations, co-participants, and last messages in parallel
  const [{ data: conversations }, { data: coParticipants }, { data: allMessages }] =
    await Promise.all([
      conversationIds.length > 0
        ? supabase
            .from("conversations")
            .select("id, subject, quote_request_id, updated_at, quote_requests(name, description, categories(name))")
            .in("id", conversationIds)
            .order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] }),

      conversationIds.length > 0
        ? supabase
            .from("conversation_participants")
            .select("conversation_id, user_id, profiles(id, full_name, email, avatar_url)")
            .in("conversation_id", conversationIds)
            .neq("user_id", user.id)
        : Promise.resolve({ data: [] }),

      conversationIds.length > 0
        ? supabase
            .from("messages")
            .select("id, conversation_id, body, created_at, sender_id")
            .in("conversation_id", conversationIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

  // Build the last-message-per-conversation map
  const lastMessageMap: Record<string, any> = {};
  for (const msg of allMessages ?? []) {
    if (!lastMessageMap[(msg as any).conversation_id]) {
      lastMessageMap[(msg as any).conversation_id] = msg;
    }
  }

  // Assemble conversation items for the sidebar
  const convItems = (conversations ?? []).map((c: any) => {
    const participation = (participations ?? []).find(
      (p: any) => p.conversation_id === c.id
    );
    const otherParticipant = (coParticipants ?? []).find(
      (p: any) => p.conversation_id === c.id
    );
    const lastMsg = lastMessageMap[c.id] ?? null;

    return {
      id: c.id,
      subject: c.subject ?? null,
      quote_request_id: c.quote_request_id ?? null,
      updated_at: c.updated_at,
      last_read_at: participation?.last_read_at ?? c.updated_at,
      quote_request: c.quote_requests ?? null,
      other_user: (otherParticipant as any)?.profiles ?? null,
      last_message: lastMsg
        ? {
            body: lastMsg.body,
            created_at: lastMsg.created_at,
            is_mine: lastMsg.sender_id === user.id,
          }
        : null,
    };
  });

  return (
    <Suspense fallback={<div className="flex h-[calc(100dvh-4rem)] items-center justify-center"><div className="h-5 w-5 rounded-full border-2 border-neutral-200 border-t-blue-500 animate-spin" /></div>}>
      <MessagesLayout
        currentUserId={user.id}
        initialConversations={convItems}
      />
    </Suspense>
  );
}
