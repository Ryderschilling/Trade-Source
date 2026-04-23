import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { updateContactStatus } from './actions';

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const statusVariant: Record<string, 'default' | 'secondary'> = {
  new: 'default',
  read: 'secondary',
  resolved: 'secondary',
};

export default async function AdminContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: msg, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !msg) notFound();

  const markReadAction    = updateContactStatus.bind(null, id, 'read');
  const markResolvedAction = updateContactStatus.bind(null, id, 'resolved');
  const markNewAction      = updateContactStatus.bind(null, id, 'new');

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/contact"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Contact Inbox
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800">
            {msg.subject ?? 'No subject'}
          </h2>
        </div>
        <Badge
          variant={statusVariant[msg.status] ?? 'secondary'}
          className="text-xs capitalize"
        >
          {msg.status}
        </Badge>
      </div>

      {/* Sender info */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="font-semibold text-neutral-900">{msg.name}</p>
            <p className="text-sm text-neutral-500">{msg.email}</p>
            {msg.phone && <p className="text-sm text-neutral-500">{msg.phone}</p>}
          </div>
          <p className="text-xs text-neutral-400 shrink-0">{fmt(msg.created_at)}</p>
        </div>
        {msg.subject && (
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
            {msg.subject}
          </p>
        )}
        <p className="text-sm text-neutral-800 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
      </div>

      {/* Status actions */}
      <div className="flex gap-2">
        {msg.status !== 'read' && (
          <form action={markReadAction}>
            <Button type="submit" size="sm" variant="outline">
              Mark as Read
            </Button>
          </form>
        )}
        {msg.status !== 'resolved' && (
          <form action={markResolvedAction}>
            <Button type="submit" size="sm" variant="default">
              Resolve
            </Button>
          </form>
        )}
        {msg.status !== 'new' && (
          <form action={markNewAction}>
            <Button type="submit" size="sm" variant="outline">
              Mark as New
            </Button>
          </form>
        )}
        <a
          href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject ?? 'Your message')}`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors border border-neutral-200 bg-white hover:bg-neutral-50 h-8 px-3"
        >
          Reply via Email
        </a>
      </div>

      {/* Meta */}
      <div className="mt-6 text-xs text-neutral-400 space-y-0.5">
        <p>ID: <span className="font-mono">{msg.id}</span></p>
        {msg.ip && <p>IP: <span className="font-mono">{msg.ip}</span></p>}
        {msg.user_agent && <p>UA: <span className="font-mono truncate">{msg.user_agent}</span></p>}
      </div>
    </div>
  );
}
