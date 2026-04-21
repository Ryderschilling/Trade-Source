'use server';

import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

const idSchema = z.string().uuid('Invalid user ID');

export async function deleteUser(userId: string) {
  const parsed = idSchema.safeParse(userId);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);

  const supabase = createAdminClient();

  // Delete the profile row first (cascade handles related data)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', parsed.data);

  if (profileError) throw new Error(profileError.message);

  // Delete the auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(parsed.data);
  if (authError) throw new Error(authError.message);

  redirect('/admin/users');
}
