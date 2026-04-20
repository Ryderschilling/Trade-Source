import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HowItWorksContent } from "./how-it-works-content";

export default async function HowItWorksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");
  return <HowItWorksContent />;
}
