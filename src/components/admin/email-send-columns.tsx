import { type ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

export interface EmailSendRow {
  id: string;
  kind: string;
  to_email: string;
  status: string;
  resend_id: string | null;
  error: string | null;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export const emailSendColumns: ColumnDef<EmailSendRow, unknown>[] = [
  {
    accessorKey: 'kind',
    header: 'Kind',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-neutral-600">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'to_email',
    header: 'To',
    cell: ({ getValue }) => (
      <span className="text-xs text-neutral-800">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => {
      const s = getValue() as string;
      return (
        <Badge variant={s === 'sent' ? 'default' : 'destructive'} className="text-xs">
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'resend_id',
    header: 'Resend ID',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      if (!v) return <span className="text-neutral-300 text-xs">—</span>;
      return (
        <span className="font-mono text-xs text-neutral-400" title={v}>
          {v.slice(0, 12)}…
        </span>
      );
    },
  },
  {
    accessorKey: 'error',
    header: 'Error',
    cell: ({ getValue }) => {
      const v = getValue() as string | null;
      if (!v) return null;
      return <span className="text-xs text-red-600 truncate max-w-xs block">{v}</span>;
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    cell: ({ getValue }) => (
      <span className="text-neutral-500 text-xs">{formatDate(getValue() as string)}</span>
    ),
  },
];
