import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight, Star, MapPin, Users, TrendingUp,
  DollarSign, Shield, Clock, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `List Your Business | ${APP_NAME}`,
  description:
    "Get your trade business in front of homeowners across 30A and the Emerald Coast. Free to list, no middlemen, direct leads — built for local tradesmen.",
};

const BENEFITS = [
  {
    icon: MapPin,
    title: "Hyper-local exposure",
    description:
      "Your listing reaches homeowners, property managers, and vacation rental owners specifically in your service area — not leads from three states over.",
  },
  {
    icon: DollarSign,
    title: "Free to start",
    description:
      "Create your listing at no cost. We built this to serve the community first. Premium placement options come later — and will always be optional.",
  },
  {
    icon: Users,
    title: "Direct contact, no middlemen",
    description:
      "Homeowners contact you directly. We don't auction your leads, take a percentage of jobs, or add a layer between you and your next customer.",
  },
  {
    icon: Star,
    title: "Verified community reviews",
    description:
      "Reviews on Trade Source come from registered local users — real neighbors, not anonymous strangers. Good work speaks for itself here.",
  },
  {
    icon: TrendingUp,
    title: "Your own profile page",
    description:
      "Showcase your services, photos, licensing, service areas, and contact info in one place. Your profile ranks in search results.",
  },
  {
    icon: Shield,
    title: "Built for this market",
    description:
      "30A has a unique mix of vacation rentals, second homes, and full-time residents. We know the market. This platform is built for it.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Submit your listing",
    description:
      "Fill out the listing form with your business info, trade category, service area, and contact details. Takes about 5 minutes.",
  },
  {
    step: "2",
    title: "Get reviewed and approved",
    description:
      "We review every submission to make sure listings are accurate and legitimate. Most approvals happen within 1–2 business days.",
  },
  {
    step: "3",
    title: "Start receiving leads",
    description:
      "Your profile goes live. Homeowners find you by trade, location, and reviews. They contact you directly — no bidding, no broker.",
  },
];

export default function ForTradiesPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-20 sm:py-28">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wide mb-4">
              For Local Tradesmen
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
              Get your business in front of{" "}
              <span className="text-blue-400">30A homeowners</span>
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed max-w-2xl">
              Trade Source is the only contractor directory built specifically for the 30A corridor
              and Emerald Coast. Free listing. Direct leads. No middlemen.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/join">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  List Your Business Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contractors">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base px-8 border-white/30 text-white hover:bg-white/10 bg-transparent"
                >
                  See How It Looks
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Why list on Trade Source</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Everything you need to grow your local business — nothing you don&apos;t.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="h-full">
                  <CardContent className="p-6 flex flex-col gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/40 border-y border-border">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-muted-foreground text-lg">
              From submission to first lead in under 48 hours.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">What&apos;s included in your free listing</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 max-w-2xl mx-auto">
            {[
              "Business name, description, and trade category",
              "Service area (cities / zip codes you cover)",
              "Phone, email, and website contact info",
              "Photo gallery for your work",
              "Verified customer reviews",
              "Direct quote request form",
              "Search and category placement",
              "Dedicated profile URL",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/40 border-t border-border">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">
            Common questions
          </h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-2">Is it really free?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes. Basic listings are free. We plan to offer optional premium placement in the
                future, but listing your business and receiving direct leads will always have a
                free tier.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you take a cut of jobs I get through the platform?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No. We don&apos;t charge per lead or take a percentage of completed jobs. You contact
                the homeowner, you do the work, you get paid — we stay out of it.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What trades are accepted?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Any licensed trade or home service serving the 30A corridor and Northwest Florida.
                Roofing, electrical, plumbing, HVAC, painting, landscaping, pool service, flooring,
                cleaning, pest control, moving — if you serve this market, we want you listed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How long does approval take?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We review every submission manually to keep the directory quality high. Most listings
                are approved within 1–2 business days.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I update my listing after it&apos;s live?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes. You&apos;ll have a contractor dashboard where you can update your info, add photos,
                and manage leads.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-tight">Takes 5 minutes to get listed</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Fill out the form, we review it, your business goes live. Start reaching 30A homeowners
            this week.
          </p>
          <div className="mt-8">
            <Link href="/join">
              <Button size="lg" className="px-10 text-base">
                List Your Business Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
