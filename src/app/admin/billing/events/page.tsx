import { createAdminClient } from '@/lib/supabase/admin';
import { DataTable } from '@/components/admin/data-table';
import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

interface StripeEventRow {
  id: string;
  type: string;
  processed_at: string | null;
  processing_error: string | null;
  created_at: string;
}

const columns: ColumnDef<StripeEventRow, unknown>[] = [
  {
    accessorKey: 'type',
    header: 'Event Type',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-neutral-700">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'processed_at',
    header: 'Status',
    cell: ({ row }) => {
      if (row.original.processing_error) {
        return <Badge variant="destructive" className="text-xs">Error</Badge>;
      }
      return row.original.processed_at
        ? <Badge variant="default" className="text-xs">Processed</Badge>
        : <Badge variant="secondary" className="text-xs">Pending</Badge>;
    },
  },
  {
    accessorKey: 'processing_error',
    header: 'Error',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      return v
        ? <span className="text-xs text-red-600 truncate max-w-xs block">{v}</span>
        : <span className="text-neutral-400">—</span>;
    },
  },
  {
    id: 'event_id',
    header: 'Event ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs text-neutral-400" title={row.original.id}>
        {row.original.id.slice(0, 24)}…
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Received',
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

export default async function AdminStripeEventsPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('stripe_events')
    .select('id, type, processed_at, processing_error, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(error.message);

  const events: StripeEventRow[] = data ?? [];
  const errors = events.filter((e) => e.processing_error).length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Stripe Events</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          Last {events.length.toLocaleString()} events
          {errors > 0 && ` · ${errors} errors`}
        </p>
      </div>
      <DataTable
        columns={columns}
        data={events}
        searchPlaceholder="Search by event type or ID…"
      />
    </div>
  );
}
