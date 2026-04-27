"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

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

  const [{ data: requester }, { data: followed }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    serviceClient.from("profiles").select("full_name, email").eq("id", followingId).single(),
  ]);

  const followerName = requester?.full_name ?? "Someone";

  await serviceClient.from("notifications").insert({
    user_id: followingId,
    type: "new_follower",
    title: "New follower",
    body: `${followerName} is now following you.`,
    link: `/profile/${user.id}`,
  });

  if (followed?.email) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sourceatrade.com";
    await sendEmail({
      to: followed.email,
      subject: `${followerName} is now following you on Source A Trade`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2>You have a new follower!</h2>
          <p><strong>${followerName}</strong> is now following you on Source A Trade.</p>
          <a href="${appUrl}/profile/${user.id}"
             style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;font-size:14px;margin:8px 0">
            View their profile
          </a>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#94a3b8;font-size:12px">Source A Trade — sourceatrade.com</p>
        </div>
      `,
      kind: "transactional:follow",
      meta: { follower_id: user.id, following_id: followingId },
    });
  }

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
