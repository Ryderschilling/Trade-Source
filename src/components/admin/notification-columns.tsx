'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from './data-table';

export interface NotifRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

const columns: ColumnDef<NotifRow, unknown>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ getValue }) => (
      <Badge variant="secondary" className="text-xs font-mono">{getValue() as string}</Badge>
    ),
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-neutral-800 text-sm">{row.original.title}</p>
        {row.original.body && <p className="text-xs text-neutral-500 truncate max-w-xs">{row.original.body}</p>}
      </div>
    ),
  },
  {
    accessorKey: 'read',
    header: 'Read',
    cell: ({ getValue }) => (
      (getValue() as boolean)
        ? <Badge variant="secondary" className="text-xs">Read</Badge>
        : <Badge variant="default" className="text-xs">Unread</Badge>
    ),
  },
  {
    accessorKey: 'user_id',
    header: 'User ID',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-neutral-400" title={getValue() as string}>
        {(getValue() as string).slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">
        {new Date(getValue() as string).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </span>
    ),
  },
];

export function NotificationsTable({ data }: { data: NotifRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search by type or title…"
    />
  );
}
