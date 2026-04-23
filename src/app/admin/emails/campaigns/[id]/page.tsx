import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { updateCampaign, deleteCampaign } from '../actions';

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  sent: 'default', scheduled: 'secondary', draft: 'secondary', failed: 'destructive',
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campaign, error } = await (supabase as any)
    .from('email_campaigns')
    .select('*, email_lists(name, id)')
    .eq('id', id)
    .single();

  if (error || !campaign) notFound();

  const { data: sends } = await supabase
    .from('email_sends')
    .select('status, created_at')
    .eq('kind', `campaign:${id}`)
    .order('created_at', { ascending: false })
    .limit(5);

  const isDraft = campaign.status === 'draft' || campaign.status === 'scheduled';
  const updateAction = updateCampaign.bind(null, id);
  const deleteAction = deleteCampaign.bind(null, id);

  // Get all lists for the edit form
  const { data: lists } = await supabase
    .from('email_lists')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/emails/campaigns" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
            <ChevronLeft className="w-4 h-4" />Campaigns
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800 truncate">{campaign.subject}</h2>
          <Badge variant={statusVariant[campaign.status] ?? 'secondary'} className="text-xs capitalize shrink-0">
            {campaign.status}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      {campaign.status === 'sent' && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Recipients', val: campaign.recipient_count ?? '—' },
            { label: 'Delivered', val: campaign.delivered_count ?? '—' },
            { label: 'Failed', val: campaign.failed_count ?? '—' },
          ].map(({ label, val }) => (
            <div key={label} className="bg-white border border-neutral-200 rounded-lg p-3 text-center">
              <p className="text-xl font-semibold text-neutral-800">{val}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* View / Edit form */}
      {isDraft ? (
        <form action={updateAction} className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Subject</label>
            <Input name="subject" defaultValue={campaign.subject} className="text-sm" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">List</label>
            <select
              name="list_id"
              defaultValue={campaign.list_id}
              disabled
              className="w-full h-9 text-sm rounded-md border border-neutral-200 bg-neutral-50 px-3"
            >
              {(lists ?? []).map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Body (Markdown)</label>
            <textarea
              name="body_markdown"
              defaultValue={campaign.body_markdown}
              rows={12}
              className="w-full text-sm rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-neutral-400"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Schedule</label>
            <Input name="scheduled_at" type="datetime-local"
              defaultValue={campaign.scheduled_at?.slice(0, 16) ?? ''}
              className="text-sm w-auto"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="submit">Save</Button>
            <form action={deleteAction} className="inline">
              <Button type="submit" variant="destructive">Delete</Button>
            </form>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">List</p>
            <p className="text-sm text-neutral-800">{campaign.email_lists?.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Sent</p>
            <p className="text-sm text-neutral-800">{fmt(campaign.sent_at)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">Body</p>
            <pre className="text-xs font-mono text-neutral-600 bg-neutral-50 rounded p-3 whitespace-pre-wrap overflow-auto max-h-64">
              {campaign.body_markdown}
            </pre>
          </div>
        </div>
      )}

      {/* Recent sends */}
      {sends && sends.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Recent Sends</p>
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {sends.map((s, i) => (
                  <tr key={i} className="border-b border-neutral-50 last:border-0">
                    <td className="px-4 py-2">
                      <Badge variant={s.status === 'sent' ? 'default' : 'destructive'} className="text-xs">{s.status}</Badge>
                    </td>
                    <td className="px-4 py-2 text-neutral-400">{fmt(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
