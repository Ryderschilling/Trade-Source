import { createAdminClient } from '@/lib/supabase/admin';
import { QuoteRequestsTable, type QuoteRequestRow } from '@/components/admin/quote-request-columns';

async function getQuoteRequests(): Promise<QuoteRequestRow[]> {
  const supabase = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quote_requests')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((q: any) => ({
    id: q.id,
    name: q.name,
    email: q.email,
    phone: q.phone,
    description: q.description,
    timeline: q.timeline,
    category_name: q.categories?.name ?? null,
    followup_sent_at: q.followup_sent_at,
    created_at: q.created_at,
  }));
}

export default async function AdminQuoteRequestsPage() {
  const quotes = await getQuoteRequests();

  const pendingFollowup = quotes.filter((q) => !q.followup_sent_at).length;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Quote Requests</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {quotes.length.toLocaleString()} total
          {pendingFollowup > 0 && ` · ${pendingFollowup} follow-up pending`}
        </p>
      </div>

      <QuoteRequestsTable data={quotes} />
    </div>
  );
}
