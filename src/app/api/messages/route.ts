import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  conversation_id: z.string().uuid(),
  body: z.string().min(1).max(5000),
});

// POST /api/messages — send a message in a conversation
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
  const { conversation_id, body } = result.data;

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id, sender_id: user.id, body: body.trim() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update last_read_at for sender so their own messages don't appear unread
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .eq("user_id", user.id);

  return NextResponse.json({ message: data });
}
