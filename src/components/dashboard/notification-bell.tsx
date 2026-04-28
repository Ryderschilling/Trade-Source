"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Notification {
  id: string;
  user_id: string;
  type: string | null;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  userId: string;
  initialCount: number;
  initialNotifications: Notification[];
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function resolveLink(n: Notification): string {
  const isMessageRelated =
    n.type === "message" ||
    (n.type === "lead" && n.title.toLowerCase().startsWith("new message from"));
  if (isMessageRelated) {
    return n.link && n.link !== "/dashboard" ? n.link : "/messages";
  }
  return n.link ?? "/dashboard";
}

export function NotificationBell({ userId, initialCount, initialNotifications }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const channelName = useRef(`notifications:${userId}:${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelName.current)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.user_id !== userId) return;
          setNotifications((prev) => [newNotif, ...prev].slice(0, 20));
          setCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const panelWidth = Math.min(320, window.innerWidth - 16);
      const rightFromEdge = window.innerWidth - rect.right;
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        right: Math.max(8, rightFromEdge),
        width: panelWidth,
      });
    }
    setOpen((prev) => !prev);
  }

  async function handleMarkAllRead() {
    await fetch("/api/notifications/mark-read", { method: "PATCH" });
    setCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleNotificationClick(n: Notification, e: React.MouseEvent<HTMLAnchorElement>) {
    if (!n.read) {
      e.preventDefault();
      const href = resolveLink(n);
      await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
      setCount((prev) => Math.max(0, prev - 1));
      window.location.href = href;
    }
  }

  return (
    <div>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4 text-neutral-600" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div style={dropdownStyle} className="z-30 rounded-lg border border-neutral-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900">Notifications</p>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-400">No notifications yet.</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <a
                    key={n.id}
                    href={resolveLink(n)}
                    onClick={(e) => handleNotificationClick(n, e)}
                    className={`block px-4 py-3 hover:bg-neutral-50 border-b border-neutral-50 last:border-0 transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                  >
                    <p className="text-sm font-medium text-neutral-900 leading-snug">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{n.body}</p>}
                    <p className="mt-1 text-xs text-neutral-400">{formatDate(n.created_at)}</p>
                  </a>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
