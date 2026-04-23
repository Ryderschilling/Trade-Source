'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';

export async function upsertSetting(key: string, value: string) {
  const ctx = await requireAdmin();
  if (!key.trim()) throw new Error('Key is required');
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    parsed = value; // treat as plain string if not valid JSON
  }
  const db = createAdminClient();
  const { error } = await db.from('site_settings').upsert({
    key: key.trim(),
    value: parsed as never,
    updated_by: ctx.actor,
  });
  if (error) throw new Error(error.message);
  void audit({ action: 'site_settings.upsert', targetTable: 'site_settings', targetId: key, ...ctx });
  revalidatePath('/admin/settings');
}

export async function deleteSetting(key: string) {
  const ctx = await requireAdmin();
  const db = createAdminClient();
  const { error } = await db.from('site_settings').delete().eq('key', key);
  if (error) throw new Error(error.message);
  void audit({ action: 'site_settings.delete', targetTable: 'site_settings', targetId: key, ...ctx });
  revalidatePath('/admin/settings');
}
