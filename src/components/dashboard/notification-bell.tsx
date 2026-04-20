"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface Props {
  initialCount: number;
  initialNotifications: Notification[];
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationBell({ initialCount, initialNotifications }: Props) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [notifications, setNotifications] = useState(initialNotifications);

  async function handleOpen() {
    setOpen((prev) => !prev);
    if (!open && count > 0) {
      await fetch("/api/notifications/mark-read", { method: "PATCH" });
      setCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
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
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-30 w-80 rounded-lg border border-neutral-200 bg-white shadow-lg">
            <div className="px-4 py-3 border-b border-neutral-100">
              <p className="text-sm font-semibold text-neutral-900">Notifications</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-neutral-400">No notifications yet.</p>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <a
                    key={n.id}
                    href={n.link ?? "/dashboard"}
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
