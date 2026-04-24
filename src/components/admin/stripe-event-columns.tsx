'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from './data-table';

export interface StripeEventRow {
  id: string;
  type: string;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
}

const columns: ColumnDef<StripeEventRow, unknown>[] = [
  {
    accessorKey: 'type',
    header: 'Event Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-neutral-700">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'processed_at',
    header: 'Status',
    cell: ({ row }) => {
      if (row.original.processing_error) {
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      }
      return row.original.processed_at
        ? <Badge variant="default" className="text-xs">Processed</Badge>
        : <Badge variant="secondary" className="text-xs">Pending</Badge>;
    },
  },
  {
    accessorKey: 'processing_error',
    header: 'Error',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return v
        ? <span className="text-xs text-red-600 truncate max-w-xs block">{v}</span>
        : <span className="text-neutral-400">—</span>;
    },
  },
  {
    id: 'event_id',
    header: 'Event ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-neutral-400" title={row.original.id}>
        {row.original.id.slice(0, 24)}…
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Received',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">
        {new Date(getValue() as string).toLocaleString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
          hour: 'numeric', minute: '2-digit',
        })}
      </span>
    ),
  },
];

export function StripeEventsTable({ data }: { data: StripeEventRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search by event type or ID…"
    />
  );
}
