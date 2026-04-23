'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { adminUpdate } from '@/lib/admin/crud';
import { audit } from '@/lib/admin/audit';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getStripe } from '@/lib/stripe/client';

const id$ = z.string().uuid();

const EDITABLE = new Set([
  'business_name', 'slug', 'owner_name', 'tagline', 'description',
  'phone', 'email', 'website', 'address', 'city', 'state', 'zip',
  'license_number', 'years_experience', 'years_in_business',
  'is_licensed', 'is_insured', 'is_featured', 'is_claimed', 'listing_status',
]);

export async function updateContractorField(
  id: string,
  field: string,
  value: string | number | boolean,
) {
  const ctx = await requireAdmin();
  if (!EDITABLE.has(field)) throw new Error(`Field "${field}" is not editable`);
  id$.parse(id);
  await adminUpdate('contractors', id, { [field]: value }, ctx);
  revalidatePath(`/admin/businesses/${id}`);
}

export async function updateContractorStatus(id: string, status: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  await adminUpdate('contractors', id, { status }, ctx);
  revalidatePath(`/admin/businesses/${id}`);
}

export async function deleteBusiness(businessId: string) {
  const ctx = await requireAdmin();
  id$.parse(businessId);
  const db = createAdminClient();
  const { error } = await db.from('contractors').delete().eq('id', businessId);
  if (error) throw new Error(error.message);
  void audit({ action: 'contractors.delete', targetTable: 'contractors', targetId: businessId, ...ctx });
  redirect('/admin/businesses');
}

export async function syncFromStripe(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { data, error } = await db
    .from('contractors')
    .select('stripe_subscription_id')
    .eq('id', id)
    .single();
  if (error || !data?.stripe_subscription_id) throw new Error('No Stripe subscription found');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sub = await getStripe().subscriptions.retrieve(data.stripe_subscription_id) as any;
  await adminUpdate('contractors', id, {
    subscription_status: sub.status,
    billing_status: sub.status === 'active' ? 'active' : 'inactive',
    next_billing_date: sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null,
  }, ctx);
  revalidatePath(`/admin/businesses/${id}`);
}

export async function cancelSub(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { data, error } = await db
    .from('contractors')
    .select('stripe_subscription_id')
    .eq('id', id)
    .single();
  if (error || !data?.stripe_subscription_id) throw new Error('No Stripe subscription to cancel');
  await getStripe().subscriptions.cancel(data.stripe_subscription_id);
  await adminUpdate('contractors', id, {
    subscription_status: 'canceled',
    billing_status: 'canceled',
  }, ctx);
  revalidatePath(`/admin/businesses/${id}`);
}

export async function createPackage(contractorId: string, formData: FormData) {
  const ctx = await requireAdmin();
  id$.parse(contractorId);
  const name = ((formData.get('name') as string) ?? '').trim();
  if (!name) throw new Error('Package name is required');
  const db = createAdminClient();
  const { data: last } = await db
    .from('contractor_packages')
    .select('sort_order')
    .eq('contractor_id', contractorId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await db.from('contractor_packages').insert({
    contractor_id: contractorId,
    name,
    description: ((formData.get('description') as string) ?? '').trim() || null,
    price_label: ((formData.get('price_label') as string) ?? '').trim() || null,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  void audit({ action: 'contractor_packages.create', targetTable: 'contractor_packages', targetId: contractorId, ...ctx });
  revalidatePath(`/admin/businesses/${contractorId}`);
}

export async function updatePackage(pkgId: string, contractorId: string, formData: FormData) {
  const ctx = await requireAdmin();
  id$.parse(pkgId);
  await adminUpdate('contractor_packages', pkgId, {
    name: ((formData.get('name') as string) ?? '').trim(),
    description: ((formData.get('description') as string) ?? '').trim() || null,
    price_label: ((formData.get('price_label') as string) ?? '').trim() || null,
  }, ctx);
  revalidatePath(`/admin/businesses/${contractorId}`);
}

export async function deletePackage(pkgId: string, contractorId: string) {
  const ctx = await requireAdmin();
  id$.parse(pkgId);
  const db = createAdminClient();
  const { error } = await db.from('contractor_packages').delete().eq('id', pkgId);
  if (error) throw new Error(error.message);
  void audit({ action: 'contractor_packages.delete', targetTable: 'contractor_packages', targetId: pkgId, ...ctx });
  revalidatePath(`/admin/businesses/${contractorId}`);
}

export async function adminDeleteReview(reviewId: string, contractorId: string) {
  const ctx = await requireAdmin();
  id$.parse(reviewId);
  const db = createAdminClient();
  const { error } = await db.from('reviews').delete().eq('id', reviewId);
  if (error) throw new Error(error.message);
  void audit({ action: 'reviews.delete', targetTable: 'reviews', targetId: reviewId, ...ctx });
  await recomputeRating(contractorId);
  revalidatePath(`/admin/businesses/${contractorId}`);
}

export async function toggleReviewVerified(reviewId: string, contractorId: string, verified: boolean) {
  const ctx = await requireAdmin();
  await adminUpdate('reviews', reviewId, { is_verified: verified }, ctx);
  revalidatePath(`/admin/businesses/${contractorId}`);
}

export async function toggleReviewAnonymous(reviewId: string, contractorId: string, anon: boolean) {
  const ctx = await requireAdmin();
  await adminUpdate('reviews', reviewId, { is_anonymous: anon }, ctx);
  revalidatePath(`/admin/businesses/${contractorId}`);
}

async function recomputeRating(contractorId: string) {
  const db = createAdminClient();
  const { data: all } = await db
    .from('reviews')
    .select('rating')
    .eq('contractor_id', contractorId);
  const avg = all?.length
    ? all.reduce((sum, r) => sum + r.rating, 0) / all.length
    : null;
  await db
    .from('contractors')
    .update({
      avg_rating: avg !== null ? Math.round(avg * 10) / 10 : null,
      review_count: all?.length ?? 0,
    })
    .eq('id', contractorId);
}
