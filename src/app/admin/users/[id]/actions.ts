'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function deleteUser(userId: string) {
  const supabase = createAdminClient();

  // Delete the profile row first (cascade handles related data)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  // Delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  redirect('/admin/users');
}
