"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/app/actions/follow";

interface FollowButtonProps {
  followingId: string;
  initialIsFollowing: boolean;
  followerCount: number;
}

export function FollowButton({
  followingId,
  initialIsFollowing,
  followerCount,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [count, setCount] = useState(followerCount);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const prevFollowing = isFollowing;
    const prevCount = count;

    // Optimistic update
    setIsFollowing(!prevFollowing);
    setCount(prevFollowing ? prevCount - 1 : prevCount + 1);

    startTransition(async () => {
      const result = prevFollowing
        ? await unfollowUser(followingId)
        : await followUser(followingId);

      if (!result.success) {
        // Revert on error
        setIsFollowing(prevFollowing);
        setCount(prevCount);
        console.error("Follow action failed:", result.error);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isFollowing ? "secondary" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={isPending}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
      <span className="text-sm text-neutral-500">
        {count} {count === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}
