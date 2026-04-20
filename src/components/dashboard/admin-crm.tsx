import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { AdminLeadStatusSelect } from "./admin-lead-status-select";
import { AdminContractorStatusSelect } from "./admin-contractor-status-select";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function AdminCRMDashboard() {
  const supabase = await createServiceClient();

  const [
    { data: quoteRequests },
    { data: leads },
    { data: contractors },
    { data: emailLog },
  ] = await Promise.all([
    supabase
      .from("quote_requests")
      .select("*, categories(name), quote_request_recipients(id, contractor_id, notified_at, viewed_at, contractors(business_name, email))")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("leads")
      .select("*, contractors(business_name)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("contractors")
      .select("*, categories(name)")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("quote_request_recipients")
      .select("*, quote_requests(name, email, description, categories(name)), contractors(business_name, email)")
      .order("notified_at", { ascending: false })
      .limit(200),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">CRM Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Manage leads, quote requests, and contractors.</p>
      </div>

      <Tabs defaultValue="quote-requests">
        <TabsList className="mb-2">
          <TabsTrigger value="quote-requests">Quote Requests</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
          <TabsTrigger value="email-log">Email Log</TabsTrigger>
        </TabsList>

        {/* Tab 1: Quote Requests */}
        <TabsContent value="quote-requests">
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 text-xs">
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-center">Recipients</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(quoteRequests ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-400 py-10">No quote requests yet.</TableCell>
                  </TableRow>
                )}
                {(quoteRequests ?? []).map((qr: any) => (
                  <TableRow key={qr.id} className="border-neutral-100 align-top">
                    <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{formatDate(qr.created_at)}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{qr.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-neutral-600">{qr.email}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-neutral-600">{qr.phone ?? "—"}</TableCell>
                    <TableCell className="text-sm text-neutral-700">{qr.categories?.name ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-neutral-500 max-w-xs">
                      <span className="line-clamp-2">{qr.description}</span>
                      {qr.timeline && <span className="block text-xs text-neutral-400 mt-0.5">Timeline: {qr.timeline}</span>}
                      <div className="mt-1 space-y-0.5">
                        {(qr.quote_request_recipients ?? []).map((r: any) => (
                          <span key={r.id} className="block text-xs text-neutral-400">
                            → {r.contractors?.business_name}{r.viewed_at ? " (viewed)" : ""}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-sm text-neutral-700">
                      {(qr.quote_request_recipients ?? []).length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: Leads */}
        <TabsContent value="leads">
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 text-xs">
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Service</TableHead>
                  <TableHead>Contractor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(leads ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-400 py-10">No leads yet.</TableCell>
                  </TableRow>
                )}
                {(leads ?? []).map((lead: any) => (
                  <TableRow key={lead.id} className="border-neutral-100">
                    <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{formatDate(lead.created_at)}</TableCell>
                    <TableCell className="font-medium text-neutral-900">{lead.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-neutral-600">{lead.email}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-neutral-600">{lead.service_type ?? "—"}</TableCell>
                    <TableCell className="text-sm text-neutral-700">{lead.contractors?.business_name ?? "—"}</TableCell>
                    <TableCell><AdminLeadStatusSelect leadId={lead.id} currentStatus={lead.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 3: Contractors */}
        <TabsContent value="contractors">
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 text-xs">
                  <TableHead>Business</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead className="hidden md:table-cell">City</TableHead>
                  <TableHead className="hidden lg:table-cell">Licensed</TableHead>
                  <TableHead className="hidden lg:table-cell">Insured</TableHead>
                  <TableHead className="hidden md:table-cell">Listed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(contractors ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-neutral-400 py-10">No contractors yet.</TableCell>
                  </TableRow>
                )}
                {(contractors ?? []).map((c: any) => (
                  <TableRow key={c.id} className="border-neutral-100">
                    <TableCell className="font-medium text-neutral-900">{c.business_name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-neutral-600">{c.categories?.name ?? "—"}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-neutral-600">{c.city}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-neutral-600">{c.is_licensed ? "Yes" : "No"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-neutral-600">{c.is_insured ? "Yes" : "No"}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-neutral-400 whitespace-nowrap">{formatDate(c.created_at)}</TableCell>
                    <TableCell><AdminContractorStatusSelect contractorId={c.id} currentStatus={c.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 4: Email Log */}
        <TabsContent value="email-log">
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 text-xs">
                  <TableHead>Sent At</TableHead>
                  <TableHead>To (Contractor)</TableHead>
                  <TableHead className="hidden md:table-cell">From (Homeowner)</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Viewed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(emailLog ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-neutral-400 py-10">No emails sent yet.</TableCell>
                  </TableRow>
                )}
                {(emailLog ?? []).map((r: any) => (
                  <TableRow key={r.id} className="border-neutral-100">
                    <TableCell className="text-xs text-neutral-400 whitespace-nowrap">{formatDate(r.notified_at)}</TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-neutral-900">{r.contractors?.business_name ?? "—"}</p>
                      <p className="text-xs text-neutral-400">{r.contractors?.email ?? ""}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-neutral-700">{r.quote_requests?.name ?? "—"}</p>
                      <p className="text-xs text-neutral-400">{r.quote_requests?.email ?? ""}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-neutral-600">{r.quote_requests?.categories?.name ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${r.viewed_at ? "bg-green-50 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                        {r.viewed_at ? "Yes" : "No"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
