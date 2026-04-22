"use client";

import Link from "next/link";
import { Star, MapPin, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ContractorWithCategory } from "@/lib/supabase/types";

interface Props { contractors: ContractorWithCategory[]; }

export function FeaturedMarquee({ contractors }: Props) {
  if (!contractors.length) return null;
  const track = [...contractors, ...contractors];

  return (
    <section className="py-12 sm:py-20 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-12 gap-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-semibold text-muted-foreground">
            <span className="relative inline-flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative rounded-full h-2 w-2 bg-primary" />
            </span>
            Featured This Week
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Highlighted trades &amp; businesses
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-xl">
            A rotating look at verified local pros across 30A and the Emerald Coast — rated by real neighbors.
          </p>
        </div>

        <div className="ts-marquee-wrap relative">
          <div className="ts-marquee-fade ts-marquee-fade-left" />
          <div className="ts-marquee-fade ts-marquee-fade-right" />
          <div className="ts-marquee-track py-2">
            {track.map((c, i) => (<MarqueeCard key={`${c.id}-${i}`} contractor={c} />))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Hover to pause · {contractors.length} verified local businesses
        </p>
      </div>

      <style jsx>{`
        @keyframes tsMarqueeScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .ts-marquee-wrap { overflow: hidden; }
        .ts-marquee-track {
          display: flex; gap: 1rem; width: max-content;
          animation: tsMarqueeScroll 40s linear infinite;
          will-change: transform;
        }
        .ts-marquee-wrap:hover .ts-marquee-track { animation-play-state: paused; }
        .ts-marquee-fade { position: absolute; top: 0; bottom: 0; width: 80px; pointer-events: none; z-index: 2; }
        .ts-marquee-fade-left  { left: 0;  background: linear-gradient(to right, var(--background), transparent); }
        .ts-marquee-fade-right { right: 0; background: linear-gradient(to left,  var(--background), transparent); }
        @media (prefers-reduced-motion: reduce) { .ts-marquee-track { animation: none; } }
      `}</style>
    </section>
  );
}

function MarqueeCard({ contractor }: { contractor: ContractorWithCategory }) {
  const initials = contractor.business_name.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();
  return (
    <Link href={`/contractors/${contractor.slug}`} className="group shrink-0 w-[320px]">
      <Card className="h-full transition-all duration-200 hover:-translate-y-[4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:border-primary/40 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex gap-3 items-start">
            <div className="h-12 w-12 rounded-xl flex-shrink-0 bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight truncate group-hover:text-primary transition-colors">
                  {contractor.business_name}
                </h3>
                {contractor.is_featured && (
                  <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">Featured</span>
                )}
              </div>
              {contractor.categories?.name && (
                <p className="text-xs text-muted-foreground mt-0.5">{contractor.categories.name}</p>
              )}
              {contractor.tagline && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{contractor.tagline}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {contractor.avg_rating !== null && (
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{contractor.avg_rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({contractor.review_count})</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {contractor.city}, {contractor.state}
            </span>
            {contractor.is_licensed && (
              <span className="inline-flex items-center gap-1 text-green-600">
                <Shield className="h-3.5 w-3.5" />
                Licensed
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
