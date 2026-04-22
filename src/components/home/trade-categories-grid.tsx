'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home, Zap, Droplets, Thermometer, Trees, Waves,
  Grid3x3, Bug, Sparkles, ShieldAlert, Anchor, Wind,
  Car, Building2, Wrench, ArrowRight, type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TradeCategory {
  name: string;
  slug: string;
  icon: LucideIcon;
}

const CATEGORIES: TradeCategory[] = [
  { name: "Roofing",                           slug: "roofing",           icon: Home },
  { name: "Electrical",                        slug: "electrical",        icon: Zap },
  { name: "Plumbing",                          slug: "plumbing",          icon: Droplets },
  { name: "HVAC",                              slug: "hvac",              icon: Thermometer },
  { name: "Landscaping",                       slug: "landscaping",       icon: Trees },
  { name: "Pool & Spa",                        slug: "pool-spa",          icon: Waves },
  { name: "Flooring",                          slug: "flooring",          icon: Grid3x3 },
  { name: "Pest Control",                      slug: "pest-control",      icon: Bug },
  { name: "Handyman",                          slug: "handyman",          icon: Wrench },
  { name: "House Cleaning",                    slug: "house-cleaning",    icon: Sparkles },
  { name: "Hurricane Shutters & Impact Windows", slug: "hurricane-shutters", icon: ShieldAlert },
  { name: "Dock & Boathouse",                  slug: "dock-boathouse",    icon: Anchor },
  { name: "Pressure Washing",                  slug: "pressure-washing",  icon: Wind },
  { name: "Auto Repair",                       slug: "auto-repair",       icon: Car },
  { name: "Property Management",               slug: "property-management", icon: Building2 },
];

const POPULAR: TradeCategory[] = [
  { name: "Electrical",  slug: "electrical",  icon: Zap },
  { name: "Plumbing",    slug: "plumbing",    icon: Droplets },
  { name: "HVAC",        slug: "hvac",        icon: Thermometer },
  { name: "Roofing",     slug: "roofing",     icon: Home },
  { name: "Landscaping", slug: "landscaping", icon: Trees },
];

export function TradeCategoriesGrid() {
  const [hasAnimated, setHasAnimated] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={gridRef}>
      {/* Mobile — horizontal scroll strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:hidden" style={{ scrollbarWidth: 'none' }}>
        {POPULAR.map((cat, index) => {
          const Icon = cat.icon;
          const wrapperStyle: React.CSSProperties = hasAnimated
            ? {
                animation: `cardDropIn 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
                animationDelay: `${index * 100}ms`,
              }
            : { opacity: 0 };

          return (
            <Link
              key={cat.slug}
              href={`/contractors?category=${cat.slug}`}
              className="group shrink-0"
              style={wrapperStyle}
            >
              <Card className="w-[88px] transition-all duration-200 active:scale-95 cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium leading-tight">
                    {cat.name}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {/* More → */}
        <Link
          href="/contractors"
          className="shrink-0"
          style={hasAnimated ? { animation: `cardDropIn 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both`, animationDelay: `${POPULAR.length * 100}ms` } : { opacity: 0 }}
        >
          <Card className="w-[88px] h-full transition-all duration-200 active:scale-95 cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center gap-2 p-3 text-center h-full">
              <div className="rounded-lg bg-neutral-100 p-2">
                <ArrowRight className="h-5 w-5 text-neutral-500" />
              </div>
              <span className="text-xs font-medium leading-tight text-neutral-500">
                All trades
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Desktop — full grid (unchanged) */}
      <div
        className="hidden grid-cols-2 gap-3 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {CATEGORIES.map((cat, index) => {
          const Icon = cat.icon;
          const wrapperStyle: React.CSSProperties = hasAnimated
            ? {
                animation: `cardDropIn 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) both, cardFloat 4s ease-in-out infinite alternate`,
                animationDelay: `${index * 80}ms, ${(index * 0.24) % 4}s`,
              }
            : { opacity: 0 };

          return (
            <Link
              key={cat.slug}
              href={`/contractors?category=${cat.slug}`}
              className="group"
              style={wrapperStyle}
            >
              <Card className="h-full transition-all duration-200 hover:-translate-y-[6px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:border-primary/40 cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-5 text-center">
                  <div className="rounded-xl bg-primary/10 p-3 transition-all duration-200 group-hover:bg-primary/20 group-hover:scale-110">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-sm font-medium leading-tight">
                    {cat.name}
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
