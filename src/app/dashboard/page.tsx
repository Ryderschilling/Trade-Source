import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ArrowRight, Building2, Plus } from "lucide-react";
import { AdminCRMDashboard } from "@/components/dashboard/admin-crm";
import { AddressPromptModal } from "@/components/dashboard/address-prompt-modal";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function ContractorBusinessList({ userId }: { userId: string }) {
  const supabase = await createClient();
  const { data: contractors } = await supabase
    .from("contractors")
    .select("id, business_name, logo_url, status, city, state, avg_rating, review_count, categories(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const businesses = contractors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">My Businesses</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {businesses.length === 0
              ? "Manage your listings on Source A Trade."
              : businesses.length === 1
              ? "1 listing on Source A Trade"
              : `${businesses.length} listings on Source A Trade`}
          </p>
        </div>
        {businesses.length > 0 && (
          <Link href="/join">
            <Button size="sm" className="bg-neutral-900 hover:bg-neutral-800 gap-1.5">
              <Plus className="h-4 w-4" /> Add Business
            </Button>
          </Link>
        )}
      </div>

      {businesses.length === 0 ? (
        <div className="space-y-8">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-neutral-400" />
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">List Your Business</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
              Reach homeowners and property managers searching for local tradesmen on the 30A corridor.
            </p>
            <Link href="/join">
              <Button className="mt-6 bg-neutral-900 px-6 hover:bg-neutral-800">
                List Your Business Today
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => {
            const statusColor =
              b.status === "active"
                ? "bg-green-100 text-green-700"
                : b.status === "suspended"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700";
            const statusLabel =
              b.status === "active" ? "Live" : b.status === "suspended" ? "Suspended" : "Pending";

            return (
              <Link key={b.id} href={`/dashboard/${b.id}`} className="group block">
                <div className="rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-400 hover:shadow-sm transition-all h-full flex flex-col">
                  <div className="flex items-start gap-4 flex-1">
                    {b.logo_url ? (
                      <Image
                        src={b.logo_url}
                        alt={b.business_name}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-lg object-cover border border-neutral-200 shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 shrink-0">
                        <Building2 className="h-5 w-5 text-neutral-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-neutral-900 truncate">{b.business_name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-neutral-500 truncate">
                        {(b.categories as any)?.name} · {b.city}, {b.state}
                      </p>
                      {b.avg_rating ? (
                        <p className="mt-1 text-xs text-neutral-400 flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number(b.avg_rating).toFixed(1)} ({b.review_count} review{b.review_count !== 1 ? "s" : ""})
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-neutral-400 border-t border-neutral-100 pt-3">
                    <span>Manage listing</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function HomeownerDashboard({ userId, name, hasAddress }: { userId: string; email: string; name: string; hasAddress: boolean }) {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews").select("*, contractors(business_name, slug)")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);

  return (
    <div className="space-y-8">
      <AddressPromptModal hasAddress={hasAddress} />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Welcome back, {name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-neutral-500">Find and manage your connections with local tradesmen.</p>
      </div>
      <Card className="border-neutral-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold text-neutral-900">Your Reviews</CardTitle>
              <CardDescription className="text-xs">Reviews you&apos;ve left for local businesses</CardDescription>
            </div>
            <Link href="/contractors"><Button variant="outline" size="sm" className="gap-1 text-xs">Find a Pro <ArrowRight className="h-3 w-3" /></Button></Link>
          </div>
        </CardHeader>
        <CardContent>
          {!reviews || reviews.length === 0 ? (
            <div className="py-8 text-center text-sm text-neutral-500">
              No reviews yet. <Link href="/contractors" className="text-neutral-900 underline underline-offset-4">Find a pro to review.</Link>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {reviews.map((review: any) => (
                <div key={review.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/contractors/${review.contractors?.slug ?? ""}`} className="font-medium text-neutral-900 hover:underline underline-offset-4">
                        {review.contractors?.business_name ?? "Business"}
                      </Link>
                      {review.title && <p className="mt-0.5 text-sm font-medium text-neutral-700">{review.title}</p>}
                      {review.body && <p className="mt-1 text-sm text-neutral-500 line-clamp-2">{review.body}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">{formatDate(review.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-neutral-200 bg-neutral-50">
        <CardContent className="flex items-center justify-between gap-6 p-6">
          <div>
            <h3 className="font-semibold text-neutral-900">Are you a local tradesman?</h3>
            <p className="mt-1 text-sm text-neutral-500">$50/month — no lead fees, no commission.</p>
          </div>
          <Link href="/join" className="shrink-0">
            <Button className="bg-neutral-900 hover:bg-neutral-800 gap-1.5">List Your Business <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {profile.role === "admin"
          ? <AdminCRMDashboard />
          : profile.role === "contractor"
            ? <ContractorBusinessList userId={user.id} />
            : <HomeownerDashboard userId={user.id} email={user.email ?? ""} name={profile.full_name ?? user.email ?? "there"} hasAddress={!!profile.address} />
        }
      </div>
    </main>
  );
}
