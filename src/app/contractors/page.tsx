import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ContractorCard, ContractorCardSkeleton } from "@/components/contractors/contractor-card";
import { ContractorSearchBar } from "@/components/contractors/search-bar";
import { QuoteRequestBanner } from "@/components/quote-request-banner";
import { MobileCategoryNav } from "@/components/contractors/mobile-category-nav";
import type { ContractorWithCategory } from "@/lib/supabase/types";
import * as LucideIcons from "lucide-react";

export const metadata: Metadata = {
  title: "Find a Contractor",
  description:
    "Browse local tradesmen and contractors serving 30A and Northwest Florida. Filter by trade, read reviews, and request quotes.",
};

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string; q?: string; zip?: string }>;
}

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon className={className ?? "h-4 w-4"} />;
}

// Hard-coded groups used as fallback when migration hasn't run
const FALLBACK_GROUPS = [
  { id: "outdoors-yard",     name: "Outdoors & Yard",     icon: "Leaf",      slugs: ["lawn-care","landscaping-design","tree-service","irrigation","fencing","pool-spa","deck-porch","outdoor-kitchen","landscaping"] },
  { id: "interior",          name: "Interior",             icon: "Home",      slugs: ["flooring","painting","cabinetry-millwork","drywall","tile-stone","blinds-window-treatments"] },
  { id: "exterior",          name: "Exterior",             icon: "Building2", slugs: ["roofing","windows-doors","gutters","siding","pressure-washing","screen-enclosures","hurricane-shutters","garage-doors"] },
  { id: "systems-mechanical",name: "Systems & Mechanical", icon: "Zap",       slugs: ["hvac","electrical","plumbing","solar","generator","security-systems","septic"] },
  { id: "construction",      name: "Construction",         icon: "HardHat",   slugs: ["general-contractor","concrete-masonry","home-inspection"] },
  { id: "waterfront",        name: "Waterfront",           icon: "Waves",     slugs: ["dock-marine","seawall"] },
  { id: "home-services",     name: "Home Services",        icon: "Sparkles",  slugs: ["cleaning","pest-control","handyman"] },
];

interface ContractorGridProps {
  searchTerm: string;
  zipTerm: string;
  activeCategory: { id: string; name: string; description?: string | null } | null;
  allCategories: { id: string; name: string }[];
  userProfile: { full_name: string | null; email: string | null; phone: string | null } | null;
}

async function ContractorGrid({ searchTerm, zipTerm, activeCategory, allCategories, userProfile }: ContractorGridProps) {
  const supabase = await createClient();
  let contractors: ContractorWithCategory[] = [];

  if (searchTerm) {
    const qLower = searchTerm.toLowerCase();
    const matchingCatIds = allCategories
      .filter((c) => c.name.toLowerCase().includes(qLower))
      .map((c) => c.id);

    const orParts = [
      `business_name.ilike.%${searchTerm}%`,
      `tagline.ilike.%${searchTerm}%`,
    ];
    if (matchingCatIds.length > 0) {
      orParts.push(`category_id.in.(${matchingCatIds.join(",")})`);
    }

    let query = supabase
      .from("contractors")
      .select("*, categories(*)")
      .eq("status", "active")
      .or(orParts.join(","));

    if (zipTerm) query = query.contains("service_areas", [zipTerm]);

    const { data } = await query
      .order("is_featured", { ascending: false })
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("review_count", { ascending: false });
    contractors = (data ?? []) as ContractorWithCategory[];
  } else if (activeCategory) {
    let query = supabase
      .from("contractors")
      .select("*, categories(*)")
      .eq("status", "active")
      .or(`category_id.eq.${activeCategory.id},additional_categories.cs.{${activeCategory.id}}`);

    if (zipTerm) query = query.contains("service_areas", [zipTerm]);

    const { data } = await query
      .order("is_featured", { ascending: false })
      .order("avg_rating", { ascending: false, nullsFirst: false })
      .order("review_count", { ascending: false });
    contractors = (data ?? []) as ContractorWithCategory[];
  }

  if (searchTerm) {
    return (
      <>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-neutral-900">Search results</h2>
            <p className="text-sm text-muted-foreground">
              {contractors.length} contractor{contractors.length !== 1 ? "s" : ""} matching &quot;{searchTerm}&quot;{zipTerm ? ` near ${zipTerm}` : ""}
            </p>
          </div>
        </div>
        {contractors.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {contractors.map((contractor) => (
              <ContractorCard key={contractor.id} contractor={contractor} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
            <p className="text-lg font-medium text-neutral-700">No results found</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different search term or browse by category.
            </p>
          </div>
        )}
      </>
    );
  }

  if (!activeCategory) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
        <p className="text-lg font-medium text-neutral-700">Select a trade to get started</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a category above to browse local contractors.
        </p>
      </div>
    );
  }

  return (
    <>
      {contractors.length > 0 && (
        <QuoteRequestBanner
          categoryId={activeCategory.id}
          categoryName={activeCategory.name}
          contractors={contractors.map((c) => ({
            id: c.id,
            business_name: c.business_name,
            is_active: c.status === "active",
          }))}
          defaultName={userProfile?.full_name ?? undefined}
          defaultEmail={userProfile?.email ?? undefined}
          defaultPhone={userProfile?.phone ?? undefined}
        />
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-semibold text-neutral-900">{activeCategory.name}</h2>
          <p className="text-sm text-muted-foreground">
            {contractors.length} contractor{contractors.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {contractors.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {contractors.map((contractor) => (
            <ContractorCard key={contractor.id} contractor={contractor} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <p className="text-muted-foreground">
            No contractors listed for this category yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Are you a local tradesman?{" "}
            <Link href="/join" className="text-primary hover:underline">List your business</Link>
          </p>
        </div>
      )}
    </>
  );
}

function ContractorGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <ContractorCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default async function ContractorsPage({ searchParams }: PageProps) {
  const { category: categorySlug, search: searchQuery, q: qParam, zip: zipParam } = await searchParams;
  const searchTerm = (qParam ?? searchQuery)?.trim() ?? "";
  const zipTerm = zipParam?.trim() ?? "";
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: groups },
    { data: allCategories },
    { data: contractorCountRows },
    profileResult,
  ] = await Promise.all([
    supabase.from("category_groups").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("contractors").select("category_id").eq("status", "active"),
    user
      ? supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const userProfile = profileResult.data ?? null;

  const countByCategory: Record<string, number> = {};
  for (const c of contractorCountRows ?? []) {
    if (c.category_id) countByCategory[c.category_id] = (countByCategory[c.category_id] ?? 0) + 1;
  }

  let activeCategory = (allCategories ?? []).find((c: any) => c.slug === categorySlug);
  if (!activeCategory && searchTerm) {
    const qLower = searchTerm.toLowerCase();
    activeCategory = (allCategories ?? []).find((c: any) => c.name.toLowerCase() === qLower);
  }

  const hasGroups = (groups ?? []).length > 0;

  let sidebarGroups: { id: string; name: string; icon: string; categories: any[] }[];

  if (hasGroups) {
    const catsByGroupId: Record<string, any[]> = {};
    for (const cat of allCategories ?? []) {
      const gid = (cat as any).group_id ?? "__none__";
      if (!catsByGroupId[gid]) catsByGroupId[gid] = [];
      catsByGroupId[gid].push(cat);
    }
    sidebarGroups = (groups ?? []).map((g: any) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      categories: catsByGroupId[g.id] ?? [],
    }));
  } else {
    const catBySlug: Record<string, any> = {};
    for (const cat of allCategories ?? []) catBySlug[(cat as any).slug] = cat;
    sidebarGroups = FALLBACK_GROUPS.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.icon,
      categories: g.slugs.map((s) => catBySlug[s]).filter(Boolean),
    })).filter((g) => g.categories.length > 0);
  }

  const activeGroupId = hasGroups
    ? (activeCategory as any)?.group_id
    : FALLBACK_GROUPS.find((g) => g.slugs.includes(categorySlug ?? ""))?.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-muted/40 border-b border-border py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight">Find a Contractor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm
              ? `Showing results for "${searchTerm}"${zipTerm ? ` near ${zipTerm}` : ""}`
              : activeCategory
              ? `${(activeCategory as any).description ?? ""} Serving 30A and Northwest Florida.`
              : "Browse trusted local tradesmen serving 30A and Northwest Florida."}
          </p>
          <ContractorSearchBar defaultValue={searchTerm} defaultZip={zipTerm} />
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">

          {/* Accordion Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-6">
            <nav className="space-y-1">
              {sidebarGroups.map((group) => {
                const isGroupOpen = group.id === activeGroupId;
                return (
                  <details
                    key={group.id}
                    open={isGroupOpen}
                    className="group/details rounded-lg border border-transparent data-[open]:border-border data-[open]:bg-muted/30 overflow-hidden"
                  >
                    <summary className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none rounded-lg hover:bg-muted/50 transition-colors list-none">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground">
                        <CategoryIcon name={group.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1 text-sm font-medium text-neutral-800">{group.name}</span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open/details:rotate-180" />
                    </summary>
                    <div className="pb-1.5 px-1">
                      {group.categories.map((cat: any) => {
                        const count = countByCategory[cat.id] ?? 0;
                        const isActive = cat.slug === categorySlug;
                        return (
                          <Link
                            key={cat.id}
                            href={`/contractors?category=${cat.slug}`}
                            className={`flex items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                              isActive
                                ? "bg-primary text-primary-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            }`}
                          >
                            <span className="truncate">{cat.name}</span>
                            {count > 0 && (
                              <span className={`ml-2 shrink-0 text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </nav>
          </aside>

          {/* Mobile: collapsible category panel */}
          <MobileCategoryNav
            sidebarGroups={sidebarGroups}
            categorySlug={categorySlug}
            activeGroupId={activeGroupId}
            activeCategory={activeCategory ?? null}
            countByCategory={countByCategory}
          />

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<ContractorGridSkeleton />}>
              <ContractorGrid
                searchTerm={searchTerm}
                zipTerm={zipTerm}
                activeCategory={activeCategory ?? null}
                allCategories={(allCategories ?? []) as { id: string; name: string }[]}
                userProfile={userProfile}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
