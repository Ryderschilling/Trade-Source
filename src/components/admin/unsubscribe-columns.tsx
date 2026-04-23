'use client';

import { type ColumnDef } from '@tanstack/react-table';

export interface UnsubscribeRow {
  email: string;
  reason: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const unsubscribeColumns: ColumnDef<UnsubscribeRow, unknown>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ getValue }) => (
      <span className="text-sm text-neutral-800">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      if (!v) return <span className="text-neutral-300 text-xs">—</span>;
      return <span className="text-xs text-neutral-500">{v}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Unsubscribed',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{formatDate(getValue() as string)}</span>
    ),
  },
];
