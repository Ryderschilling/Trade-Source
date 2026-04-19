"use server";

import { createServiceClient } from "@/lib/supabase/server";

export async function trackView(contractorId: string): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.rpc("increment_view_count", { p_contractor_id: contractorId });
  } catch {
    // fire-and-forget — never throw to the caller
  }
}
