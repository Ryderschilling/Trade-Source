'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const id$ = z.string().uuid();

export async function createCampaign(formData: FormData) {
  const ctx = await requireAdmin();
  const subject = (formData.get('subject') as string ?? '').trim();
  const listId = (formData.get('list_id') as string ?? '').trim();
  const bodyMarkdown = (formData.get('body_markdown') as string ?? '').trim();
  const scheduledAt = (formData.get('scheduled_at') as string ?? '').trim() || null;
  if (!subject || !listId || !bodyMarkdown) throw new Error('Subject, list, and body are required');

  const db = createAdminClient();
  const { data, error } = await db.from('email_campaigns').insert({
    subject,
    list_id: listId,
    body_markdown: bodyMarkdown,
    scheduled_at: scheduledAt,
    status: scheduledAt ? 'scheduled' : 'draft',
    created_by: ctx.actor,
  }).select().single();
  if (error) throw new Error(error.message);
  void audit({ action: 'email_campaigns.create', targetTable: 'email_campaigns', targetId: data.id, ...ctx });
  revalidatePath('/admin/emails/campaigns');
  redirect(`/admin/emails/campaigns/${data.id}`);
}

export async function updateCampaign(id: string, formData: FormData) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const scheduledAt = (formData.get('scheduled_at') as string ?? '').trim() || null;
  const { error } = await db.from('email_campaigns').update({
    subject: (formData.get('subject') as string ?? '').trim(),
    body_markdown: (formData.get('body_markdown') as string ?? '').trim(),
    scheduled_at: scheduledAt,
    status: scheduledAt ? 'scheduled' : 'draft',
  }).eq('id', id).eq('status', 'draft'); // only allow editing drafts
  if (error) throw new Error(error.message);
  void audit({ action: 'email_campaigns.update', targetTable: 'email_campaigns', targetId: id, ...ctx });
  revalidatePath(`/admin/emails/campaigns/${id}`);
}

export async function deleteCampaign(id: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  const db = createAdminClient();
  const { error } = await db.from('email_campaigns').delete().eq('id', id);
  if (error) throw new Error(error.message);
  void audit({ action: 'email_campaigns.delete', targetTable: 'email_campaigns', targetId: id, ...ctx });
  redirect('/admin/emails/campaigns');
}
