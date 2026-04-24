import { createAdminClient } from '@/lib/supabase/admin';
import { AddonTable, type AddonRow } from '@/components/admin/addon-columns';

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
      <AddonTable data={addons} />
    </div>
  );
}
