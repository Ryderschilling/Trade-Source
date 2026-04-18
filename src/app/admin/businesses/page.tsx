import { createAdminClient } from '@/lib/supabase/admin';
import { DataTable } from '@/components/admin/data-table';
import { businessColumns, type BusinessRow } from '@/components/admin/business-columns';

async function getBusinesses(): Promise<BusinessRow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('contractors')
    .select(`
      id,
      business_name,
      status,
      review_count,
      created_at,
      categories!inner ( name ),
      profiles ( email )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    business_name: row.business_name,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category_name: (row as any).categories?.name ?? '—',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    owner_email: (row as any).profiles?.email ?? null,
    status: row.status,
    review_count: row.review_count,
    created_at: row.created_at,
  }));
}

export default async function AdminBusinessesPage() {
  const businesses = await getBusinesses();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Businesses</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {businesses.length.toLocaleString()} total business listings
        </p>
      </div>

      <DataTable
        columns={businessColumns}
        data={businesses}
        searchPlaceholder="Search by business name, category, or email…"
      />
    </div>
  );
}
