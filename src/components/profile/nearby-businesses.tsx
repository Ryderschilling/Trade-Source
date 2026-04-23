"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type BusinessCard = {
  id: string;
  slug: string;
  business_name: string;
  city: string;
  state: string;
  categories: { name: string } | null;
};

interface Props {
  profileCity: string | null;
  profileUserId?: string | null;
}

export function NearbyBusinesses({ profileCity, profileUserId }: Props) {
  const [businesses, setBusinesses] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Request geolocation for UX context. Since the contractors table has no
    // lat/lng columns, we always fall back to city-based filtering regardless
    // of whether permission is granted or denied.
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => loadBusinesses(profileCity),
        () => loadBusinesses(profileCity),
        { timeout: 5000 }
      );
    } else {
      loadBusinesses(profileCity);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileCity]);

  async function loadBusinesses(targetCity: string | null) {
    setLoading(true);
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("contractors")
      .select("id, slug, business_name, city, state, categories(name)")
      .eq("status", "active")
      .limit(6);

    if (targetCity) {
      query = query.ilike("city", `%${targetCity}%`);
    }

    if (profileUserId) {
      query = query.neq("user_id", profileUserId);
    }

    const { data } = await query;
    setBusinesses((data as BusinessCard[]) ?? []);
    setLoading(false);
  }

  // Nothing to show if no city and not loading
  if (!loading && businesses.length === 0 && !profileCity) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">
        Businesses Near You
      </h2>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No businesses found in your area yet.{" "}
          <Link
            href="/contractors"
            className="text-neutral-900 underline underline-offset-4"
          >
            Browse all
          </Link>
          .
        </p>
      ) : (
        <div className="relative">
          <div className="grid grid-cols-3 gap-3">
            {businesses.map((b) => (
              <Link
                key={b.id}
                href={`/contractors/${b.slug}`}
                className="group flex flex-col rounded-lg border border-neutral-200 px-3 py-3 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <p className="truncate text-sm font-medium text-neutral-900 group-hover:text-neutral-700">
                  {b.business_name}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-neutral-500">
                  {b.categories?.name && (
                    <span className="truncate">{b.categories.name}</span>
                  )}
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{b.city}</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {/* fade overlay */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
          <div className="relative z-10 mt-2 text-center">
            <Link
              href="/contractors"
              className="text-xs font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
            >
              View more
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
