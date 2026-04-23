import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createCampaign } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function NewCampaignPage() {
  const supabase = createAdminClient();
  const { data: lists } = await supabase
    .from('email_lists')
    .select('id, name')
    .order('name', { ascending: true });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/emails/campaigns"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />Campaigns
        </Link>
        <h2 className="text-lg font-semibold text-neutral-800">New Campaign</h2>
      </div>

      <form action={createCampaign} className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Subject</label>
          <Input name="subject" placeholder="Email subject line" className="text-sm" required />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">List</label>
          <select
            name="list_id"
            required
            className="w-full h-9 text-sm rounded-md border border-neutral-200 bg-white px-3"
          >
            <option value="">Select a list…</option>
            {(lists ?? []).map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Body (Markdown)</label>
          <textarea
            name="body_markdown"
            required
            rows={12}
            placeholder="Write your email in Markdown…"
            className="w-full text-sm rounded-md border border-neutral-200 bg-white px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-neutral-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wide block mb-1.5">Schedule (optional)</label>
          <Input name="scheduled_at" type="datetime-local" className="text-sm w-auto" />
          <p className="text-xs text-neutral-400 mt-1">Leave blank to save as draft.</p>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="submit">Create Campaign</Button>
          <Link
            href="/admin/emails/campaigns"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-neutral-200 bg-white hover:bg-neutral-50 h-9 px-4"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
