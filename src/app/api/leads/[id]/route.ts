import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["new", "viewed", "contacted", "closed"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    // RLS ensures only the contractor owner can update their leads
    const { error } = await supabase
      .from("leads")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("lead status update error:", error);
      return NextResponse.json({ error: "Failed to update lead." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("leads PATCH error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
