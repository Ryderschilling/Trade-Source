import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";
import { PageWrapper } from "@/components/ui/page-wrapper";

export const metadata: Metadata = {
  title: `About | ${APP_NAME}`,
  description:
    "Trade Source is the hyper-local contractor directory built for the 30A community. We connect homeowners with trusted, vetted tradesmen who actually live and work here.",
};

export default function AboutPage() {
  return (
    <PageWrapper>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-muted/40 border-b border-border py-12">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight">About Trade Source</h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Built for the 30A community, by people who live here.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-16 space-y-16">

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Our mission</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            Finding a reliable contractor on the 30A corridor shouldn&apos;t require a leap of faith.
            Trade Source exists to solve the one problem every homeowner and property manager here
            knows too well: you need a trusted plumber, electrician, or roofer — fast — and you
            don&apos;t know who to call.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed text-base">
            We built a hyper-local directory where every listing is a real, local business — not a
            national chain, not an out-of-town referral. Every contractor is verified, reviewed by
            actual neighbors, and accountable to this community.
          </p>
        </section>

        {/* Why we built it */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Why we built this</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            Platforms like Angi and HomeAdvisor send your request to contractors in three states.
            You get a call from someone who has never been to 30A and doesn&apos;t know the difference
            between Rosemary Beach and Inlet Beach. That&apos;s not good enough for a community with
            the service demands of vacation rentals, second homes, and year-round residents.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed text-base">
            Trade Source is purpose-built for this market. The data is ours — not scraped from
            Google, not shared with outside lead brokers. When you find a pro here, they&apos;re
            actually local.
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-8">What we stand for</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Truly local</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every contractor listed serves the 30A corridor and Northwest Florida. No
                out-of-market businesses, no lead farms.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Community reviewed</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reviews come from registered homeowners and property managers in the area — not
                anonymous strangers.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">No middlemen</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Contact contractors directly. We don&apos;t auction your request to the highest bidder
                or take a cut of every job.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border bg-muted/30 p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">
            Whether you need a pro or you are one, Trade Source is free to use.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/contractors">
              <Button size="lg" className="w-full sm:w-auto">
                Find a Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/join">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                List Your Business
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
    </PageWrapper>
  );
}
