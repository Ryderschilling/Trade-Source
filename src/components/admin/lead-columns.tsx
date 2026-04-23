'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from './data-table';

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  service_type: string | null;
  package_name: string | null;
  contractor_id: string;
  business_name: string;
  created_at: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  new: 'default',
  contacted: 'secondary',
  converted: 'default',
  closed: 'secondary',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const leadColumns: ColumnDef<LeadRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Lead',
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
    accessorKey: 'business_name',
    header: 'Business',
    cell: ({ row }) => (
      <Link
        href={`/admin/businesses/${row.original.contractor_id}?tab=leads`}
        className="text-neutral-700 hover:text-blue-600 hover:underline text-sm"
      >
        {row.original.business_name}
      </Link>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <Badge variant={statusVariant[status] ?? 'secondary'} className="text-xs capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'service_type',
    header: 'Type',
    cell: ({ row }) => (
      <span className="text-neutral-600 text-xs">
        {row.original.service_type ?? row.original.package_name ?? '—'}
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{formatDate(getValue() as string)}</span>
    ),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/admin/businesses/${row.original.contractor_id}?tab=leads`}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        View
      </Link>
    ),
  },
];

export function LeadsTable({ data }: { data: LeadRow[] }) {
  return (
    <DataTable
      columns={leadColumns}
      data={data}
      searchPlaceholder="Search by name, email, or business…"
    />
  );
}
