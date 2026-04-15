import Link from "next/link";
import {
  HardHat, Home, Zap, Droplets, Wind, Paintbrush,
  Leaf, Waves, Grid3x3, Box, Building2, DoorOpen,
  Bug, Sparkles, Truck, ArrowRight, Star, Shield, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const FEATURED_CATEGORIES = [
  { name: "General Contractor", slug: "general-contractor", icon: HardHat },
  { name: "Roofing", slug: "roofing", icon: Home },
  { name: "Electrical", slug: "electrical", icon: Zap },
  { name: "Plumbing", slug: "plumbing", icon: Droplets },
  { name: "HVAC", slug: "hvac", icon: Wind },
  { name: "Painting", slug: "painting", icon: Paintbrush },
  { name: "Landscaping", slug: "landscaping", icon: Leaf },
  { name: "Pool & Spa", slug: "pool-spa", icon: Waves },
  { name: "Flooring", slug: "flooring", icon: Grid3x3 },
  { name: "Cabinetry & Millwork", slug: "cabinetry-millwork", icon: Box },
  { name: "Concrete & Masonry", slug: "concrete-masonry", icon: Building2 },
  { name: "Windows & Doors", slug: "windows-doors", icon: DoorOpen },
  { name: "Pest Control", slug: "pest-control", icon: Bug },
  { name: "Cleaning", slug: "cleaning", icon: Sparkles },
  { name: "Moving", slug: "moving", icon: Truck },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search Your Trade",
    description:
      "Browse by category or search by name. Every listing is a local 30A area business — no out-of-town referrals.",
  },
  {
    step: "2",
    title: "Review & Compare",
    description:
      "Read verified reviews from real neighbors. See photos, licenses, insurance, and years in business.",
  },
  {
    step: "3",
    title: "Request a Quote",
    description:
      "Send a message directly to the contractor. No middlemen, no bidding wars — just straight contact.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.15),_transparent_60%)]" />
        <div className="relative container mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <Badge
              variant="secondary"
              className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <MapPin className="mr-1.5 h-3 w-3" />
              Serving 30A &amp; Northwest Florida
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find trusted local{" "}
              <span className="text-blue-400">tradesmen</span>{" "}
              on 30A
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed max-w-2xl">
              The hyper-local directory built by and for the 30A community.
              Every contractor is vetted, reviewed by neighbors, and actually
              based here.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/contractors">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Find a Pro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/join">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  List Your Business
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-12 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span>Verified reviews</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                <span>Licensed &amp; insured contractors</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Truly local businesses</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section id="categories" className="py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Browse by trade
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              From emergency repairs to full remodels — find the right pro for
              any job.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {FEATURED_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/contractors?category=${cat.slug}`}
                  className="group"
                >
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/40 cursor-pointer">
                    <CardContent className="flex flex-col items-center justify-center gap-3 p-5 text-center">
                      <div className="rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
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

          <div className="mt-8 text-center">
            <Link href="/contractors">
              <Button variant="outline" size="lg">
                View all contractors
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-20 bg-muted/40 border-y border-border"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Getting connected with the right pro takes less than 2 minutes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — tradesmen */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Are you a local tradesman?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Get your business in front of homeowners across 30A and the
            Emerald Coast. Free to list — we built this for the community.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join">
              <Button size="lg" className="w-full sm:w-auto px-8">
                List Your Business Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/for-tradesmen">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
