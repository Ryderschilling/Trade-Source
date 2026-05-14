import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaderboardTabs, TabsContent } from "./leaderboard-tabs";
import { Star, Eye, MessageSquare } from "lucide-react";

export const revalidate = 14400; // 4 hours

type LeaderboardContractor = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  state: string;
  avg_rating: number | null;
  review_count: number;
  view_count: number;
  logo_url: string | null;
  categories: { name: string } | null;
};


function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "bg-amber-100 text-amber-700 border-amber-200",
    2: "bg-neutral-100 text-neutral-600 border-neutral-200",
    3: "bg-orange-100 text-orange-700 border-orange-200",
  };
  return (
    <div
      className={`flex h-7 w-7 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-full border text-xs lg:text-sm font-bold ${colors[rank] ?? "bg-white text-neutral-400 border-neutral-200"}`}
    >
      {rank}
    </div>
  );
}

function ContractorRow({
  contractor,
  rank,
  metric,
}: {
  contractor: LeaderboardContractor;
  rank: number;
  metric: React.ReactNode;
}) {
  return (
    <Link
      href={`/contractors/${contractor.slug}`}
      className="flex items-center gap-3 lg:gap-4 rounded-lg border border-neutral-100 bg-white px-4 py-3 lg:px-6 lg:py-4 transition-colors hover:border-neutral-200 hover:bg-neutral-50"
    >
      <RankBadge rank={rank} />
      <Avatar className="h-10 w-10 lg:h-13 lg:w-13 rounded-lg shrink-0">
        <AvatarImage src={contractor.logo_url ?? undefined} alt={contractor.business_name} />
        <AvatarFallback className="rounded-lg bg-neutral-100 text-neutral-600 text-sm lg:text-base font-semibold">
          {initials(contractor.business_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-neutral-900 text-sm lg:text-base">{contractor.business_name}</p>
        <p className="truncate text-xs lg:text-sm text-neutral-400">
          {contractor.categories?.name ?? "Contractor"} &middot; {contractor.city}, {contractor.state}
        </p>
      </div>
      <div className="shrink-0 text-right">{metric}</div>
    </Link>
  );
}


export default async function LeaderboardPage() {
  const supabase = await createClient();

  const select = `
    id, slug, business_name, city, state,
    avg_rating, review_count, view_count, logo_url,
    categories(name)
  `;

  const [
    { data: mostViewedRaw },
    { data: topRatedCandidates },
    { data: mostReviewedRaw },
  ] = await Promise.all([
    supabase
      .from("public_contractors")
      .select(select)
      .order("view_count", { ascending: false })
      .limit(10),
    supabase
      .from("public_contractors")
      .select(select)
      .gte("review_count", 3)
      .not("avg_rating", "is", null)
      .limit(50),
    supabase
      .from("public_contractors")
      .select(select)
      .order("review_count", { ascending: false })
      .limit(10),
  ]);

  const mostViewed = (mostViewedRaw ?? []) as unknown as LeaderboardContractor[];
  const mostReviewed = (mostReviewedRaw ?? []) as unknown as LeaderboardContractor[];

  // Weighted score: avg_rating * ln(review_count + 1)
  const topRated = ((topRatedCandidates ?? []) as unknown as LeaderboardContractor[])
    .map((c) => ({
      ...c,
      score: (c.avg_rating ?? 0) * Math.log(c.review_count + 1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl lg:max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        {/* Header */}
        <div className="mb-8 lg:mb-10">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
            Top Businesses
          </h1>
          <p className="mt-1 text-sm lg:text-base text-neutral-500">30A &amp; Northwest Florida</p>
        </div>

        {/* Tabs */}
        <LeaderboardTabs>

          {/* Most Viewed */}
          <TabsContent value="most-viewed">
            {mostViewed.length === 0 ? (
              <p className="text-sm text-neutral-400 py-6 text-center">No data yet.</p>
            ) : (
              <div className="space-y-2">
                {mostViewed.map((c, i) => (
                  <ContractorRow
                    key={c.id}
                    contractor={c}
                    rank={i + 1}
                    metric={
                      <div className="flex items-center gap-1 text-xs lg:text-sm text-neutral-500">
                        <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        {c.view_count.toLocaleString()}
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Top Rated */}
          <TabsContent value="top-rated">
            {topRated.length === 0 ? (
              <p className="text-sm text-neutral-400 py-6 text-center">
                No businesses with 3+ reviews yet.
              </p>
            ) : (
              <div className="space-y-2">
                {topRated.map((c, i) => (
                  <ContractorRow
                    key={c.id}
                    contractor={c}
                    rank={i + 1}
                    metric={
                      <div className="flex flex-col items-end gap-0.5">
                        <div className="flex items-center gap-1 text-xs lg:text-sm font-medium text-neutral-800">
                          <Star className="h-3.5 w-3.5 lg:h-4 lg:w-4 fill-amber-400 text-amber-400" />
                          {Number(c.avg_rating).toFixed(1)}
                        </div>
                        <span className="text-xs lg:text-sm text-neutral-400">{c.review_count} reviews</span>
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Most Reviewed */}
          <TabsContent value="most-reviewed">
            {mostReviewed.length === 0 ? (
              <p className="text-sm text-neutral-400 py-6 text-center">No reviews yet.</p>
            ) : (
              <div className="space-y-2">
                {mostReviewed.map((c, i) => (
                  <ContractorRow
                    key={c.id}
                    contractor={c}
                    rank={i + 1}
                    metric={
                      <div className="flex items-center gap-1 text-xs lg:text-sm text-neutral-500">
                        <MessageSquare className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                        {c.review_count}
                      </div>
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>

        </LeaderboardTabs>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-neutral-300">
          Rankings refresh every 4 hours &middot; Top Rated requires 3+ reviews
        </p>
      </div>
    </main>
  );
}
