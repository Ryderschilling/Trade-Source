'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import { unsubscribeColumns, type UnsubscribeRow } from '@/components/admin/unsubscribe-columns';
import { RemoveUnsubscribeButton } from './remove-button';

const columns: ColumnDef<UnsubscribeRow, unknown>[] = [
  ...unsubscribeColumns,
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <RemoveUnsubscribeButton email={row.original.email} />,
  },
];

export function UnsubscribesTable({ data }: { data: UnsubscribeRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Search by email or reason…"
    />
  );
}
