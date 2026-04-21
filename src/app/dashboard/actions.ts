"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type LeadStatus = "new" | "contacted" | "won" | "lost";

async function verifyLeadOwnership(leadId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" as const, supabase: null };

  const { data: lead } = await supabase
    .from("leads")
    .select("contractor_id, contractors!inner(user_id)")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Lead not found" as const, supabase: null };
  if ((lead.contractors as any).user_id !== user.id) return { error: "Forbidden" as const, supabase: null };

  return { error: null, supabase };
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const { error, supabase } = await verifyLeadOwnership(leadId);
  if (error || !supabase) return { error };

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: status as any, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateLeadNotes(leadId: string, notes: string) {
  const { error, supabase } = await verifyLeadOwnership(leadId);
  if (error || !supabase) return { error };

  const { error: updateError } = await supabase
    .from("leads")
    .update({ notes, updated_at: new Date().toISOString() } as any)
    .eq("id", leadId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/dashboard");
  return { success: true };
}
