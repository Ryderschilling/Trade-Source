import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Plus } from 'lucide-react';

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  sent: 'default',
  scheduled: 'secondary',
  draft: 'secondary',
  failed: 'destructive',
};

export default async function AdminCampaignsPage() {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('email_campaigns')
    .select('*, email_lists(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaigns: any[] = data ?? [];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Email Campaigns</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{campaigns.length} campaigns</p>
        </div>
        <Link
          href="/admin/emails/campaigns/new"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />New Campaign
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {campaigns.length === 0 ? (
          <p className="text-sm text-neutral-400 p-5">No campaigns yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-semibold">Subject</th>
                <th className="text-left px-4 py-2.5 font-semibold">List</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold">Sent</th>
                <th className="text-left px-4 py-2.5 font-semibold">Stats</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-neutral-800">{c.subject}</p>
                    {c.scheduled_at && c.status === 'scheduled' && (
                      <p className="text-xs text-neutral-400">Scheduled {fmt(c.scheduled_at)}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-neutral-600 text-xs">{c.email_lists?.name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={statusVariant[c.status] ?? 'secondary'} className="text-xs capitalize">
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-neutral-500 text-xs">{fmt(c.sent_at)}</td>
                  <td className="px-4 py-2.5 text-xs text-neutral-500">
                    {c.delivered_count != null
                      ? `${c.delivered_count} / ${c.recipient_count ?? '?'}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/emails/campaigns/${c.id}`} className="text-xs text-blue-600 hover:underline font-medium">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
