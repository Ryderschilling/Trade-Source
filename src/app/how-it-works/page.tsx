import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getContractorPins } from "@/lib/map-pins";
import { HowItWorksContent } from "./how-it-works-content";

export default async function HowItWorksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const pins = await getContractorPins();

  return <HowItWorksContent mapPins={pins} />;
}
