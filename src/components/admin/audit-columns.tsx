'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from './data-table';

export interface AuditRow {
  id: number;
  action: string;
  actor: string;
  target_table: string | null;
  target_id: string | null;
  ip: string | null;
  created_at: string;
}

const auditColumns: ColumnDef<AuditRow, unknown>[] = [
  {
    accessorKey: 'action',
    header: 'Action',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-neutral-700">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'target_table',
    header: 'Table',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return v
        ? <Badge variant="secondary" className="text-xs font-mono">{v}</Badge>
        : <span className="text-neutral-400">—</span>;
    },
  },
  {
    accessorKey: 'target_id',
    header: 'Target ID',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return v
        ? <span className="font-mono text-xs text-neutral-500" title={v}>{v.slice(0, 8)}…</span>
        : <span className="text-neutral-400">—</span>;
    },
  },
  {
    accessorKey: 'actor',
    header: 'Actor',
    cell: ({ getValue }) => (
      <span className="text-neutral-600 text-xs">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'ip',
    header: 'IP',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-neutral-400">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'When',
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

export function AuditTable({ data }: { data: AuditRow[] }) {
  return (
    <DataTable
      columns={auditColumns}
      data={data}
      searchPlaceholder="Search by action, table, or actor…"
    />
  );
}
