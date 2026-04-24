import { createAdminClient } from '@/lib/supabase/admin';
import { StripeEventsTable, type StripeEventRow } from '@/components/admin/stripe-event-columns';

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
      <StripeEventsTable data={events} />
    </div>
  );
}
