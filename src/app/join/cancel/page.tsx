import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Users, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { resumeContractorCheckout } from "@/app/actions/contractors";

export const metadata: Metadata = {
  title: "Your Listing Is Saved | Source A Trade",
};

interface PageProps {
  searchParams: Promise<{ slug?: string; error?: string }>;
}

export default async function JoinCancelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let contractor: {
    id: string;
    business_name: string;
    email: string | null;
    slug: string;
    city: string;
    category_id: string;
  } | null = null;
  let categoryName: string | null = null;

  if (params.slug) {
    const { data } = await supabase
      .from("contractors")
      .select("id, business_name, email, slug, city, category_id")
      .eq("slug", params.slug)
      .single();

    if (data) {
      contractor = data;

      const { data: cat } = await supabase
        .from("categories")
        .select("name")
        .eq("id", data.category_id)
        .single();

      categoryName = cat?.name ?? null;
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto max-w-2xl px-4 py-16 sm:py-20">
        {/* Saved badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-950/40 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400">
            <ShieldCheck className="h-4 w-4" />
            Your listing is saved
          </span>
        </div>

        {/* Headline */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {contractor
              ? `${contractor.business_name} is one step away`
              : "Your spot is still waiting"}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-lg mx-auto">
            Everything you entered is saved. Complete payment and your listing
            goes live instantly — homeowners searching your trade on 30A will
            find you today.
          </p>
        </div>

        {/* Value props */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <MapPin className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Hyper-local reach</p>
            <p className="text-xs text-muted-foreground">
              30A homeowners looking for your exact trade in your exact area.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Users className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Qualified buyers</p>
            <p className="text-xs text-muted-foreground">
              Homeowners — not window shoppers — who are ready to hire now.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Zap className="h-5 w-5 text-primary" />
            <p className="text-sm font-semibold">Live in seconds</p>
            <p className="text-xs text-muted-foreground">
              Your profile appears the moment payment confirms. No review wait.
            </p>
          </div>
        </div>

        {/* Saved data card */}
        {contractor && (
          <div className="rounded-xl border border-border bg-muted/30 p-5 mb-8">
            <p className="text-sm font-semibold text-foreground mb-3">
              What we saved for you
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-muted-foreground w-24 shrink-0">Business</span>
                <span className="font-medium">{contractor.business_name}</span>
              </div>
              {categoryName && (
                <div className="flex gap-3">
                  <span className="text-muted-foreground w-24 shrink-0">Trade</span>
                  <span>{categoryName}</span>
                </div>
              )}
              {contractor.city && (
                <div className="flex gap-3">
                  <span className="text-muted-foreground w-24 shrink-0">Location</span>
                  <span>{contractor.city}</span>
                </div>
              )}
              {contractor.email && (
                <div className="flex gap-3">
                  <span className="text-muted-foreground w-24 shrink-0">Email</span>
                  <span>{contractor.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {params.error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-6">
            Something went wrong creating your payment session. Please try again.
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {contractor ? (
            <form action={resumeContractorCheckout}>
              <input type="hidden" name="contractor_id" value={contractor.id} />
              <Button type="submit" size="lg" className="w-full gap-2">
                Complete Payment — $50/month
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <Link href="/join">
              <Button size="lg" className="w-full gap-2">
                Finish Your Listing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <p className="text-xs text-center text-muted-foreground">
            $50/month · Cancel anytime · No long-term contract
          </p>
          <Link href="/">
            <Button variant="ghost" className="w-full text-muted-foreground">
              Not right now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
