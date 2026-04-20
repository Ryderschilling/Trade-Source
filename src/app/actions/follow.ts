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
    .select("status")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: existing.status === "pending" ? "Request already sent" : "Already following",
    };
  }

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient.from("user_follows").insert({
    follower_id: user.id,
    following_id: followingId,
    status: "pending",
  });
  if (error) return { success: false, error: error.message };

  const { data: requester } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  await serviceClient.from("notifications").insert({
    user_id: followingId,
    type: "follow_request",
    title: "New follow request",
    body: `${requester?.full_name ?? "Someone"} wants to follow you.`,
    link: `/profile/${user.id}`,
  });

  return { success: true };
}

export async function cancelFollowRequest(
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
    .eq("following_id", followingId)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function acceptFollowRequest(
  followerId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("user_follows")
    .update({ status: "accepted" })
    .eq("follower_id", followerId)
    .eq("following_id", user.id)
    .eq("status", "pending");

  if (error) return { success: false, error: error.message };
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
    .eq("following_id", user.id)
    .eq("status", "pending");

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
