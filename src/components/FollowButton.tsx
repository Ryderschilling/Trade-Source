"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendFollowRequest, cancelFollowRequest, unfollowUser } from "@/app/actions/follow";

interface FollowButtonProps {
  followingId: string;
  followStatus: "none" | "pending" | "accepted";
  followerCount: number;
}

export function FollowButton({ followingId, followStatus, followerCount }: FollowButtonProps) {
  const [status, setStatus] = useState(followStatus);
  const [count, setCount] = useState(followerCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const prev = status;
    const prevCount = count;

    if (status === "none") {
      setStatus("pending");
      startTransition(async () => {
        const result = await sendFollowRequest(followingId);
        if (!result.success) {
          setStatus(prev);
          setCount(prevCount);
        }
      });
    } else if (status === "pending") {
      setStatus("none");
      startTransition(async () => {
        const result = await cancelFollowRequest(followingId);
        if (!result.success) {
          setStatus(prev);
          setCount(prevCount);
        }
      });
    } else {
      setStatus("none");
      setCount((c) => c - 1);
      startTransition(async () => {
        const result = await unfollowUser(followingId);
        if (!result.success) {
          setStatus(prev);
          setCount(prevCount);
        }
      });
    }
  }

  const label =
    status === "accepted" ? "Following" : status === "pending" ? "Request Sent" : "Follow";
  const variant = status === "accepted" ? "secondary" : "outline";

  return (
    <div className="flex items-center gap-2">
      <Button variant={variant} size="sm" onClick={handleClick} disabled={isPending}>
        {label}
      </Button>
      <span className="text-sm text-neutral-500">
        {count} {count === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}
