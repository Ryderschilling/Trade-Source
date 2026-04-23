'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

export interface ConversationRow {
  id: string;
  subject: string | null;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const conversationColumns: ColumnDef<ConversationRow, unknown>[] = [
  {
    accessorKey: 'subject',
    header: 'Subject',
    cell: ({ getValue }) => (
      <span className="font-medium text-neutral-900">
        {(getValue() as string | null) ?? <span className="text-neutral-400 italic">No subject</span>}
      </span>
    ),
  },
  {
    accessorKey: 'message_count',
    header: 'Messages',
    cell: ({ getValue }) => (
      <span className="text-neutral-600 text-sm">{(getValue() as number).toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'updated_at',
    header: 'Last Activity',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{formatDate(getValue() as string | null)}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{formatDate(getValue() as string | null)}</span>
    ),
  },
];

export function ConversationsTable({ data }: { data: ConversationRow[] }) {
  return (
    <DataTable
      columns={conversationColumns}
      data={data}
      searchPlaceholder="Search by subject…"
    />
  );
}
