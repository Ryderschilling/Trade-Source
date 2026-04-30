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
import { FAQSection } from "@/components/home/faq-section";
import { createClient } from "@/lib/supabase/server";
import { APP_URL } from "@/lib/constants";

// Title: 57 chars (was 69) — under Google's ~60 char cutoff
// Description: 150 chars (was 222) — under Google's 160 char cutoff
export const metadata: Metadata = {
  title: "Source A Trade — Local Contractors Near 30A & NW Florida",
  description:
    "Find local contractors on 30A and NW Florida — plumbers, electricians, HVAC, roofers, and 30+ trades. Verified reviews, direct contact, no middlemen.",
  keywords:
    "contractors 30A, plumbers near 30A, electricians Destin, HVAC Santa Rosa Beach, roofers Fort Walton Beach, local contractors NW Florida, tradesmen 30A, contractor directory Emerald Coast, Source A Trade",
  robots: "index, follow",
  alternates: {
    canonical: "https://sourceatrade.com",
  },
  openGraph: {
    title: "Source A Trade — Local Contractors Near 30A & NW Florida",
    description:
      "The local contractor directory built for 30A and Northwest Florida. Browse verified tradesmen, read real reviews, get quotes.",
    type: "website",
    url: "https://sourceatrade.com",
    siteName: "Source A Trade",
  },
  twitter: {
    card: "summary_large_image",
    title: "Source A Trade — Local Contractors Near 30A & NW Florida",
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

  // Fetch aggregate review data for AggregateRating schema
  let reviewCount = 0;
  let avgRating = 0;
  try {
    const supabase = await createClient();
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating");
    if (reviews && reviews.length > 0) {
      reviewCount = reviews.length;
      avgRating = reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviewCount;
    }
  } catch {
    // Non-fatal — skip AggregateRating if DB unavailable
  }

  const SITE_LAUNCHED = "2025-01-01";
  const TODAY = new Date().toISOString().split("T")[0];

  const schemaObjects: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Source A Trade",
      url: "https://sourceatrade.com",
      description:
        "Local contractor directory serving 30A and Northwest Florida — connecting homeowners with licensed, verified tradesmen.",
      foundingDate: "2025",
      areaServed: [
        "30A",
        "Walton County",
        "Santa Rosa Beach",
        "Destin",
        "Fort Walton Beach",
        "Northwest Florida",
        "Seaside",
        "Rosemary Beach",
        "Alys Beach",
        "Grayton Beach",
        "Seagrove",
        "Inlet Beach",
        "Niceville",
        "Miramar Beach",
        "Panama City Beach",
        "Pensacola",
        "Navarre",
        "WaterColor",
        "Watersound",
        "Sandestin",
        "Gulf Breeze",
        "Freeport",
      ],
      sameAs: [
        "https://sourceatrade.com",
        "https://www.instagram.com/sourceatrade/",
        "https://www.linkedin.com/company/source-a-trade/",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: "Source A Trade",
      url: "https://sourceatrade.com",
      description:
        "The hyper-local contractor directory for 30A and Northwest Florida — find licensed and verified tradesmen serving Santa Rosa Beach, Seaside, Rosemary Beach, Alys Beach, Grayton Beach, Seagrove, Inlet Beach, Destin, Fort Walton Beach, and the Emerald Coast.",
      areaServed: [
        "30A",
        "Walton County",
        "Santa Rosa Beach",
        "Seaside",
        "Rosemary Beach",
        "Alys Beach",
        "Grayton Beach",
        "Seagrove",
        "Inlet Beach",
        "Destin",
        "Fort Walton Beach",
        "Navarre",
        "Northwest Florida",
      ],
      address: {
        "@type": "PostalAddress",
        addressRegion: "FL",
        addressCountry: "US",
      },
      ...(reviewCount >= 3
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: avgRating.toFixed(1),
              reviewCount,
              bestRating: "5",
              worstRating: "1",
            },
          }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Source A Trade",
      url: "https://sourceatrade.com",
      datePublished: SITE_LAUNCHED,
      dateModified: TODAY,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate:
            "https://sourceatrade.com/contractors?q={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    // HowTo schema — mapped to the "How It Works" section
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to find a local contractor on 30A and Northwest Florida",
      description:
        "Use Source A Trade to find and connect with verified local tradesmen serving the 30A corridor and Northwest Florida in under 2 minutes.",
      step: HOW_IT_WORKS.map((s) => ({
        "@type": "HowToStep",
        position: parseInt(s.step, 10),
        name: s.title,
        text: s.description,
      })),
      totalTime: "PT2M",
      tool: [{ "@type": "HowToTool", name: "Source A Trade website" }],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObjects) }}
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
                contractors covering Santa Rosa Beach, Seaside, Rosemary Beach, Alys Beach,
                Grayton Beach, Seagrove, Inlet Beach, Destin, Fort Walton Beach, and the greater
                Emerald Coast — serving all of{" "}
                <a
                  href="https://www.co.walton.fl.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:no-underline transition-colors"
                >
                  Walton County
                </a>{" "}
                and beyond.
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
            Get your business in front of homeowners across 30A — Santa Rosa Beach,
            Seaside, Rosemary Beach, Alys Beach, Grayton Beach, Seagrove, and Inlet Beach
            — and the Emerald Coast. We built this for the community.
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

      {/* Comparison table — AEO / featured snippet signal, visually hidden but crawlable */}
      <section className="sr-only">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Source A Trade vs. other platforms
              </h2>
              <p className="mt-2 text-muted-foreground text-base sm:mt-3 sm:text-lg">
                Not all contractor directories work the same way. Here&apos;s how we stack up.
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 text-left border-b border-border">
                    <th className="py-3 px-4 font-semibold">Feature</th>
                    <th className="py-3 px-4 font-semibold text-primary">Source A Trade</th>
                    <th className="py-3 px-4 font-semibold">Angi / HomeAdvisor</th>
                    <th className="py-3 px-4 font-semibold">Thumbtack</th>
                    <th className="py-3 px-4 font-semibold">Craigslist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="bg-background">
                    <td className="py-3 px-4 text-muted-foreground">Local-only listings</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓ 30A &amp; NW Florida</td>
                    <td className="py-3 px-4 text-muted-foreground">✗ National</td>
                    <td className="py-3 px-4 text-muted-foreground">✗ National</td>
                    <td className="py-3 px-4 text-muted-foreground">Varies</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="py-3 px-4 text-muted-foreground">No fees for contractors</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓ Free to list</td>
                    <td className="py-3 px-4 text-muted-foreground">✗ Pay-per-lead</td>
                    <td className="py-3 px-4 text-muted-foreground">✗ Pay-per-lead</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓</td>
                  </tr>
                  <tr className="bg-background">
                    <td className="py-3 px-4 text-muted-foreground">License verification</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">
                      ✓ via{" "}
                      <a
                        href="https://www.myfloridalicense.com/DBPR/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:no-underline transition-colors"
                      >
                        FL DBPR
                      </a>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">Varies</td>
                    <td className="py-3 px-4 text-muted-foreground">✗</td>
                    <td className="py-3 px-4 text-muted-foreground">✗</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="py-3 px-4 text-muted-foreground">Direct contact</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓ No middlemen</td>
                    <td className="py-3 px-4 text-muted-foreground">✗ Platform-routed</td>
                    <td className="py-3 px-4 text-muted-foreground">✗ Platform-routed</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓</td>
                  </tr>
                  <tr className="bg-background">
                    <td className="py-3 px-4 text-muted-foreground">Community reviews</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓</td>
                    <td className="py-3 px-4 text-muted-foreground">✗</td>
                  </tr>
                  <tr className="bg-muted/20">
                    <td className="py-3 px-4 text-muted-foreground">Emerald Coast focus</td>
                    <td className="py-3 px-4 font-medium text-green-700 dark:text-green-400">✓ Built for this region</td>
                    <td className="py-3 px-4 text-muted-foreground">✗</td>
                    <td className="py-3 px-4 text-muted-foreground">✗</td>
                    <td className="py-3 px-4 text-muted-foreground">✗</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection />
    </>
  );
}
