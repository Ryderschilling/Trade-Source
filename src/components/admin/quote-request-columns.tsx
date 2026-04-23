'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from './data-table';

export interface QuoteRequestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  timeline: string | null;
  category_name: string | null;
  followup_sent_at: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const quoteRequestColumns: ColumnDef<QuoteRequestRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Requester',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-neutral-900">{row.original.name}</p>
        <p className="text-xs text-neutral-400">{row.original.email}</p>
        {row.original.phone && (
          <p className="text-xs text-neutral-400">{row.original.phone}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'category_name',
    header: 'Category',
    cell: ({ getValue }) => (
      <span className="text-neutral-700 text-sm">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Request',
    cell: ({ getValue }) => (
      <p className="text-neutral-600 text-xs max-w-xs truncate">{getValue() as string}</p>
    ),
  },
  {
    accessorKey: 'timeline',
    header: 'Timeline',
    cell: ({ getValue }) => (
      <span className="text-neutral-600 text-xs">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'followup_sent_at',
    header: 'Follow-up',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return v
        ? <Badge variant="default" className="text-xs">Sent {formatDate(v)}</Badge>
        : <Badge variant="secondary" className="text-xs">Pending</Badge>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{formatDate(getValue() as string)}</span>
    ),
  },
];

export function QuoteRequestsTable({ data }: { data: QuoteRequestRow[] }) {
  return (
    <DataTable
      columns={quoteRequestColumns}
      data={data}
      searchPlaceholder="Search by name, email, or category…"
    />
  );
}
