import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Star, MapPin, Phone, Globe, Shield, Calendar,
  CheckCircle, ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QuoteRequestForm } from "@/components/contractors/quote-request-form";
import { ReviewForm } from "@/components/contractors/review-form";
import { ViewTracker } from "@/components/contractors/ViewTracker";
import { PortfolioGallery } from "@/components/contractors/portfolio-gallery";
import type { Contractor, Category, PortfolioPhoto } from "@/lib/supabase/types";

type ReviewWithProfile = {
  id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  is_anonymous: boolean;
  created_at: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type FullContractor = Contractor & {
  categories: Category | null;
  reviews: ReviewWithProfile[];
  portfolio_photos: PortfolioPhoto[];
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: contractor } = await supabase
    .from("contractors")
    .select("business_name, tagline, city, state, categories(name)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!contractor) return { title: "Contractor Not Found" };

  const c = contractor as unknown as FullContractor;
  return {
    title: c.business_name,
    description: c.tagline
      ?? `${c.business_name} — ${c.categories?.name ?? ""} serving ${c.city}, ${c.state}`,
  };
}

export default async function ContractorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const [{ data: contractor }, { data: { user } }] = await Promise.all([
    supabase
      .from("contractors")
      .select(`
        *,
        categories(*),
        reviews(*, profiles(full_name, avatar_url)),
        portfolio_photos(*)
      `)
      .eq("slug", slug)
      .eq("status", "active")
      .order("created_at", { referencedTable: "reviews", ascending: false })
      .order("sort_order", { referencedTable: "portfolio_photos", ascending: true })
      .single(),
    supabase.auth.getUser(),
  ]);

  if (!contractor) notFound();

  const c = contractor as unknown as FullContractor;

  let userProfile: { full_name: string | null; email: string; phone: string | null } | null = null;
  let hasReviewed = false;
  const isOwner = user?.id != null && c.user_id === user.id;

  if (user) {
    const [{ data: profile }, { data: existingReview }] = await Promise.all([
      supabase.from("profiles").select("full_name, email, phone").eq("id", user.id).single(),
      supabase.from("reviews").select("id").eq("contractor_id", c.id).eq("user_id", user.id).maybeSingle(),
    ]);
    userProfile = profile ?? null;
    hasReviewed = !!existingReview;
  }

  const initials = c.business_name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: c.business_name,
    description: c.description ?? undefined,
    url: `https://sourceatrade.com/contractors/${c.slug}`,
    telephone: c.phone ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressRegion: "FL",
      addressLocality: "30A area",
    },
  };

  if (c.avg_rating !== null && c.review_count > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: c.avg_rating,
      reviewCount: c.review_count,
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker contractorId={c.id} />
      {/* Cover image */}
      {c.cover_url && (
        <div className="relative h-56 sm:h-72 w-full bg-muted overflow-hidden">
          <Image
            src={c.cover_url}
            alt={`${c.business_name} cover`}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left — main content */}
          <div className="space-y-8">
            {/* Business header */}
            <div className="flex gap-4 items-start">
              <Avatar className="h-20 w-20 rounded-2xl flex-shrink-0">
                <AvatarImage src={c.logo_url ?? undefined} alt={c.business_name} />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {c.business_name}
                  </h1>
                  {c.is_featured && (
                    <Badge>Featured</Badge>
                  )}
                </div>

                <p className="text-muted-foreground mt-0.5">
                  {c.categories?.name ?? "Unknown Category"}
                </p>

                {c.tagline && (
                  <p className="text-muted-foreground mt-2 text-sm italic">
                    &ldquo;{c.tagline}&rdquo;
                  </p>
                )}

                {/* Quick stats */}
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {c.avg_rating !== null && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{c.avg_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">
                        ({c.review_count} review{c.review_count !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{c.city}, {c.state}</span>
                  </div>
                  {c.years_experience && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{c.years_experience} yr{c.years_experience !== 1 ? "s" : ""} experience</span>
                    </div>
                  )}
                  {c.years_in_business && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{c.years_in_business} yr{c.years_in_business !== 1 ? "s" : ""} in business</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* About */}
            {c.description && (
              <section>
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {c.description}
                </p>
              </section>
            )}

            {/* Credentials */}
            <section>
              <h2 className="text-lg font-semibold mb-3">Credentials</h2>
              <div className="flex flex-wrap gap-3">
                {c.is_licensed && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
                    <Shield className="h-4 w-4" />
                    <span>Licensed</span>
                    {c.license_number && (
                      <span className="text-green-500">#{c.license_number}</span>
                    )}
                  </div>
                )}
                {c.is_insured && (
                  <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Insured</span>
                  </div>
                )}
                {!c.is_licensed && !c.is_insured && (
                  <p className="text-sm text-muted-foreground">No credentials on file.</p>
                )}
              </div>
            </section>

            {/* Service areas */}
            {c.service_areas.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Service Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {c.service_areas.map((area) => (
                    <Badge key={area} variant="secondary">{area}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio photos */}
            {c.portfolio_photos.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Portfolio</h2>
                <PortfolioGallery
                  photos={c.portfolio_photos}
                  businessName={c.business_name}
                />
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="text-lg font-semibold mb-4">
                Reviews{" "}
                {c.review_count > 0 && (
                  <span className="text-muted-foreground font-normal text-base">
                    ({c.review_count})
                  </span>
                )}
              </h2>

              {c.reviews.length > 0 ? (
                <div className="space-y-4">
                  {c.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {review.is_anonymous || !review.user_id ? (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">A</AvatarFallback>
                              </Avatar>
                            ) : (
                              <Link href={`/profile/${review.user_id}`}>
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={review.profiles?.avatar_url ?? undefined} />
                                  <AvatarFallback className="text-xs">
                                    {review.profiles?.full_name?.[0] ?? "?"}
                                  </AvatarFallback>
                                </Avatar>
                              </Link>
                            )}
                            <div>
                              {review.is_anonymous || !review.user_id ? (
                                <p className="text-sm font-medium text-muted-foreground">Anonymous</p>
                              ) : (
                                <Link
                                  href={`/profile/${review.user_id}`}
                                  className="text-sm font-medium hover:underline underline-offset-2"
                                >
                                  {review.profiles?.full_name ?? "Anonymous"}
                                </Link>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground/30"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <p className="mt-2 font-medium text-sm">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            {review.body}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Be the first to leave one.
                </p>
              )}

              {/* Write a review */}
              {user && !isOwner && !hasReviewed && (
                <div className="mt-6 rounded-xl border border-border p-5">
                  <h3 className="text-base font-semibold mb-4">Write a Review</h3>
                  <ReviewForm contractorId={c.id} businessName={c.business_name} />
                </div>
              )}
              {user && !isOwner && hasReviewed && (
                <p className="mt-4 text-sm text-muted-foreground">You have already reviewed this business.</p>
              )}
              {!user && (
                <p className="mt-4 text-sm text-muted-foreground">
                  <a href="/signup" className="text-primary hover:underline">Sign up to continue</a>
                </p>
              )}
            </section>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-6">
            {/* Contact info card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {c.phone}
                  </a>
                )}
                {c.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{c.address}, {c.city}, {c.state} {c.zip}</span>
                  </div>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Quote request form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request a Quote</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <QuoteRequestForm
                    contractorId={c.id}
                    categoryId={c.categories?.id ?? ""}
                    businessName={c.business_name}
                    defaultName={userProfile?.full_name ?? undefined}
                    defaultEmail={userProfile?.email ?? undefined}
                    defaultPhone={userProfile?.phone ?? undefined}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-5 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a free account to send a quote request.
                    </p>
                    <Link
                      href="/signup"
                      className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      Sign Up to Continue
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
