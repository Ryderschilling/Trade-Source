import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DeleteButton } from '@/components/admin/delete-button';
import { ChevronLeft } from 'lucide-react';
import { deleteBusiness } from './actions';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-0 flex gap-4">
      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-neutral-800 break-all">{value ?? <span className="text-neutral-400">—</span>}</span>
    </div>
  );
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  pending: 'secondary',
  suspended: 'destructive',
};

export default async function AdminBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from('contractors')
    .select(`
      *,
      categories ( name ),
      profiles ( email, full_name )
    `)
    .eq('id', id)
    .single();

  if (error || !business) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoryName = (business as any).categories?.name ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerEmail = (business as any).profiles?.email ?? null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ownerName = (business as any).profiles?.full_name ?? null;

  const deleteAction = deleteBusiness.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/businesses"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Businesses
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800">Business Details</h2>
        </div>
        <DeleteButton action={deleteAction} label="Business" />
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
        <Field label="ID" value={business.id} />
        <Field label="Business Name" value={business.business_name} />
        <Field label="Slug" value={business.slug} />
        <Field label="Owner Name" value={business.owner_name} />
        <Field label="Category" value={categoryName} />
        <Field
          label="Status"
          value={
            <Badge
              variant={statusVariant[business.status] ?? 'secondary'}
              className="text-xs capitalize"
            >
              {business.status}
            </Badge>
          }
        />
        <Field label="Tagline" value={business.tagline} />
        <Field label="Description" value={business.description} />
        <Field label="Phone" value={business.phone} />
        <Field label="Email" value={business.email} />
        <Field label="Website" value={business.website} />
        <Field label="Address" value={business.address} />
        <Field label="City" value={business.city} />
        <Field label="State" value={business.state} />
        <Field label="ZIP" value={business.zip} />
        <Field
          label="Service Areas"
          value={
            business.service_areas?.length
              ? business.service_areas.join(', ')
              : null
          }
        />
        <Field
          label="Licensed"
          value={
            <Badge variant={business.is_licensed ? 'default' : 'secondary'} className="text-xs">
              {business.is_licensed ? 'Yes' : 'No'}
            </Badge>
          }
        />
        <Field
          label="Insured"
          value={
            <Badge variant={business.is_insured ? 'default' : 'secondary'} className="text-xs">
              {business.is_insured ? 'Yes' : 'No'}
            </Badge>
          }
        />
        <Field label="License #" value={business.license_number} />
        <Field
          label="Yrs Experience"
          value={business.years_experience != null ? String(business.years_experience) : null}
        />
        <Field
          label="Yrs in Biz"
          value={business.years_in_business != null ? String(business.years_in_business) : null}
        />
        <Field
          label="Featured"
          value={
            <Badge variant={business.is_featured ? 'default' : 'secondary'} className="text-xs">
              {business.is_featured ? 'Yes' : 'No'}
            </Badge>
          }
        />
        <Field
          label="Claimed"
          value={
            <Badge variant={business.is_claimed ? 'default' : 'secondary'} className="text-xs">
              {business.is_claimed ? 'Yes' : 'No'}
            </Badge>
          }
        />
        <Field
          label="Avg Rating"
          value={business.avg_rating != null ? business.avg_rating.toFixed(1) : null}
        />
        <Field label="Review Count" value={String(business.review_count)} />
        <Field label="View Count" value={String(business.view_count)} />
        <Field label="Owner Email" value={ownerEmail} />
        <Field label="Owner Profile" value={ownerName} />
        <Field label="Logo URL" value={business.logo_url} />
        <Field label="Cover URL" value={business.cover_url} />
        <Field label="Created" value={formatDate(business.created_at)} />
        <Field label="Updated" value={formatDate(business.updated_at)} />
      </div>
    </div>
  );
}
