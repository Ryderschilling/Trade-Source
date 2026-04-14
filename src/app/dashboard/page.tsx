import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MessageSquare, Star, Eye, TrendingUp, ArrowRight,
  Clock, CheckCircle, XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Dashboard",
};

function statusBadge(status: string) {
  switch (status) {
    case "new":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400">New</Badge>;
    case "viewed":
      return <Badge variant="secondary">Viewed</Badge>;
    case "contacted":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-950/30 dark:text-green-400">Contacted</Badge>;
    case "closed":
      return <Badge variant="outline" className="text-muted-foreground">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard");

  // Fetch contractor owned by this user
  const { data: contractor } = await supabase
    .from("contractors")
    .select("*, categories(name)")
    .eq("user_id", user.id)
    .maybeSingle();

  // Fetch leads if contractor exists
  const { data: leads } = contractor
    ? await supabase
        .from("leads")
        .select("*")
        .eq("contractor_id", contractor.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] };

  const newLeadCount = leads?.filter((l) => l.status === "new").length ?? 0;
  const totalLeads = leads?.length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-muted/40 border-b border-border py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back, {user.email}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">
        {/* No listing yet */}
        {!contractor && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center space-y-4">
              <p className="text-muted-foreground">
                You don&apos;t have a contractor listing yet.
              </p>
              <Link href="/join">
                <Button>
                  List Your Business
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {contractor && (
          <>
            {/* Listing status banner */}
            {contractor.status !== "active" && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 flex items-center gap-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  Your listing is <strong>{contractor.status}</strong> — under
                  review. We&apos;ll notify you by email once it&apos;s approved.
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-950/30">
                    <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalLeads}</p>
                    <p className="text-sm text-muted-foreground">Total Leads</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-orange-100 p-3 dark:bg-orange-950/30">
                    <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{newLeadCount}</p>
                    <p className="text-sm text-muted-foreground">New Leads</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-yellow-100 p-3 dark:bg-yellow-950/30">
                    <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {contractor.avg_rating !== null
                        ? Number(contractor.avg_rating).toFixed(1)
                        : "—"}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="rounded-xl bg-green-100 p-3 dark:bg-green-950/30">
                    <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{contractor.review_count}</p>
                    <p className="text-sm text-muted-foreground">Reviews</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Listing summary */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Your Listing</CardTitle>
                <div className="flex items-center gap-2">
                  {contractor.status === "active" ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <XCircle className="mr-1 h-3 w-3" />
                      {contractor.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{contractor.business_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(contractor.categories as { name: string } | null)?.name} ·{" "}
                      {contractor.city}, {contractor.state}
                    </p>
                  </div>
                  {contractor.status === "active" && (
                    <Link href={`/contractors/${contractor.slug}`}>
                      <Button variant="outline" size="sm">
                        View Listing
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Leads table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Leads</CardTitle>
              </CardHeader>
              <Separator />
              {leads && leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                          Name
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden sm:table-cell">
                          Contact
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden md:table-cell">
                          Service
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-medium hidden lg:table-cell">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium">{lead.name}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                            <div>{lead.email}</div>
                            {lead.phone && (
                              <div className="text-xs">{lead.phone}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {lead.service_type ?? (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{statusBadge(lead.status)}</td>
                          <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No leads yet. Once your listing is live, quote requests will
                  appear here.
                </CardContent>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
