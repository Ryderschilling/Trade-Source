"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function sendFollowRequest(
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };
  if (user.id === followingId) return { success: false, error: "Cannot follow yourself" };

  const { data: existing } = await supabase
    .from("user_follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existing) return { success: false, error: "Already following" };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from("user_follows").insert({
    follower_id: user.id,
    following_id: followingId,
  });
  if (error) return { success: false, error: error.message };

  const { data: requester } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  await serviceClient.from("notifications").insert({
    user_id: followingId,
    type: "new_follower",
    title: "New follower",
    body: `${requester?.full_name ?? "Someone"} is now following you.`,
    link: `/profile/${user.id}`,
  });

  return { success: true };
}

export async function cancelFollowRequest(
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  return unfollowUser(followingId);
}

export async function acceptFollowRequest(
  _followerId: string
): Promise<{ success: boolean; error?: string }> {
  // No status column on user_follows — follow is created directly
  return { success: true };
}

export async function declineFollowRequest(
  followerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("user_follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function unfollowUser(
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
