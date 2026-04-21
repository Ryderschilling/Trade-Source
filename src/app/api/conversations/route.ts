import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  other_user_id: z.string().uuid(),
  quote_request_id: z.string().uuid().optional(),
});

// POST /api/conversations — find or create a 1:1 conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json();
  const result = schema.safeParse(raw);
  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid input", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { other_user_id, quote_request_id } = result.data;

  if (other_user_id === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  const service = await createServiceClient();

  // Verify both users exist in profiles
  const { data: profiles } = await service
    .from("profiles")
    .select("id")
    .in("id", [user.id, other_user_id]);

  if (!profiles || profiles.length < 2) {
    return NextResponse.json({ error: "One or more users not found" }, { status: 400 });
  }

  // Find conversations this user is in
  const { data: myParticipations } = await service
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  if (myParticipations && myParticipations.length > 0) {
    const myIds = myParticipations.map((p: { conversation_id: string }) => p.conversation_id);

    // Find conversations where the other user is also a participant
    const { data: shared } = await service
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", other_user_id)
      .in("conversation_id", myIds);

    if (shared && shared.length > 0) {
      const sharedIds = shared.map((p: { conversation_id: string }) => p.conversation_id);

      // If a quote_request_id was given, prefer a conversation already linked to it
      if (quote_request_id) {
        const { data: linked } = await service
          .from("conversations")
          .select("id")
          .eq("quote_request_id", quote_request_id)
          .in("id", sharedIds)
          .limit(1)
          .maybeSingle();

        if (linked) return NextResponse.json({ conversation_id: linked.id });
      }

      // Return the existing direct conversation (no quote link)
      const { data: direct } = await service
        .from("conversations")
        .select("id")
        .is("quote_request_id", null)
        .in("id", sharedIds)
        .limit(1)
        .maybeSingle();

      if (direct) return NextResponse.json({ conversation_id: direct.id });
    }
  }

  // Create a new conversation
  const { data: convo, error: convoError } = await service
    .from("conversations")
    .insert({ quote_request_id: quote_request_id ?? null })
    .select("id")
    .single();

  if (convoError || !convo) {
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  const { error: partError } = await service
    .from("conversation_participants")
    .insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: other_user_id },
    ]);

  if (partError) {
    return NextResponse.json({ error: "Failed to add participants" }, { status: 500 });
  }

  return NextResponse.json({ conversation_id: convo.id });
}
