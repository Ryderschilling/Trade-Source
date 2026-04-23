"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StickyNote, Pencil, Phone, Download, X, Link2 } from "lucide-react";
import { updateLeadStatus, updateLeadNotes } from "@/app/dashboard/actions";
import { LeadMessageButton } from "@/components/dashboard/lead-message-button";
import type { Lead } from "@/lib/supabase/types";

type CRMLead = Omit<Lead, "status"> & { status: LeadStatus; notes: string | null };

type LeadStatus = "new" | "contacted" | "won" | "lost";

const STATUS_TABS: { key: "all" | LeadStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const STATUS_STYLES: Record<LeadStatus, string> = {
  new:       "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-yellow-50 text-yellow-700 border-yellow-200",
  won:       "bg-green-50 text-green-700 border-green-200",
  lost:      "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusSelect({ lead, onUpdate }: { lead: CRMLead; onUpdate: (id: string, s: LeadStatus) => void }) {
  const [pending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as LeadStatus;
    onUpdate(lead.id, newStatus);
    startTransition(async () => {
      await updateLeadStatus(lead.id, newStatus);
    });
  }

  const status = (lead.status as LeadStatus) in STATUS_STYLES ? (lead.status as LeadStatus) : "new";

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={pending}
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium cursor-pointer appearance-none focus:outline-none ${STATUS_STYLES[status]}`}
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="won">Won</option>
      <option value="lost">Lost</option>
    </select>
  );
}

function CopyPhoneButton({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-neutral-600">
      <span>{phone}</span>
      <button
        onClick={handleCopy}
        className="text-neutral-400 hover:text-neutral-700 transition-colors"
        title="Copy phone"
      >
        {copied ? (
          <span className="text-xs text-green-600 font-medium">Copied!</span>
        ) : (
          <Phone className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

function NotesCell({ lead }: { lead: CRMLead }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(lead.notes ?? "");
  const [, startTransition] = useTransition();

  function handleBlur() {
    startTransition(async () => {
      await updateLeadNotes(lead.id, value);
    });
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 transition-colors"
        title={open ? "Hide notes" : "Toggle notes"}
      >
        <StickyNote className="h-3.5 w-3.5" />
        {lead.notes && !open && <Pencil className="h-3 w-3 text-neutral-500" />}
      </button>
      {open && (
        <textarea
          className="mt-1 w-full min-w-[200px] rounded border border-neutral-200 bg-neutral-50 p-2 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-300 resize-none"
          rows={3}
          placeholder="Add notes…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
        />
      )}
    </div>
  );
}

function exportCSV(leads: CRMLead[]) {
  const headers = ["Name", "Email", "Phone", "Service", "Status", "Date", "Notes"];
  const rows = leads.map((l) => [
    l.name,
    l.email,
    l.phone ?? "",
    l.service_type ?? "",
    l.status,
    formatDate(l.created_at),
    (l.notes ?? "").replace(/"/g, '""'),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function CopyReviewLinkButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/contractors/${slug}?review=open`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div>
      <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1.5">
        Review Link
      </p>
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1.5 min-w-0 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
          <Link2 className="h-3 w-3 shrink-0 text-neutral-400" />
          <span className="truncate">/contractors/{slug}?review=open</span>
        </div>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          {copied ? <span className="text-green-600">Copied!</span> : "Copy"}
        </button>
      </div>
      <p className="text-[10px] text-neutral-400 mt-1">
        Send to your client to request a review
      </p>
    </div>
  );
}

function LeadDetailModal({
  lead,
  onClose,
  onStatusUpdate,
  contractorSlug,
}: {
  lead: CRMLead;
  onClose: () => void;
  onStatusUpdate: (id: string, s: LeadStatus) => void;
  contractorSlug?: string;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [, startTransition] = useTransition();

  function handleNotesSave() {
    startTransition(async () => {
      await updateLeadNotes(lead.id, notes);
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-0 sm:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-neutral-100">
          <div>
            <p className="font-semibold text-neutral-900 text-base">{lead.name}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{lead.email}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 transition-colors p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">Service</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm text-neutral-700">{lead.service_type ?? "—"}</p>
                {lead.package_name && (
                  <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                    Package
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">Date</p>
              <p className="text-sm text-neutral-700">{formatDate(lead.created_at)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-2">Contact</p>
              <div className="flex flex-col gap-1.5">
                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
                    {lead.phone}
                  </a>
                )}
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  <span className="text-neutral-400 text-xs shrink-0">@</span>
                  <span className="truncate">{lead.email}</span>
                </a>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">Status</p>
              <StatusSelect lead={lead} onUpdate={onStatusUpdate} />
            </div>
          </div>

          {lead.message && (
            <div>
              <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">Message</p>
              <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-100">{lead.message}</p>
            </div>
          )}

          <div>
            <p className="text-[11px] text-neutral-400 font-medium uppercase tracking-wide mb-1">Notes</p>
            <textarea
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-300 resize-none"
              rows={3}
              placeholder="Add notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesSave}
            />
          </div>

          {lead.status === "won" && contractorSlug && (
            <CopyReviewLinkButton slug={contractorSlug} />
          )}
        </div>

        <div className="px-5 pb-5">
          <LeadMessageButton leadId={lead.id} />
        </div>
      </div>
    </div>,
    document.body
  );
}

const EMPTY_MESSAGES: Record<string, string> = {
  all:       "No leads yet — your first inquiry will appear here.",
  new:       "No new leads right now.",
  contacted: "No leads marked as contacted yet.",
  won:       "No won leads yet — keep following up!",
  lost:      "No lost leads.",
};

export function LeadCRMTable({ leads: initialLeads, contractorSlug }: { leads: CRMLead[]; contractorSlug?: string }) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeTab, setActiveTab] = useState<"all" | LeadStatus>("all");
  const [selectedLead, setSelectedLead] = useState<CRMLead | null>(null);

  function handleStatusUpdate(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  const counts = {
    all:       leads.length,
    new:       leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    won:       leads.filter((l) => l.status === "won").length,
    lost:      leads.filter((l) => l.status === "lost").length,
  };

  const filtered = activeTab === "all" ? leads : leads.filter((l) => l.status === activeTab);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeTab === tab.key ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-500"
              }`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors self-start sm:self-auto"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 px-6 py-10 text-center text-sm text-neutral-500">
          {EMPTY_MESSAGES[activeTab]}
        </div>
      ) : (
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 bg-neutral-50 text-xs">
                <TableHead className="text-neutral-500 font-medium">Name</TableHead>
                <TableHead className="hidden sm:table-cell text-neutral-500 font-medium">Service</TableHead>
                <TableHead className="hidden md:table-cell text-neutral-500 font-medium">Phone</TableHead>
                <TableHead className="hidden md:table-cell text-neutral-500 font-medium">Date</TableHead>
                <TableHead className="text-neutral-500 font-medium">Status</TableHead>
                <TableHead className="hidden sm:table-cell text-neutral-500 font-medium">Notes</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow key={lead.id} className="border-neutral-100 align-top">
                  <TableCell>
                    <p className="font-medium text-neutral-900 text-sm truncate max-w-[120px]">{lead.name}</p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-neutral-600">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{lead.service_type ?? "—"}</span>
                      {lead.package_name && (
                        <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                          Package
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {lead.phone ? <CopyPhoneButton phone={lead.phone} /> : (
                      <span className="text-sm text-neutral-400">{lead.preferred_contact}</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-neutral-400">
                    {formatDate(lead.created_at)}
                  </TableCell>
                  <TableCell>
                    <StatusSelect lead={lead} onUpdate={handleStatusUpdate} />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <NotesCell lead={lead} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      >
                        View
                      </button>
                      <div className="hidden sm:block">
                        <LeadMessageButton leadId={lead.id} />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {selectedLead && (
        <LeadDetailModal
          lead={leads.find((l) => l.id === selectedLead.id) ?? selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={handleStatusUpdate}
          contractorSlug={contractorSlug}
        />
      )}
    </div>
  );
}
