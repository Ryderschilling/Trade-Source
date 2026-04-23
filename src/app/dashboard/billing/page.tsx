import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, billing_plan, billing_status, subscription_status, stripe_subscription_id, listing_status, next_billing_date, payment_last4")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!contractor) redirect("/dashboard");

  const [
    { data: addons },
    { data: purchaseHistory },
    { count: sliderWaitlistCount },
    { count: sliderActiveCount },
    { data: reservedMonthRows },
    { count: contractorCount },
  ] = await Promise.all([
    supabase
      .from("business_addons")
      .select("*")
      .eq("business_id", contractor.id)
      .in("status", ["active", "pending_review", "waitlisted"]),
    supabase
      .from("business_addons")
      .select("*")
      .eq("business_id", contractor.id)
      .eq("status", "cancelled")
      .order("cancelled_at", { ascending: false }),
    supabase
      .from("business_addons")
      .select("id", { count: "exact", head: true })
      .eq("addon_type", "homepage_slider")
      .eq("status", "waitlisted"),
    supabase
      .from("business_addons")
      .select("id", { count: "exact", head: true })
      .eq("addon_type", "homepage_slider")
      .eq("status", "active"),
    supabase
      .from("business_addons")
      .select("reserved_month")
      .eq("addon_type", "featured_email")
      .in("status", ["active", "pending_review"]),
    supabase
      .from("contractors")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const reservedMonths = (reservedMonthRows ?? [])
    .map((r) => r.reserved_month)
    .filter((m): m is string => Boolean(m));

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <BillingClient
          contractor={contractor}
          addons={addons ?? []}
          purchaseHistory={purchaseHistory ?? []}
          sliderWaitlistCount={sliderWaitlistCount ?? 0}
          sliderSlotTaken={(sliderActiveCount ?? 0) > 0}
          reservedMonths={reservedMonths}
          contractorCount={contractorCount ?? 0}
        />
      </div>
    </main>
  );
}
