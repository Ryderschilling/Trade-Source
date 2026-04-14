import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContractorCard } from "@/components/contractors/contractor-card";
import { Badge } from "@/components/ui/badge";
import type { ContractorWithCategory } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Find a Contractor",
  description:
    "Browse local tradesmen and contractors serving 30A and Northwest Florida. Filter by trade, read reviews, and request quotes.",
};

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function ContractorsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { category, q } = params;

  const supabase = await createClient();

  // Fetch all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  // Build contractor query
  let query = supabase
    .from("contractors")
    .select("*, categories(*)")
    .eq("status", "active")
    .order("is_featured", { ascending: false })
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .order("review_count", { ascending: false });

  if (category) {
    const matchedCat = categories?.find((c) => c.slug === category);
    if (matchedCat) {
      query = query.eq("category_id", matchedCat.id);
    }
  }

  if (q) {
    query = query.ilike("business_name", `%${q}%`);
  }

  const { data: contractors } = await query;

  const activeCategory = categories?.find((c) => c.slug === category);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-muted/40 border-b border-border py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight">
            {activeCategory ? activeCategory.name : "Find a Contractor"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {activeCategory
              ? `${activeCategory.description ?? ""} Serving 30A and Northwest Florida.`
              : "Browse trusted local tradesmen serving 30A and Northwest Florida."}
          </p>

          {/* Search form */}
          <form method="GET" className="mt-6 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Search by business name..."
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {category && (
                <input type="hidden" name="category" value={category} />
              )}
            </div>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar — categories */}
          <aside className="hidden lg:block w-56 shrink-0">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Categories
            </h2>
            <nav className="space-y-0.5">
              <Link
                href="/contractors"
                className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                  !category ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                All Trades
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/contractors?category=${cat.slug}`}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                    category === cat.slug
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main results */}
          <div className="flex-1 min-w-0">
            {/* Mobile category pills */}
            <div className="lg:hidden mb-6 flex flex-wrap gap-2">
              <Link href="/contractors">
                <Badge
                  variant={!category ? "default" : "outline"}
                  className="cursor-pointer"
                >
                  All
                </Badge>
              </Link>
              {categories?.map((cat) => (
                <Link key={cat.id} href={`/contractors?category=${cat.slug}`}>
                  <Badge
                    variant={category === cat.slug ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {contractors?.length ?? 0} contractor
                {contractors?.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {contractors && contractors.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {(contractors as ContractorWithCategory[]).map((contractor) => (
                  <ContractorCard
                    key={contractor.id}
                    contractor={contractor}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-16 text-center">
                <p className="text-muted-foreground">
                  No contractors found.{" "}
                  {category && (
                    <Link href="/contractors" className="text-primary hover:underline">
                      Clear filters
                    </Link>
                  )}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Are you a local tradesman?{" "}
                  <Link href="/join" className="text-primary hover:underline">
                    List your business
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
