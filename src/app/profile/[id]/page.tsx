import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Star, MapPin, Pencil, ExternalLink, ShieldCheck, Building2 } from "lucide-react";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { NearbyBusinesses } from "@/components/profile/nearby-businesses";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, bio")
    .eq("id", id)
    .single();

  if (!profile) return { title: "Profile Not Found" };

  const name = (profile as any).full_name ?? "Trade Source Member";
  const metadata: Metadata = {
    title: `${name} — Trade Source`,
    description: (profile as any).bio ?? `View ${name}'s profile on Trade Source`,
  };

  if ((profile as any).avatar_url) {
    metadata.openGraph = { images: [(profile as any).avatar_url] };
  }

  return metadata;
}

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === id;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!profile) notFound();

  if ((profile as any).is_public === false && !isOwner) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-neutral-300" />
          <h1 className="text-xl font-semibold text-neutral-900">This profile is private</h1>
          <p className="mt-2 text-sm text-neutral-500">This user has set their profile to private.</p>
          <Link href="/" className="mt-6 inline-block"><Button variant="outline" size="sm">Back to Home</Button></Link>
        </div>
      </main>
    );
  }

  const [
    { data: reviews },
    { data: contractor },
  ] = await Promise.all([
    supabase.from("reviews").select("*, contractors(business_name, slug, city)").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("contractors").select("*, categories(name)").eq("user_id", id).eq("status", "active").maybeSingle(),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-start gap-5">
          {isOwner ? (
            <AvatarUpload
              userId={id}
              initialAvatarUrl={profile.avatar_url}
              name={profile.full_name}
              email={profile.email}
            />
          ) : profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="h-16 w-16 rounded-full object-cover ring-2 ring-neutral-100 sm:h-20 sm:w-20" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-lg font-semibold text-white ring-2 ring-neutral-100 sm:h-20 sm:w-20 sm:text-xl">
              {initials(profile.full_name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">{profile.full_name ?? "Trade Source Member"}</h1>
              {profile.role === "contractor" && (
                <Badge variant="secondary" className="border-neutral-200 bg-neutral-100 text-neutral-700 text-xs">Pro</Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
              {(profile as any).city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{(profile as any).city}</span>}
              <span>Member since {formatDate(profile.created_at)}</span>
            </div>
            {isOwner && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-400">
                <span>{profile.email}</span>
                {(profile as any).phone && <span>{(profile as any).phone}</span>}
              </div>
            )}
          </div>
          {isOwner && (
            <Link href="/profile/edit" className="shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-3.5 w-3.5" />Edit Profile</Button>
            </Link>
          )}
        </div>

        {(profile as any).bio && <p className="mt-5 text-sm leading-relaxed text-neutral-600 max-w-2xl">{(profile as any).bio}</p>}

        {contractor && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">Business</h2>
            <Card className="border-neutral-200">
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  {contractor.logo_url ? (
                    <img src={contractor.logo_url} alt={contractor.business_name} className="h-12 w-12 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-neutral-100"><Building2 className="h-5 w-5 text-neutral-400" /></div>
                  )}
                  <div>
                    <p className="font-semibold text-neutral-900">{contractor.business_name}</p>
                    <p className="text-xs text-neutral-500">{(contractor.categories as any)?.name} · {contractor.city}, {contractor.state}</p>
                    {contractor.avg_rating && (
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs text-neutral-500">{Number(contractor.avg_rating).toFixed(1)} ({contractor.review_count} reviews)</span>
                      </div>
                    )}
                  </div>
                </div>
                <Link href={`/contractors/${contractor.slug}`}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs shrink-0">View Listing <ExternalLink className="h-3 w-3" /></Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-neutral-400">Reviews Written</h2>
          {!reviews || reviews.length === 0 ? (
            <p className="text-sm text-neutral-500">No reviews written yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <Card key={review.id} className="border-neutral-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link href={`/contractors/${review.contractors?.slug ?? ""}`} className="font-semibold text-neutral-900 hover:underline underline-offset-4 text-sm">
                          {review.contractors?.business_name ?? "Business"}
                        </Link>
                        {review.contractors?.city && <p className="text-xs text-neutral-400">{review.contractors.city}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`} />
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {review.title && <p className="text-sm font-medium text-neutral-800">{review.title}</p>}
                    {review.body && <p className="mt-1 text-sm text-neutral-600">{review.body}</p>}
                    <p className="mt-2 text-xs text-neutral-400">{formatDate(review.created_at)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <NearbyBusinesses profileCity={(profile as any).city ?? null} />
      </div>
    </main>
  );
}
