'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin/guard';
import { audit } from '@/lib/admin/audit';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const id$ = z.string().uuid();

export async function createList(formData: FormData) {
  const ctx = await requireAdmin();
  const name = (formData.get('name') as string ?? '').trim();
  if (!name) throw new Error('Name is required');
  const db = createAdminClient();
  const { data, error } = await db.from('email_lists').insert({
    name,
    description: (formData.get('description') as string ?? '').trim() || null,
    created_by: ctx.actor,
  }).select().single();
  if (error) throw new Error(error.message);
  void audit({ action: 'email_lists.create', targetTable: 'email_lists', targetId: data.id, ...ctx });
  redirect(`/admin/emails/lists/${data.id}`);
}

export async function addMember(listId: string, formData: FormData) {
  const ctx = await requireAdmin();
  id$.parse(listId);
  const email = (formData.get('email') as string ?? '').trim().toLowerCase();
  if (!email) throw new Error('Email is required');
  const db = createAdminClient();
  const { error } = await db.from('email_list_members').upsert({
    list_id: listId,
    email,
    unsubscribed_at: null,
  });
  if (error) throw new Error(error.message);
  void audit({ action: 'email_list_members.add', targetTable: 'email_list_members', targetId: listId, ...ctx });
  revalidatePath(`/admin/emails/lists/${listId}`);
}

export async function removeMember(listId: string, email: string) {
  const ctx = await requireAdmin();
  id$.parse(listId);
  const db = createAdminClient();
  const { error } = await db.from('email_list_members').delete().eq('list_id', listId).eq('email', email);
  if (error) throw new Error(error.message);
  void audit({ action: 'email_list_members.remove', targetTable: 'email_list_members', targetId: listId, ...ctx });
  revalidatePath(`/admin/emails/lists/${listId}`);
}
