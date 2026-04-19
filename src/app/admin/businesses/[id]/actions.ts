'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function deleteBusiness(businessId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('contractors')
    .delete()
    .eq('id', businessId);

  if (error) throw new Error(error.message);

  redirect('/admin/businesses');
}
