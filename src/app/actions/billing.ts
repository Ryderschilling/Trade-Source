"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AddonType = "verified_badge" | "lead_notifications" | "homepage_slider" | "featured_email";

async function getContractorForUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, supabase: null, contractor: null };

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, user_id")
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

export async function cancelSubscription() {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { error: updateError } = await supabase
    .from("contractors")
    .update({ billing_status: "cancelled" })
    .eq("id", contractor.id);

  if (updateError) return { error: updateError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function removeAddon(addonId: string) {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { data: addon } = await supabase
    .from("business_addons")
    .select("id, business_id")
    .eq("id", addonId)
    .single();

  if (!addon || addon.business_id !== contractor.id) return { error: "Not found" };

  const { error: updateError } = await supabase
    .from("business_addons")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", addonId);

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

  const { error: insertError } = await supabase.from("business_addons").insert({
    business_id: contractor.id,
    addon_type: "lead_notifications",
    status: "active",
  });

  if (insertError) return { error: insertError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function joinHomepageSlider(asWaitlist: boolean) {
  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { error: insertError } = await supabase.from("business_addons").insert({
    business_id: contractor.id,
    addon_type: "homepage_slider",
    status: asWaitlist ? "waitlisted" : "active",
  });

  if (insertError) return { error: insertError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}

export async function reserveFeaturedEmail(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) return { error: "Invalid month format" };

  const { error, supabase, contractor } = await getContractorForUser();
  if (error || !supabase || !contractor) return { error };

  const { error: insertError } = await supabase.from("business_addons").insert({
    business_id: contractor.id,
    addon_type: "featured_email",
    status: "pending_review",
    reserved_month: month,
  });

  if (insertError) return { error: insertError.message };
  revalidatePath("/dashboard/billing");
  return { success: true };
}
