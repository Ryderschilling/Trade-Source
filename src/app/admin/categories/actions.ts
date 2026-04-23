'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { adminUpdate } from '@/lib/admin/crud';
import { audit } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';

const id$ = z.string().uuid();

// ── Categories ────────────────────────────────────────────────────────────────

export async function createCategory(formData: FormData) {
  const ctx = await requireAdmin();
  const db = createAdminClient();
  const name = (formData.get('name') as string ?? '').trim();
  const slug = (formData.get('slug') as string ?? '').trim();
  if (!name || !slug) throw new Error('Name and slug are required');
  const groupId = (formData.get('group_id') as string ?? '').trim() || null;
  const icon = (formData.get('icon') as string ?? '').trim() || null;

  const { data: last } = await db
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from('categories').insert({
    name,
    slug,
    icon,
    group_id: groupId,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  void audit({ action: 'categories.create', ...ctx });
  revalidatePath('/admin/categories');
}

export async function updateCategory(id: string, formData: FormData) {
  const ctx = await requireAdmin();
  id$.parse(id);
  await adminUpdate('categories', id, {
    name: (formData.get('name') as string ?? '').trim(),
    slug: (formData.get('slug') as string ?? '').trim(),
    icon: (formData.get('icon') as string ?? '').trim() || null,
    description: (formData.get('description') as string ?? '').trim() || null,
    group_id: (formData.get('group_id') as string ?? '').trim() || null,
  }, ctx);
  revalidatePath('/admin/categories');
}

export async function deleteCategory(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { error } = await db.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  void audit({ action: 'categories.delete', targetTable: 'categories', targetId: id, ...ctx });
  revalidatePath('/admin/categories');
}

export async function reorderCategories(orderedIds: string[]) {
  const ctx = await requireAdmin();
  const db = createAdminClient();
  await Promise.all(
    orderedIds.map((id, i) =>
      db.from('categories').update({ sort_order: i + 1 }).eq('id', id),
    ),
  );
  void audit({ action: 'categories.reorder', ...ctx });
  revalidatePath('/admin/categories');
}

// ── Category Groups ───────────────────────────────────────────────────────────

export async function createGroup(formData: FormData) {
  const ctx = await requireAdmin();
  const db = createAdminClient();
  const name = (formData.get('name') as string ?? '').trim();
  const slug = (formData.get('slug') as string ?? '').trim();
  const icon = (formData.get('icon') as string ?? '').trim() || '📦';
  if (!name || !slug) throw new Error('Name and slug are required');

  const { data: last } = await db
    .from('category_groups')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from('category_groups').insert({
    name,
    slug,
    icon,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  if (error) throw new Error(error.message);
  void audit({ action: 'category_groups.create', ...ctx });
  revalidatePath('/admin/categories');
}

export async function updateGroup(id: string, formData: FormData) {
  const ctx = await requireAdmin();
  id$.parse(id);
  await adminUpdate('category_groups', id, {
    name: (formData.get('name') as string ?? '').trim(),
    slug: (formData.get('slug') as string ?? '').trim(),
    icon: (formData.get('icon') as string ?? '').trim() || '📦',
    description: (formData.get('description') as string ?? '').trim() || null,
  }, ctx);
  revalidatePath('/admin/categories');
}

export async function deleteGroup(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { error } = await db.from('category_groups').delete().eq('id', id);
  if (error) throw new Error(error.message);
  void audit({ action: 'category_groups.delete', targetTable: 'category_groups', targetId: id, ...ctx });
  revalidatePath('/admin/categories');
}
