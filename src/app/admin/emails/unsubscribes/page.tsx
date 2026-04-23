import { createAdminClient } from '@/lib/supabase/admin';
import { DataTable } from '@/components/admin/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { type UnsubscribeRow } from '@/components/admin/unsubscribe-columns';
import { unsubscribeColumns } from '@/components/admin/unsubscribe-columns';
import { RemoveUnsubscribeButton } from './remove-button';

async function getUnsubscribes(): Promise<UnsubscribeRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('email_unsubscribes')
    .select('email, reason, created_at')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as UnsubscribeRow[];
}

const columns: ColumnDef<UnsubscribeRow, unknown>[] = [
  ...unsubscribeColumns,
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <RemoveUnsubscribeButton email={row.original.email} />,
  },
];

export default async function AdminUnsubscribesPage() {
  const rows = await getUnsubscribes();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Unsubscribes</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {rows.length.toLocaleString()} global unsubscribes
        </p>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder="Search by email or reason…"
      />
    </div>
  );
}
