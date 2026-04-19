import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { DeleteButton } from '@/components/admin/delete-button';
import { ChevronLeft } from 'lucide-react';
import { deleteUser } from './actions';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-neutral-100 last:border-0 flex gap-4">
      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide w-36 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-neutral-800 break-all">{value ?? <span className="text-neutral-400">—</span>}</span>
    </div>
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !user) notFound();

  const deleteAction = deleteUser.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Users
          </Link>
          <h2 className="text-lg font-semibold text-neutral-800">User Details</h2>
        </div>
        <DeleteButton action={deleteAction} label="User" />
      </div>

      <div className="bg-white rounded-lg border border-neutral-200 px-5 py-1">
        <Field label="ID" value={user.id} />
        <Field label="Email" value={user.email} />
        <Field label="Full Name" value={user.full_name} />
        <Field
          label="Role"
          value={
            <Badge
              variant={user.role === 'admin' ? 'default' : 'secondary'}
              className="text-xs capitalize"
            >
              {user.role}
            </Badge>
          }
        />
        <Field label="Phone" value={user.phone} />
        <Field label="City" value={user.city} />
        <Field label="Bio" value={user.bio} />
        <Field
          label="Public Profile"
          value={
            <Badge variant={user.is_public ? 'default' : 'secondary'} className="text-xs">
              {user.is_public ? 'Yes' : 'No'}
            </Badge>
          }
        />
        <Field label="Avatar URL" value={user.avatar_url} />
        <Field label="Created" value={formatDate(user.created_at)} />
        <Field label="Updated" value={formatDate(user.updated_at)} />
      </div>
    </div>
  );
}
