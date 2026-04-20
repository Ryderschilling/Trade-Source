import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

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
