'use server';

import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/guard';
import { adminUpdate } from '@/lib/admin/crud';
import { revalidatePath } from 'next/cache';

const id$ = z.string().uuid();

export async function updateContactStatus(id: string, status: string) {
  const ctx = await requireAdmin();
  id$.parse(id);
  await adminUpdate('contact_messages', id, { status }, ctx);
  revalidatePath('/admin/contact');
  revalidatePath(`/admin/contact/${id}`);
}
