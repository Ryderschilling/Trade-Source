import { createClient } from "@/lib/supabase/server";
import type { ContractorWithCategory } from "@/lib/supabase/types";
import { FeaturedMarquee } from "./featured-businesses-marquee";

export async function FeaturedBusinesses() {
  const supabase = await createClient();

  const { data: featured } = await supabase
    .from("public_contractors")
    .select("*, categories(*)")
    .eq("is_featured", true)
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .limit(12);

  let rows: ContractorWithCategory[] = (featured ?? []) as unknown as ContractorWithCategory[];

  if (rows.length < 6) {
    const excludeIds = rows.map((r) => r.id);
    const q = supabase
      .from("public_contractors")
      .select("*, categories(*)")
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("review_count", { ascending: false })
      .limit(12 - rows.length);

    const { data: topUp } = excludeIds.length
      ? await q.not("id", "in", `(${excludeIds.join(",")})`)
      : await q;

    rows = [...rows, ...((topUp ?? []) as unknown as ContractorWithCategory[])];
  }

  if (!rows.length) return null;
  return <FeaturedMarquee contractors={rows} />;
}
