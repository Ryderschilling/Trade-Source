import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/hero";
import { TradeCategoriesGrid } from "@/components/home/trade-categories-grid";
import { FeaturedBusinesses } from "@/components/home/featured-businesses";
import { HowItWorksSteps } from "@/components/home/how-it-works-steps";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import TradeMapClient from "@/components/trade-map-client";
import { getContractorPins } from "@/lib/map-pins";

export const metadata: Metadata = {
  title: "Source A Trade | Find Trusted Local Contractors Near 30A & NW Florida",
  description:
    "Source A Trade is the local contractor directory for 30A, Destin, Fort Walton Beach, and the Emerald Coast. Find plumbers, electricians, HVAC, roofers, painters, landscapers, and 30+ other trades — all local, all verified.",
  keywords:
    "contractors 30A, plumbers near 30A, electricians Destin, HVAC Santa Rosa Beach, roofers Fort Walton Beach, local contractors NW Florida, tradesmen 30A, contractor directory Emerald Coast, Source A Trade",
  robots: "index, follow",
  alternates: {
    canonical: "https://sourceatrade.com",
  },
  openGraph: {
    title: "Source A Trade | Find Trusted Local Contractors Near 30A & NW Florida",
    description:
      "The local contractor directory built for 30A and Northwest Florida. Browse verified tradesmen, read real reviews, get quotes.",
    type: "website",
    url: "https://sourceatrade.com",
    siteName: "Source A Trade",
  },
  twitter: {
    card: "summary_large_image",
    title: "Source A Trade | Find Trusted Local Contractors Near 30A",
    description:
      "Find trusted local contractors across 30A and NW Florida. Free to browse. Verified reviews.",
  },
};

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Search Your Trade",
    description:
      "Browse by category or search by name. Every listing is a local business — no out-of-town referrals.",
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

export default async function HomePage() {
  const pins = await getContractorPins();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Source A Trade",
              url: "https://sourceatrade.com",
              description:
                "Local contractor directory serving 30A and Northwest Florida",
              areaServed: [
                "30A",
                "Santa Rosa Beach",
                "Destin",
                "Fort Walton Beach",
                "Niceville",
                "Miramar Beach",
                "Panama City Beach",
                "Pensacola",
                "Navarre",
                "Grayton Beach",
                "Seaside",
                "Rosemary Beach",
                "Alys Beach",
                "Inlet Beach",
                "WaterColor",
                "Watersound",
                "Sandestin",
                "Gulf Breeze",
                "Freeport",
              ],
              sameAs: ["https://sourceatrade.com"],
            },
            {
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Source A Trade",
              url: "https://sourceatrade.com",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://sourceatrade.com/search?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How do I find a contractor near 30A?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Browse Source A Trade by trade category or use the search bar to find local contractors serving 30A, Destin, Fort Walton Beach, and the Emerald Coast.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Source A Trade free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes — homeowners can browse and contact any contractor completely free. Contractors pay a monthly fee to be listed on the platform. There are no premium tiers or pay-to-rank upgrades; every listed contractor gets equal visibility",
                  },
                },
                {
                  "@type": "Question",
                  name: "What trades are listed on Source A Trade?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Source A Trade covers plumbers, electricians, HVAC technicians, roofers, painters, landscapers, pool service, pressure washing, general contractors, flooring, tile, remodeling, pest control, house cleaning, and 20+ more categories.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What areas does Source A Trade serve?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "We focus on 30A and Northwest Florida — including Santa Rosa Beach, Destin, Fort Walton Beach, Niceville, Miramar Beach, Panama City Beach, Pensacola, and surrounding Emerald Coast communities.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How is Source A Trade different from Angi or HomeAdvisor?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Source A Trade is hyper-local — built specifically for 30A and NW Florida. We don't sell your contact info as leads. All reviews are from verified local users, not imported data.",
                  },
                },
              ],
            },
          ]),
        }}
      />

      <Hero />

      {/* Highlighted trades & businesses */}
      <FeaturedBusinesses />

      {/* Category Grid */}
      <section id="categories" className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Browse by trade
              </h2>
              <p className="mt-2 text-muted-foreground text-base sm:mt-3 sm:text-lg">
                From emergency repairs to full remodels — find the right pro for
                any job.
              </p>
            </div>

            <TradeCategoriesGrid />

            <div className="mt-8 text-center">
              <Link href="/contractors">
                <Button variant="outline" size="lg">
                  View all contractors
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-12 sm:py-20 bg-muted/40 border-y border-border"
      >
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mt-2 text-muted-foreground text-base sm:mt-3 sm:text-lg">
              Getting connected with the right pro takes less than 2 minutes.
            </p>
          </div>

          <HowItWorksSteps steps={HOW_IT_WORKS} />
        </div>
      </section>

      {/* Map — local business coverage */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Local pros across the Emerald Coast
              </h2>
              <p className="mt-2 text-muted-foreground text-base sm:mt-3 sm:text-lg max-w-2xl mx-auto">
                Every business on Source A Trade serves your community. Browse
                contractors covering Destin, Santa Rosa Beach, Fort Walton
                Beach, Panama City, and every neighborhood in between.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-border shadow-sm">
              <TradeMapClient pins={pins} />
            </div>

            <div className="mt-6 text-center">
              <Link href="/contractors">
                <Button variant="outline" size="lg">
                  View all local businesses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA — tradesmen */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Are you a local tradesman?
          </h2>
          <p className="mt-3 text-muted-foreground text-base max-w-2xl mx-auto leading-relaxed sm:mt-4 sm:text-lg">
            Get your business in front of homeowners across 30A and the
            Emerald Coast. — we built this for the community.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/join">
              <Button size="lg" className="w-full sm:w-auto px-8">
                List Your Business Today
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
