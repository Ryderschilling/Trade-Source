'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';

const email$ = z.string().email();

export async function removeUnsubscribe(email: string) {
  const ctx = await requireAdmin();
  email$.parse(email);
  const db = createAdminClient();

  const { data: before } = await db
    .from('email_unsubscribes')
    .select('*')
    .eq('email', email)
    .single();

  const { error } = await db.from('email_unsubscribes').delete().eq('email', email);
  if (error) throw new Error(error.message);

  void audit({
    action: 'email_unsubscribes.delete',
    actor: ctx.actor,
    targetTable: 'email_unsubscribes',
    targetId: email,
    before,
    after: null,
    ip: ctx.ip,
    ua: ctx.ua,
  });

  revalidatePath('/admin/emails/unsubscribes');
}
