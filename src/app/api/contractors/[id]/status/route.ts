import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const schema = z.object({
  status: z.enum(["pending", "active", "suspended"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const raw = await req.json();
    const result = schema.safeParse(raw);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { status } = result.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const serviceClient = await createServiceClient();
    const { error } = await serviceClient
      .from("contractors")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("contractor status update error:", error);
      return NextResponse.json({ error: "Failed to update contractor." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("contractor status PATCH error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
