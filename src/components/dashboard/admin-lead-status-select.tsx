"use client";

import { useState } from "react";

const STATUSES = ["new", "viewed", "contacted", "closed"] as const;
type Status = typeof STATUSES[number];

const LABELS: Record<Status, string> = {
  new: "New",
  viewed: "Viewed",
  contacted: "Contacted",
  closed: "Closed",
};

export function AdminLeadStatusSelect({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Status;
    setLoading(true);
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      setStatus(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{LABELS[s]}</option>
      ))}
    </select>
  );
}
