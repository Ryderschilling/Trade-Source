import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  prefix: "rl:messages",
});

const postSchema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

// GET /api/messages?conversation_id=xxx — fetch messages for a conversation
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation_id = req.nextUrl.searchParams.get("conversation_id");
  if (!conversation_id || !/^[0-9a-f-]{36}$/.test(conversation_id)) {
    return NextResponse.json({ error: "Invalid conversation_id" }, { status: 400 });
  }

  const service = await createServiceClient();

  // Verify participation
  const { data: participation } = await service
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const after = req.nextUrl.searchParams.get("after");

  let query = service
    .from("messages")
    .select("*")
    .eq("conversation_id", conversation_id)
    .order("created_at", { ascending: true });

  if (after) {
    query = query.gt("created_at", after);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark as read on initial load (not incremental polls)
  if (!after) {
    await service
      .from("conversation_participants")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conversation_id)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ messages: data });
}

// POST /api/messages — send a message in a conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success } = await ratelimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const raw = await req.json();
  const result = postSchema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { conversation_id, body } = result.data;

  const service = await createServiceClient();

  // Verify the user is a participant before inserting
  const { data: participation } = await service
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await service
    .from("messages")
    .insert({ conversation_id, sender_id: user.id, body: body.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update last_read_at for sender so their own messages don't appear unread
  await service
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id);

  // Notify other participants
  const [{ data: otherParticipants }, { data: senderProfile }] = await Promise.all([
    service
      .from("conversation_participants")
      .select("user_id, profiles(email, full_name)")
      .eq("conversation_id", conversation_id)
      .neq("user_id", user.id),
    service
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (otherParticipants?.length) {
    const senderName = senderProfile?.full_name ?? senderProfile?.email ?? "Someone";
    const preview = body.trim().length > 80 ? body.trim().slice(0, 77) + "…" : body.trim();

    await service.from("notifications").insert(
      otherParticipants.map((p) => ({
        user_id: p.user_id,
        type: "message",
        title: `New message from ${senderName}`,
        body: preview,
        link: `/messages?c=${conversation_id}`,
      }))
    );

    // Email each recipient
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sourceatrade.com";
      await Promise.all(
        otherParticipants.map(async (p) => {
          const profile = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          const recipientEmail = (profile as { email?: string } | null)?.email;
          if (!recipientEmail) return;
          try {
            await resend.emails.send({
              from: process.env.RESEND_FROM_EMAIL!,
              to: recipientEmail,
              subject: `New message from ${senderName} — Source A Trade`,
              html: `
                <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                  <h2>You have a new message</h2>
                  <p><strong>${senderName}</strong> sent you a message on Source A Trade:</p>
                  <div style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;border-left:3px solid #3b82f6">
                    <p style="margin:0;color:#374151;font-size:15px">${preview}</p>
                  </div>
                  <a href="${appUrl}/messages?c=${conversation_id}"
                     style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;font-size:14px;margin:8px 0">
                    Reply in Source A Trade
                  </a>
                  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
                  <p style="color:#94a3b8;font-size:12px">Source A Trade — sourceatrade.com</p>
                </div>
              `,
            });
          } catch (e) {
            console.error("Message email notification failed for user", p.user_id, e);
          }
        })
      );
    }
  }

  return NextResponse.json({ message: data });
}
