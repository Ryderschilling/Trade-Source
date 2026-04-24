'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from './data-table';

export interface AddonRow {
  id: string;
  business_id: string;
  business_name: string;
  addon_type: string;
  status: string;
  started_at: string;
  cancelled_at: string | null;
  reserved_month: string | null;
  notes: string | null;
}

const columns: ColumnDef<AddonRow, unknown>[] = [
  {
    accessorKey: 'business_name',
    header: 'Business',
    cell: ({ row }) => (
      <Link
        href={`/admin/businesses/${row.original.business_id}?tab=billing`}
        className="font-medium text-neutral-900 hover:text-blue-600 hover:underline"
      >
        {row.original.business_name}
      </Link>
    ),
  },
  {
    accessorKey: 'addon_type',
    header: 'Type',
    cell: ({ getValue }) => (
      <span className="text-neutral-700 text-sm capitalize">{(getValue() as string).replace(/_/g, ' ')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return (
        <Badge variant={s === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'reserved_month',
    header: 'Month',
    cell: ({ getValue }) => (
      <span className="text-neutral-600 text-xs">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'started_at',
    header: 'Started',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">
        {new Date(getValue() as string).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </span>
    ),
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ getValue }) => (
      <span className="text-neutral-400 text-xs">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
];

export function AddonTable({ data }: { data: AddonRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search by business or type…"
    />
  );
}
