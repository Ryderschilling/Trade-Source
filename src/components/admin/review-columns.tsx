'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { DataTable } from './data-table';

export interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  is_verified: boolean;
  is_anonymous: boolean;
  contractor_id: string;
  business_name: string;
  user_display: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const reviewColumns: ColumnDef<ReviewRow, unknown>[] = [
  {
    accessorKey: 'rating',
    header: 'Rating',
    cell: ({ getValue }) => (
      <span className="inline-flex items-center gap-0.5 font-semibold text-neutral-800">
        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
        {getValue() as number}
      </span>
    ),
  },
  {
    accessorKey: 'business_name',
    header: 'Business',
    cell: ({ row }) => (
      <Link
        href={`/admin/businesses/${row.original.contractor_id}?tab=reviews`}
        className="font-medium text-neutral-900 hover:text-blue-600 hover:underline"
      >
        {row.original.business_name}
      </Link>
    ),
  },
  {
    accessorKey: 'user_display',
    header: 'User',
    cell: ({ getValue, row }) => (
      <span className={row.original.is_anonymous ? 'text-neutral-400 italic text-xs' : 'text-neutral-700 text-xs'}>
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Review',
    cell: ({ row }) => (
      <div className="max-w-xs">
        {row.original.title && (
          <p className="font-medium text-neutral-800 text-xs truncate">{row.original.title}</p>
        )}
        {row.original.body && (
          <p className="text-neutral-500 text-xs truncate">{row.original.body}</p>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'is_verified',
    header: 'Status',
    cell: ({ getValue, row }) => (
      <div className="flex flex-col gap-0.5">
        {(getValue() as boolean) && (
          <Badge variant="default" className="text-xs w-fit">Verified</Badge>
        )}
        {row.original.is_anonymous && (
          <Badge variant="secondary" className="text-xs w-fit">Anon</Badge>
        )}
      </div>
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
        href={`/admin/businesses/${row.original.contractor_id}?tab=reviews`}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        View
      </Link>
    ),
  },
];

export function ReviewsTable({ data }: { data: ReviewRow[] }) {
  return (
    <DataTable
      columns={reviewColumns}
      data={data}
      searchPlaceholder="Search by business, user, or title…"
    />
  );
}
