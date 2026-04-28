import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    let id: string | null = null;
    try {
      const body = await req.json();
      id = body?.id ?? null;
    } catch {}

    const query = supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id);

    const { error } = id
      ? await query.eq("id", id)
      : await query.eq("read", false);

    if (error) {
      console.error("mark-read error:", error);
      return NextResponse.json({ error: "Failed to mark notifications as read." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("mark-read route error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
