'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

const idSchema = z.string().uuid('Invalid business ID');

export async function deleteBusiness(businessId: string) {
  const parsed = idSchema.safeParse(businessId);
  if (!parsed.success) throw new Error(parsed.error.errors[0].message);

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('contractors')
    .delete()
    .eq('id', parsed.data);

  if (error) throw new Error(error.message);

  redirect('/admin/businesses');
}
