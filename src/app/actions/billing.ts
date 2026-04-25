"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { ADDON_PRICE_MAP } from "@/lib/stripe/products";

type AddonType = "verified_badge" | "lead_notifications" | "homepage_slider" | "featured_email";

async function getContractorForUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, supabase: null, contractor: null };

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, user_id, stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!contractor) return { error: "Contractor not found" as const, supabase: null, contractor: null };

  return { error: null, supabase, contractor };
}

export async function pauseListing() {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { error: updateError } = await supabase
    .from("contractors")
    .update({ billing_status: "paused" })
    .eq("id", contractor.id);

  if (updateError) return { error: updateError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function resumeListing() {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { error: updateError } = await supabase
    .from("contractors")
    .update({ billing_status: "active" })
    .eq("id", contractor.id);

  if (updateError) return { error: updateError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function requestVerification(licenseNumber: string) {
  if (!licenseNumber.trim()) return { error: "License number is required" };

  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { data: existing } = await supabase
    .from("business_addons")
    .select("id")
    .eq("business_id", contractor.id)
    .eq("addon_type", "verified_badge" satisfies AddonType)
    .in("status", ["active", "pending_review"])
    .maybeSingle();

  if (existing) return { error: "A verification request is already pending." };

  const { error: insertError } = await supabase.from("business_addons").insert({
    business_id: contractor.id,
    addon_type: "verified_badge",
    status: "pending_review",
    notes: licenseNumber.trim(),
  });

  if (insertError) return { error: insertError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function enableLeadNotifications() {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { data: existing } = await supabase
    .from("business_addons")
    .select("id")
    .eq("business_id", contractor.id)
    .eq("addon_type", "lead_notifications" satisfies AddonType)
    .in("status", ["active", "waitlisted", "pending_review"])
    .maybeSingle();
  if (existing) return { error: "Lead Notifications are already active." };

  if (!contractor.stripe_subscription_id) return { error: "No active subscription. Subscribe to a plan before adding addons." };

  const price = ADDON_PRICE_MAP["lead_notifications"];
  if (!price) return { error: "Stripe price not configured for lead_notifications." };

  let stripeItemId: string;
  try {
    const item = await getStripe().subscriptionItems.create({
      subscription: contractor.stripe_subscription_id,
      price,
      proration_behavior: "create_prorations",
    });
    stripeItemId = item.id;
  } catch (err: any) {
    return { error: err.message ?? "Stripe error creating subscription item" };
  }

  const { error: insertError } = await supabase.from("business_addons").insert({
    business_id: contractor.id,
    addon_type: "lead_notifications",
    status: "active",
    stripe_subscription_item_id: stripeItemId,
  });

  if (insertError) {
    try {
      await getStripe().subscriptionItems.del(stripeItemId, { proration_behavior: "create_prorations" });
    } catch (rollbackErr: any) {
      await (supabase as any).from("stripe_orphans").insert({
        business_id: contractor.id,
        stripe_object_type: "subscription_item",
        stripe_object_id: stripeItemId,
        reason: `rollback_failed_after_db_insert_error: ${rollbackErr?.message ?? "unknown"}`,
      });
    }
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function joinHomepageSlider(asWaitlist: boolean) {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { data: existing } = await supabase
    .from("business_addons")
    .select("id")
    .eq("business_id", contractor.id)
    .eq("addon_type", "homepage_slider" satisfies AddonType)
    .in("status", ["active", "waitlisted", "pending_review"])
    .maybeSingle();
  if (existing) return { error: "Homepage Slider is already active or waitlisted." };

  if (asWaitlist) {
    const { error: insertError } = await supabase.from("business_addons").insert({
      business_id: contractor.id,
      addon_type: "homepage_slider",
      status: "waitlisted",
    });
    if (insertError) return { error: insertError.message };
    revalidatePath("/dashboard/billing");
    return { success: true };
  }

  if (!contractor.stripe_subscription_id) return { error: "No active subscription. Subscribe to a plan before adding addons." };

  const price = ADDON_PRICE_MAP["homepage_slider"];
  if (!price) return { error: "Stripe price not configured for homepage_slider." };

  let stripeItemId: string;
  try {
    const item = await getStripe().subscriptionItems.create({
      subscription: contractor.stripe_subscription_id,
      price,
      proration_behavior: "create_prorations",
    });
    stripeItemId = item.id;
  } catch (err: any) {
    return { error: err.message ?? "Stripe error creating subscription item" };
  }

  const { error: insertError } = await supabase.from("business_addons").insert({
    business_id: contractor.id,
    addon_type: "homepage_slider",
    status: "active",
    stripe_subscription_item_id: stripeItemId,
  });

  if (insertError) {
    try {
      await getStripe().subscriptionItems.del(stripeItemId, { proration_behavior: "create_prorations" });
    } catch (rollbackErr: any) {
      await (supabase as any).from("stripe_orphans").insert({
        business_id: contractor.id,
        stripe_object_type: "subscription_item",
        stripe_object_id: stripeItemId,
        reason: `rollback_failed_after_db_insert_error: ${rollbackErr?.message ?? "unknown"}`,
      });
    }
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/billing");
  return { success: true };
}
