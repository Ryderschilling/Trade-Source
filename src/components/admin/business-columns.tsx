'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from './data-table';

export interface BusinessRow {
  id: string;
  business_name: string;
  category_name: string;
  owner_email: string | null;
  status: 'pending' | 'active' | 'suspended';
  review_count: number;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  pending: 'secondary',
  suspended: 'destructive',
};

export const businessColumns: ColumnDef<BusinessRow, unknown>[] = [
  {
    accessorKey: 'business_name',
    header: 'Business',
    cell: ({ getValue }) => (
      <span className="font-medium text-neutral-900">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'category_name',
    header: 'Category',
    cell: ({ getValue }) => (
      <span className="text-neutral-700">{(getValue() as string) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'owner_email',
    header: 'Owner Email',
    cell: ({ getValue }) => (
      <span className="text-neutral-600 text-xs">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const status = getValue() as string;
      return (
        <Badge
          variant={statusVariant[status] ?? 'secondary'}
          className="text-xs capitalize"
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'review_count',
    header: 'Reviews',
    cell: ({ getValue }) => (
      <span className="text-neutral-600">{(getValue() as number).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
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
        href={`/admin/businesses/${row.original.id}`}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        View
      </Link>
    ),
  },
];

export function BusinessesTable({ data }: { data: BusinessRow[] }) {
  return (
    <DataTable
      columns={businessColumns}
      data={data}
      searchPlaceholder="Search by business name, category, or email…"
    />
  );
}
