import { createAdminClient } from '@/lib/supabase/admin';
import { LeadsTable, type LeadRow } from '@/components/admin/lead-columns';

async function getLeads(): Promise<LeadRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*, contractors(id, business_name)')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((l: any) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    status: l.status,
    service_type: l.service_type,
    package_name: l.package_name,
    contractor_id: l.contractor_id,
    business_name: l.contractors?.business_name ?? '—',
    created_at: l.created_at,
  }));
}

export default async function AdminLeadsPage() {
  const leads = await getLeads();

  const statusCounts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Leads</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {leads.length.toLocaleString()} total
          {Object.entries(statusCounts).map(([s, n]) => ` · ${n} ${s}`).join('')}
        </p>
      </div>

      <LeadsTable data={leads} />
    </div>
  );
}
