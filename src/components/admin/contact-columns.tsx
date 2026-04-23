'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from './data-table';

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  body: string;
  status: string;
  created_at: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  new: 'default',
  read: 'secondary',
  resolved: 'secondary',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const contactColumns: ColumnDef<ContactMessageRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'From',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-neutral-900">{row.original.name}</p>
        <p className="text-xs text-neutral-400">{row.original.email}</p>
      </div>
    ),
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
    cell: ({ getValue }) => (
      <span className="text-neutral-700 text-sm">
        {(getValue() as string | null) ?? <span className="text-neutral-400 italic">No subject</span>}
      </span>
    ),
  },
  {
    accessorKey: 'body',
    header: 'Message',
    cell: ({ getValue }) => (
      <p className="text-neutral-500 text-xs max-w-xs truncate">{getValue() as string}</p>
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
        href={`/admin/contact/${row.original.id}`}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        View
      </Link>
    ),
  },
];

export function ContactTable({ data }: { data: ContactMessageRow[] }) {
  return (
    <DataTable
      columns={contactColumns}
      data={data}
      searchPlaceholder="Search by name, email, or subject…"
    />
  );
}
