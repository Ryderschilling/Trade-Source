import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type === "recovery") {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: "recovery" });
    if (!error) {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`);
}
