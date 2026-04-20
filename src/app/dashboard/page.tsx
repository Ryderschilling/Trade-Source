import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, TrendingUp, Users, Inbox, ArrowRight, Building2, ExternalLink, Pencil, ImageIcon, Search } from "lucide-react";
import type { PortfolioPhoto } from "@/lib/supabase/types";
import { AdminCRMDashboard } from "@/components/dashboard/admin-crm";
import { NotificationBell } from "@/components/dashboard/notification-bell";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function LeadStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new:       { label: "New",       cls: "bg-blue-50 text-blue-700 border-blue-200" },
    viewed:    { label: "Viewed",    cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    contacted: { label: "Contacted", cls: "bg-green-50 text-green-700 border-green-200" },
    closed:    { label: "Closed",    cls: "bg-neutral-100 text-neutral-500 border-neutral-200" },
  };
  const s = map[status] ?? map["new"];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}


async function ContractorDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: contractor }, { data: allLeads }, { data: quoteRecipients }, { data: unreadNotifs }, { data: recentNotifs }] = await Promise.all([
    supabase
      .from("contractors")
      .select("*, categories(name), portfolio_photos(*)")
      .eq("user_id", userId)
      .order("sort_order", { referencedTable: "portfolio_photos", ascending: true })
      .maybeSingle(),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50),
    supabase
      .from("quote_request_recipients")
      .select("*, quote_requests(name, email, description, timeline, categories(name))")
      .order("notified_at", { ascending: false })
      .limit(30),
    supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("read", false),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Fetch reviews after we know the contractor id
  const contractorId = (contractor as any)?.id as string | undefined;
  const { data: recentReviews } = contractorId
    ? await supabase
        .from("reviews")
        .select("*, profiles(full_name)")
        .eq("contractor_id", contractorId)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const portfolioPhotos: PortfolioPhoto[] = (contractor as any)?.portfolio_photos ?? [];
  const myLeads = contractor ? (allLeads ?? []).filter((l: any) => l.contractor_id === contractor.id) : [];
  const newLeads = myLeads.filter((l: any) => l.status === "new").length;
  const myQuoteRecipients = contractor
    ? (quoteRecipients ?? []).filter((r: any) => r.contractor_id === contractor.id)
    : [];
  const unreadCount = (unreadNotifs ?? []).length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Business Dashboard</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-neutral-500">{contractor?.business_name ?? "Your Trade Source listing"}</p>
            {contractor?.status === "active" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Live
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell
            initialCount={unreadCount}
            initialNotifications={recentNotifs ?? []}
          />
          <Link href={`/profile/${userId}`}>
            <Button variant="outline" size="sm" className="gap-1.5">View My Profile <ExternalLink className="h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      </div>

      {!contractor && (
        <div className="space-y-8">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-6 py-12 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-neutral-400" />
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900">
              List Your Business — It&apos;s Free
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
              Reach homeowners and property managers searching for local tradesmen on the 30A corridor.
            </p>
            <Link href="/join">
              <Button className="mt-6 bg-neutral-900 px-6 hover:bg-neutral-800">
                Get Started — Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Search className="h-4 w-4 text-neutral-700" />
                </div>
                <CardTitle className="text-sm font-semibold text-neutral-900">Get Found Locally</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed text-neutral-500">
                  Homeowners and property managers in 30A search here first. Show up when they need you.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <Star className="h-4 w-4 text-neutral-700" />
                </div>
                <CardTitle className="text-sm font-semibold text-neutral-900">Build Your Reputation</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed text-neutral-500">
                  Collect verified reviews from real local customers and stand out from the competition.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-neutral-200">
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100">
                  <TrendingUp className="h-4 w-4 text-neutral-700" />
                </div>
                <CardTitle className="text-sm font-semibold text-neutral-900">Grow for Free</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed text-neutral-500">
                  No subscription required to get started. List your services, show your work, and get more calls.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Leads",  value: myLeads.length, icon: <Inbox className="h-4 w-4" /> },
          { label: "New Leads",    value: newLeads,        icon: <TrendingUp className="h-4 w-4" />, hi: newLeads > 0 },
          { label: "Avg Rating",   value: contractor?.avg_rating ? Number(contractor.avg_rating).toFixed(1) : "—", icon: <Star className="h-4 w-4" /> },
          { label: "Reviews",      value: contractor?.review_count ?? 0, icon: <Users className="h-4 w-4" /> },
        ].map((s) => (
          <Card key={s.label} className="border-neutral-200">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1.5 text-xs">{s.icon}{s.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-semibold tracking-tight ${"hi" in s && s.hi ? "text-blue-600" : "text-neutral-900"}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Recent Leads</CardTitle>
          <CardDescription className="text-xs">Customer inquiries sent to your listing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {myLeads.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-500">No leads yet — your first inquiry will appear here.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-neutral-200 text-xs">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Service</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myLeads.slice(0, 20).map((lead: any) => (
                  <TableRow key={lead.id} className="border-neutral-100">
                    <TableCell>
                      <p className="font-medium text-neutral-900">{lead.name}</p>
                      <p className="text-xs text-neutral-500">{lead.email}</p>
                    </TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 sm:table-cell">{lead.service_type ?? "—"}</TableCell>
                    <TableCell className="hidden text-sm text-neutral-600 md:table-cell">{lead.phone ?? lead.preferred_contact}</TableCell>
                    <TableCell className="hidden text-xs text-neutral-400 md:table-cell">{formatDate(lead.created_at)}</TableCell>
                    <TableCell><LeadStatusBadge status={lead.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quote Requests card */}
      <QuoteRequestsCard contractorId={contractor?.id} recipients={myQuoteRecipients} />

      {/* Recent Reviews card */}
      <Card className="border-neutral-200">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Recent Reviews</CardTitle>
          <CardDescription className="text-xs">Customer reviews for your listing</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {(recentReviews ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-500">No reviews yet — reviews will appear here.</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {(recentReviews ?? []).map((review: any) => (
                <div key={review.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{review.profiles?.full_name ?? "Anonymous"}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{formatDate(review.created_at)}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-neutral-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.title && <p className="mt-2 text-sm font-medium text-neutral-800">{review.title}</p>}
                  {review.body && <p className="mt-1 text-sm text-neutral-500 line-clamp-3">{review.body}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {contractor && (
        <Card className="border-neutral-200">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {contractor.logo_url ? (
                  <Image
                    src={contractor.logo_url}
                    alt={contractor.business_name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-lg object-cover border border-neutral-200 shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 shrink-0">
                    <Building2 className="h-6 w-6 text-neutral-400" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-base font-semibold text-neutral-900">{contractor.business_name}</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">{(contractor.categories as any)?.name} · {contractor.city}, {contractor.state}</CardDescription>
                  {contractor.tagline && <p className="mt-1 text-xs text-neutral-500 italic">&ldquo;{contractor.tagline}&rdquo;</p>}
                </div>
              </div>
              <Link href="/dashboard/edit">
                <Button variant="outline" size="sm" className="gap-1.5 shrink-0 text-xs">
                  <Pencil className="h-3.5 w-3.5" />Edit Listing
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                { label: "Licensed",          value: contractor.is_licensed ? "Yes" : "No" },
                { label: "Insured",           value: contractor.is_insured ? "Yes" : "No" },
                { label: "Yrs Experience",   value: contractor.years_experience ?? "—" },
                { label: "Yrs in Business",   value: contractor.years_in_business ?? "—" },
                { label: "Service Areas",     value: contractor.service_areas?.join(", ") || "30A" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-neutral-500">{item.label}</p>
                  <p className="mt-0.5 font-medium text-neutral-900 text-sm">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 border-t border-neutral-100 pt-4">
              {[
                { label: "Phone",   value: contractor.phone   ?? "—" },
                { label: "Email",   value: contractor.email   ?? "—" },
                { label: "Website", value: contractor.website ?? "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-neutral-500">{item.label}</p>
                  <p className="mt-0.5 font-medium text-neutral-900 text-sm truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {contractor.description && (
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-xs text-neutral-500 mb-1">About</p>
                <p className="text-sm text-neutral-700 line-clamp-3">{contractor.description}</p>
              </div>
            )}

            {portfolioPhotos.length > 0 ? (
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-xs text-neutral-500 mb-2">Portfolio ({portfolioPhotos.length} photo{portfolioPhotos.length !== 1 ? "s" : ""})</p>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {portfolioPhotos.slice(0, 6).map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-md overflow-hidden bg-neutral-100">
                      <Image
                        src={photo.url}
                        alt={photo.caption ?? `${contractor.business_name} photo`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 25vw, 16vw"
                      />
                    </div>
                  ))}
                  {portfolioPhotos.length > 6 && (
                    <div className="relative aspect-square rounded-md overflow-hidden bg-neutral-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-neutral-500">+{portfolioPhotos.length - 6}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-neutral-100 pt-4 flex items-center gap-2 text-xs text-neutral-400">
                <ImageIcon className="h-4 w-4" />
                <span>No portfolio photos yet — <Link href="/dashboard/edit" className="text-neutral-700 underline underline-offset-4">add some</Link> to stand out.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuoteRequestsCard({ contractorId, recipients }: { contractorId?: string; recipients: any[] }) {
  if (!contractorId) return null;
  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900">Quote Requests</CardTitle>
        <CardDescription className="text-xs">Homeowners who requested a quote from you</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {recipients.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">No quote requests yet.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 text-xs">
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="hidden md:table-cell">Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((r: any) => (
                <QuoteRecipientRow key={r.id} recipient={r} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function QuoteRecipientRow({ recipient }: { recipient: any }) {
  const qr = recipient.quote_requests;
  const desc = qr?.description ?? "";
  return (
    <TableRow className="border-neutral-100">
      <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{formatDate(recipient.notified_at)}</TableCell>
      <TableCell>
        <p className="font-medium text-neutral-900">{qr?.name ?? "—"}</p>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-sm text-neutral-600">{qr?.categories?.name ?? "—"}</TableCell>
      <TableCell className="hidden md:table-cell text-sm text-neutral-500 max-w-xs">
        <span className="line-clamp-2">{desc.length > 80 ? desc.slice(0, 77) + "…" : desc}</span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-sm text-neutral-500">{qr?.timeline ?? "—"}</TableCell>
    </TableRow>
  );
}

async function HomeownerDashboard({ userId, name }: { userId: string; email: string; name: string }) {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from("reviews").select("*, contractors(business_name, slug)")
    .eq("user_id", userId).order("created_at", { ascending: false }).limit(20);

  return (
    <div className="space-y-8">
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
            <p className="mt-1 text-sm text-neutral-500">List your business free — no lead fees, no commission.</p>
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
            ? <ContractorDashboard userId={user.id} />
            : <HomeownerDashboard userId={user.id} email={user.email ?? ""} name={profile.full_name ?? user.email ?? "there"} />
        }
      </div>
    </main>
  );
}
