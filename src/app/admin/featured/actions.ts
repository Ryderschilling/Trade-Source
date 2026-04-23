'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';
import type { ContractorOption } from '@/components/admin/contractor-combobox';

const id$ = z.string().uuid();

export async function searchContractors(query: string): Promise<ContractorOption[]> {
  await requireAdmin();
  const db = createAdminClient();
  const { data } = await db
    .from('contractors')
    .select('id, business_name, slug, status')
    .ilike('business_name', `%${query}%`)
    .limit(10);
  return (data ?? []).map((c) => ({
    id: c.id,
    business_name: c.business_name,
    slug: c.slug,
    status: c.status,
  }));
}

export async function addFeaturedPlacement(formData: FormData) {
  const ctx = await requireAdmin();
  const contractorId = (formData.get('contractor_id') as string ?? '').trim();
  const slot = (formData.get('slot') as string ?? '').trim();
  if (!contractorId || !slot) throw new Error('Contractor and slot are required');
  id$.parse(contractorId);

  const db = createAdminClient();
  const startsAt = (formData.get('starts_at') as string ?? '').trim() || null;
  const endsAt = (formData.get('ends_at') as string ?? '').trim() || null;

  const { data: last } = await db
    .from('featured_placements')
    .select('sort_order')
    .eq('slot', slot)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from('featured_placements').insert({
    contractor_id: contractorId,
    slot,
    starts_at: startsAt,
    ends_at: endsAt,
    sort_order: (last?.sort_order ?? 0) + 1,
    created_by: ctx.actor,
  });
  if (error) throw new Error(error.message);
  void audit({ action: 'featured_placements.create', targetTable: 'featured_placements', targetId: contractorId, ...ctx });
  revalidatePath('/admin/featured');
}

export async function removeFeaturedPlacement(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { error } = await db.from('featured_placements').delete().eq('id', id);
  if (error) throw new Error(error.message);
  void audit({ action: 'featured_placements.delete', targetTable: 'featured_placements', targetId: id, ...ctx });
  revalidatePath('/admin/featured');
}

export async function reorderPlacements(slot: string, orderedIds: string[]) {
  const ctx = await requireAdmin();
  const db = createAdminClient();
  await Promise.all(
    orderedIds.map((id, i) =>
      db.from('featured_placements').update({ sort_order: i + 1 }).eq('id', id),
    ),
  );
  void audit({ action: 'featured_placements.reorder', ...ctx });
  revalidatePath('/admin/featured');
}
