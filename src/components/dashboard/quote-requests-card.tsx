"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Mail, Phone, Clock, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteMessageButton } from "@/components/dashboard/quote-message-button";

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type Recipient = {
  id: string;
  notified_at: string;
  quote_request_id: string | null;
  quote_requests: {
    name: string;
    email: string;
    phone: string | null;
    description: string;
    timeline: string | null;
    categories: { name: string } | null;
  } | null;
};

function QuoteRequestRow({ r }: { r: Recipient }) {
  const [open, setOpen] = useState(false);
  const qr = r.quote_requests;
  if (!qr) return null;

  return (
    <div className="border-b border-neutral-100 last:border-0">
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-6 py-4 flex items-start gap-3 hover:bg-neutral-50 transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-4 items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-neutral-900">{qr.name}</span>
              {qr.categories?.name && (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  <Tag className="h-3 w-3" />{qr.categories.name}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-neutral-400">{formatDate(r.notified_at)}</p>
            <p className="mt-1 text-sm text-neutral-500 line-clamp-1">{qr.description}</p>
          </div>
          <div className="flex items-center gap-2 sm:justify-end shrink-0">
            {r.quote_request_id && (
              <span onClick={(e) => e.stopPropagation()}>
                <QuoteMessageButton quoteRequestId={r.quote_request_id} />
              </span>
            )}
            {open ? (
              <ChevronUp className="h-4 w-4 text-neutral-400 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-neutral-400 shrink-0" />
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="px-6 pb-5 bg-neutral-50 border-t border-neutral-100">
          <div className="pt-4 space-y-4">
            <div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Project Description</p>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{qr.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400">Email</p>
                  <a href={`mailto:${qr.email}`} className="text-sm text-neutral-900 hover:underline underline-offset-4 truncate block">{qr.email}</a>
                </div>
              </div>
              {qr.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div>
                    <p className="text-xs text-neutral-400">Phone</p>
                    <a href={`tel:${qr.phone}`} className="text-sm text-neutral-900 hover:underline underline-offset-4">{qr.phone}</a>
                  </div>
                </div>
              )}
              {qr.timeline && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-neutral-400 shrink-0" />
                  <div>
                    <p className="text-xs text-neutral-400">Timeline</p>
                    <p className="text-sm text-neutral-900">{qr.timeline}</p>
                  </div>
                </div>
              )}
            </div>

            {r.quote_request_id && (
              <div className="pt-1">
                <span onClick={(e) => e.stopPropagation()}>
                  <QuoteMessageButton quoteRequestId={r.quote_request_id} />
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function QuoteRequestsCard({ contractorId, recipients }: { contractorId?: string; recipients: any[] }) {
  if (!contractorId) return null;
  return (
    <Card className="border-neutral-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-neutral-900">Quote Requests</CardTitle>
        <CardDescription className="text-xs">Homeowners who requested a quote from you — click a row to expand</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {recipients.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-neutral-500">No quote requests yet.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recipients.map((r: any) => (
              <QuoteRequestRow key={r.id} r={r} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
