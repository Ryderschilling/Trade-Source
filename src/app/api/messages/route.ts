import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
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
      .select("user_id")
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
  }

  return NextResponse.json({ message: data });
}
