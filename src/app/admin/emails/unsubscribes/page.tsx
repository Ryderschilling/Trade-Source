import { createAdminClient } from '@/lib/supabase/admin';
import { type UnsubscribeRow } from '@/components/admin/unsubscribe-columns';
import { UnsubscribesTable } from './unsubscribes-table';

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
      <UnsubscribesTable data={rows} />
    </div>
  );
}
