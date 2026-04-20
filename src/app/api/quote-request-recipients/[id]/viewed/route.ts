import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    // RLS ensures contractor can only update their own recipients
    const { error } = await supabase
      .from("quote_request_recipients")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", id)
      .is("viewed_at", null);

    if (error) {
      console.error("viewed_at update error:", error);
      return NextResponse.json({ error: "Failed to mark as viewed." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("viewed PATCH error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
