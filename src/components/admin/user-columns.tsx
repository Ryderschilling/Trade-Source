'use client';

import { type ColumnDef } from '@tanstack/react-table';
import type { Profile } from '@/lib/supabase/types';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DataTable } from './data-table';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const userColumns: ColumnDef<Profile, unknown>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => (
      <span className="font-medium text-neutral-900">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'full_name',
    header: 'Full Name',
    cell: ({ getValue }) => (
      <span className="text-neutral-700">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => {
      const role = getValue() as string;
      return (
        <Badge
          variant={role === 'admin' ? 'default' : 'secondary'}
          className="text-xs capitalize"
        >
          {role}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Joined',
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
        href={`/admin/users/${row.original.id}`}
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        View
      </Link>
    ),
  },
];

export function UsersTable({ data }: { data: Profile[] }) {
  return (
    <DataTable
      columns={userColumns}
      data={data}
      searchPlaceholder="Search by email or name…"
    />
  );
}
