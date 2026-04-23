"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { acceptFollowRequest, declineFollowRequest } from "@/app/actions/follow";

type PendingRequest = {
  follower_id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export function PendingRequests({ requests }: { requests: PendingRequest[] }) {
  const [list, setList] = useState(requests);

  if (list.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">
        Follow Requests ({list.length})
      </h2>
      <div className="space-y-2">
        {list.map((req) => (
          <RequestRow
            key={req.follower_id}
            request={req}
            onResolve={(id) => setList((prev) => prev.filter((r) => r.follower_id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

function RequestRow({
  request,
  onResolve,
}: {
  request: PendingRequest;
  onResolve: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const name = request.full_name ?? "Source A Trade Member";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function handle(action: "accept" | "decline") {
    startTransition(async () => {
      const result =
        action === "accept"
          ? await acceptFollowRequest(request.follower_id)
          : await declineFollowRequest(request.follower_id);
      if (result.success) onResolve(request.follower_id);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-100 bg-white px-4 py-3">
      <Link href={`/profile/${request.follower_id}`}>
        {request.avatar_url ? (
          <img
            src={request.avatar_url}
            alt={name}
            className="h-9 w-9 rounded-full object-cover ring-1 ring-neutral-100"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
            {initials}
          </div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${request.follower_id}`}
          className="text-sm font-medium text-neutral-900 hover:underline underline-offset-2"
        >
          {name}
        </Link>
        <p className="text-xs text-neutral-400">wants to follow you</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => handle("accept")}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Accept
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handle("decline")}
          disabled={isPending}
          className="h-7 px-3 text-xs"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
