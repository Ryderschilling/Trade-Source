import { createAdminClient } from '@/lib/supabase/admin';
import type { Profile } from '@/lib/supabase/types';
import { UsersTable } from '@/components/admin/user-columns';

async function getUsers(): Promise<Profile[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Users</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {users.length.toLocaleString()} total registered users
        </p>
      </div>

      <UsersTable data={users} />
    </div>
  );
}
