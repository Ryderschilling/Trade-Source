import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, TrendingUp, Users, Inbox, ArrowRight, Building2, CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";

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

function ListingStatusBanner({ status }: { status: string }) {
  if (status === "active") return (
    <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <span>Your listing is <strong>live</strong> — customers can find your business on Trade Source.</span>
      <Link href="/contractors" className="ml-auto flex items-center gap-1 text-green-700 underline-offset-4 hover:underline">View listing <ExternalLink className="h-3 w-3" /></Link>
    </div>
  );
  if (status === "pending") return (
    <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
      <Clock className="h-4 w-4 shrink-0" />
      <span>Your listing is <strong>under review</strong> — we'll activate it within 24 hours.</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>Your listing is <strong>suspended</strong>. Contact us at <a href="mailto:hello@sourceatrade.com" className="underline">hello@sourceatrade.com</a>.</span>
    </div>
  );
}

async function ContractorDashboard({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: contractor }, { data: allLeads }] = await Promise.all([
    supabase.from("contractors").select("*, categories(name)").eq("user_id", userId).maybeSingle(),
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  const myLeads = contractor ? (allLeads ?? []).filter((l: any) => l.contractor_id === contractor.id) : [];
  const newLeads = myLeads.filter((l: any) => l.status === "new").length;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Business Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-500">{contractor?.business_name ?? "Your Trade Source listing"}</p>
        </div>
        <Link href={`/profile/${userId}`}>
          <Button variant="outline" size="sm" className="gap-1.5">View My Profile <ExternalLink className="h-3.5 w-3.5" /></Button>
        </Link>
      </div>

      {contractor ? (
        <ListingStatusBanner status={contractor.status} />
      ) : (
        <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-neutral-400" />
          <h3 className="font-medium text-neutral-900">No listing yet</h3>
          <p className="mt-1 text-sm text-neutral-500">Get in front of homeowners on the 30A corridor — free to list.</p>
          <Link href="/join"><Button className="mt-4 bg-neutral-900 hover:bg-neutral-800" size="sm">List Your Business</Button></Link>
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

      {contractor && (
        <Card className="border-neutral-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-neutral-900">{contractor.business_name}</CardTitle>
                <CardDescription className="mt-0.5 text-xs">{(contractor.categories as any)?.name} · {contractor.city}, {contractor.state}</CardDescription>
              </div>
              <Link href="/join"><Button variant="outline" size="sm" className="text-xs">Edit Listing</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {[
              { label: "Licensed",         value: contractor.is_licensed ? "Yes" : "No" },
              { label: "Insured",          value: contractor.is_insured ? "Yes" : "No" },
              { label: "Years in Business",value: contractor.years_in_business ?? "—" },
              { label: "Service Areas",    value: contractor.service_areas?.join(", ") || "30A" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-neutral-500">{item.label}</p>
                <p className="mt-0.5 font-medium text-neutral-900">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
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
              <CardDescription className="text-xs">Reviews you've left for local businesses</CardDescription>
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
  const isContractor = profile.role === "contractor" || profile.role === "admin";
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {isContractor
          ? <ContractorDashboard userId={user.id} />
          : <HomeownerDashboard userId={user.id} email={user.email ?? ""} name={profile.full_name ?? user.email ?? "there"} />
        }
      </div>
    </main>
  );
}
