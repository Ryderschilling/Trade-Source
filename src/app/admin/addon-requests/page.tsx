import { createAdminClient } from '@/lib/supabase/admin';
import { DataTable } from '@/components/admin/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface AddonRow {
  id: string;
  business_id: string;
  business_name: string;
  addon_type: string;
  status: string;
  started_at: string;
  cancelled_at: string | null;
  reserved_month: string | null;
  notes: string | null;
}

const columns: ColumnDef<AddonRow, unknown>[] = [
  {
    accessorKey: 'business_name',
    header: 'Business',
    cell: ({ row }) => (
      <Link
        href={`/admin/businesses/${row.original.business_id}?tab=billing`}
        className="font-medium text-neutral-900 hover:text-blue-600 hover:underline"
      >
        {row.original.business_name}
      </Link>
    ),
  },
  {
    accessorKey: 'addon_type',
    header: 'Type',
    cell: ({ getValue }) => (
      <span className="text-neutral-700 text-sm capitalize">{(getValue() as string).replace(/_/g, ' ')}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return (
        <Badge variant={s === 'active' ? 'default' : 'secondary'} className="text-xs capitalize">
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'reserved_month',
    header: 'Month',
    cell: ({ getValue }) => (
      <span className="text-neutral-600 text-xs">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'started_at',
    header: 'Started',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">
        {new Date(getValue() as string).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })}
      </span>
    ),
  },
  {
    accessorKey: 'notes',
    header: 'Notes',
    cell: ({ getValue }) => (
      <span className="text-neutral-400 text-xs">{(getValue() as string | null) ?? '—'}</span>
    ),
  },
];

export default async function AdminAddonRequestsPage() {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('business_addons')
    .select('*, contractors(business_name)')
    .order('started_at', { ascending: false });

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addons: AddonRow[] = (data ?? []).map((a: any) => ({
    id: a.id,
    business_id: a.business_id,
    business_name: a.contractors?.business_name ?? a.business_id,
    addon_type: a.addon_type,
    status: a.status,
    started_at: a.started_at,
    cancelled_at: a.cancelled_at,
    reserved_month: a.reserved_month,
    notes: a.notes,
  }));

  const active = addons.filter((a) => a.status === 'active').length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Addon Requests</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {addons.length.toLocaleString()} total · {active} active
        </p>
      </div>
      <DataTable
        columns={columns}
        data={addons}
        searchPlaceholder="Search by business or type…"
      />
    </div>
  );
}
