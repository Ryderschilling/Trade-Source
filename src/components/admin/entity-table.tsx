'use client';

import { DataTable } from './data-table';
import type { ColumnDef } from '@tanstack/react-table';

interface EntityTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
}

export function EntityTable<TData>({
  columns,
  data,
  searchPlaceholder,
}: EntityTableProps<TData>) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder={searchPlaceholder}
      pageSize={50}
    />
  );
}
