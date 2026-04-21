import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  quote_request_id: z.string().uuid(),
});

// POST /api/conversations/from-quote
// Given a quote_request_id, looks up the submitter by email and finds/creates a conversation.
// Returns { conversation_id } or { error, contact: { name, email, phone } } if no profile found.
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
  const { quote_request_id } = result.data;

  const service = await createServiceClient();

  // Fetch the quote request
  const { data: quote } = await service
    .from("quote_requests")
    .select("id, name, email, phone")
    .eq("id", quote_request_id)
    .single();

  if (!quote) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }

  // Look up the submitter's profile by email
  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("email", quote.email)
    .maybeSingle();

  if (!profile) {
    // No account found — return contact info so caller can show it
    return NextResponse.json({
      error: "no_account",
      contact: { name: quote.name, email: quote.email, phone: quote.phone },
    }, { status: 200 });
  }

  if (profile.id === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
  }

  // Find or create conversation between current user and submitter, linked to this quote
  const myParticipations = await service
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  let conversationId: string | null = null;

  if (myParticipations.data && myParticipations.data.length > 0) {
    const myIds = myParticipations.data.map((p: { conversation_id: string }) => p.conversation_id);

    const shared = await service
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", profile.id)
      .in("conversation_id", myIds);

    if (shared.data && shared.data.length > 0) {
      const sharedIds = shared.data.map((p: { conversation_id: string }) => p.conversation_id);

      // Prefer one already linked to this quote
      const linked = await service
        .from("conversations")
        .select("id")
        .eq("quote_request_id", quote_request_id)
        .in("id", sharedIds)
        .limit(1)
        .maybeSingle();

      if (linked.data) conversationId = linked.data.id;

      // Fall back to any direct conversation
      if (!conversationId) {
        const direct = await service
          .from("conversations")
          .select("id")
          .is("quote_request_id", null)
          .in("id", sharedIds)
          .limit(1)
          .maybeSingle();
        if (direct.data) conversationId = direct.data.id;
      }
    }
  }

  if (!conversationId) {
    const { data: convo, error } = await service
      .from("conversations")
      .insert({ quote_request_id })
      .select("id")
      .single();

    if (error || !convo) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    const { error: participantsError } = await service.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: profile.id },
    ]);

    if (participantsError) {
      // Roll back the orphaned conversation
      await service.from("conversations").delete().eq("id", convo.id);
      return NextResponse.json({ error: "Failed to add participants" }, { status: 500 });
    }

    conversationId = convo.id;
  }

  return NextResponse.json({ conversation_id: conversationId });
}
