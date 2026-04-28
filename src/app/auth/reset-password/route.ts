import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  const supabase = await createClient();

  // PKCE flow — modern Supabase default
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  // token_hash flow — fallback for older config
  if (token_hash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: "recovery" });
    if (!error) {
      return NextResponse.redirect(`${origin}/update-password`);
    }
  }

  return NextResponse.redirect(`${origin}/forgot-password?error=invalid_link`);
}