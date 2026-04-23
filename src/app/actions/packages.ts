"use server";

import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const packageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  price_label: z.string().max(100).optional(),
});

export async function savePackages(
  contractorId: string,
  packages: Array<{ name: string; description?: string; price_label?: string }>
): Promise<{ success: boolean; error?: string }> {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated." };

  if (packages.length > 4) return { success: false, error: "Maximum 4 packages allowed." };

  const parsed = packages.map((p) => packageSchema.safeParse(p));
  if (parsed.some((r) => !r.success)) {
    return { success: false, error: "Invalid package data." };
  }

  const supabase = await createServiceClient();

  const { data: contractor } = await supabase
    .from("contractors")
    .select("user_id")
    .eq("id", contractorId)
    .single();

  if (!contractor || contractor.user_id !== user.id) {
    return { success: false, error: "Not authorized." };
  }

  const { error: deleteError } = await supabase
    .from("contractor_packages")
    .delete()
    .eq("contractor_id", contractorId);

  if (deleteError) {
    console.error("Package delete error:", deleteError);
    return { success: false, error: "Failed to update packages." };
  }

  if (packages.length > 0) {
    const { error: insertError } = await supabase
      .from("contractor_packages")
      .insert(
        packages.map((p, i) => ({
          contractor_id: contractorId,
          name: p.name,
          description: p.description ?? null,
          price_label: p.price_label ?? null,
          sort_order: i,
        }))
      );

    if (insertError) {
      console.error("Package insert error:", insertError);
      return { success: false, error: "Failed to save packages." };
    }
  }

  return { success: true };
}
