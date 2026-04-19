"use server";

import { createClient } from "@/lib/supabase/server";

export async function followUser(
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };
  if (user.id === followingId) return { success: false, error: "Cannot follow yourself" };

  const { error } = await supabase
    .from("user_follows")
    .insert({ follower_id: user.id, following_id: followingId });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function unfollowUser(
  followingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Not authenticated" };
  if (user.id === followingId) return { success: false, error: "Cannot unfollow yourself" };

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
