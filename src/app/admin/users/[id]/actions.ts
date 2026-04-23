'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { adminUpdate } from '@/lib/admin/crud';
import { audit } from '@/lib/admin/audit';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const id$ = z.string().uuid();

const EDITABLE = new Set([
  'full_name', 'phone', 'city', 'bio', 'is_public',
]);

export async function updateUserField(
  id: string,
  field: string,
  value: string | number | boolean,
) {
  const ctx = await requireAdmin();
  if (!EDITABLE.has(field)) throw new Error(`Field "${field}" is not editable`);
  id$.parse(id);
  await adminUpdate('profiles', id, { [field]: value }, ctx);
  revalidatePath(`/admin/users/${id}`);
}

export async function updateUserRole(id: string, role: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  await adminUpdate('profiles', id, { role }, ctx);
  revalidatePath(`/admin/users/${id}`);
}

export async function sendPasswordReset(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { data: profile, error } = await db
    .from('profiles')
    .select('email')
    .eq('id', id)
    .single();
  if (error || !profile?.email) throw new Error('User email not found');
  const { error: resetError } = await db.auth.admin.generateLink({
    type: 'recovery',
    email: profile.email,
  });
  if (resetError) throw new Error(resetError.message);
  void audit({ action: 'profiles.send_password_reset', targetTable: 'profiles', targetId: id, ...ctx });
  revalidatePath(`/admin/users/${id}`);
}

export async function deleteUser(userId: string) {
  const ctx = await requireAdmin();
  id$.parse(userId);
  const db = createAdminClient();
  const { error: profileError } = await db.from('profiles').delete().eq('id', userId);
  if (profileError) throw new Error(profileError.message);
  const { error: authError } = await db.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);
  void audit({ action: 'profiles.delete', targetTable: 'profiles', targetId: userId, ...ctx });
  redirect('/admin/users');
}
