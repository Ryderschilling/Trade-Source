import { createAdminClient } from '@/lib/supabase/admin';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft } from 'lucide-react';
import { addMember, removeMember } from '../actions';

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function EmailListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: list, error } = await supabase
    .from('email_lists')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !list) notFound();

  const { data: members } = await supabase
    .from('email_list_members')
    .select('*')
    .eq('list_id', id)
    .order('added_at', { ascending: false });

  const active = (members ?? []).filter((m) => !m.unsubscribed_at);
  const unsub = (members ?? []).filter((m) => m.unsubscribed_at);

  const addAction = addMember.bind(null, id);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/emails/lists" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 transition-colors">
          <ChevronLeft className="w-4 h-4" />Lists
        </Link>
        <h2 className="text-lg font-semibold text-neutral-800">{list.name}</h2>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-center">
          <p className="text-xl font-semibold text-neutral-800">{active.length.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">Active</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-center">
          <p className="text-xl font-semibold text-neutral-800">{unsub.length.toLocaleString()}</p>
          <p className="text-xs text-neutral-500">Unsubscribed</p>
        </div>
      </div>

      {/* Add member */}
      <form action={addAction} className="flex gap-2 mb-5">
        <Input name="email" type="email" placeholder="Add email address" className="h-8 text-sm" required />
        <Button type="submit" size="sm" className="h-8 shrink-0">Add</Button>
      </form>

      {/* Members table */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {active.length === 0 ? (
          <p className="text-sm text-neutral-400 p-5">No subscribers yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                <th className="text-left px-4 py-2.5 font-semibold">Email</th>
                <th className="text-left px-4 py-2.5 font-semibold">Added</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {active.map((m) => {
                const removeAction = removeMember.bind(null, id, m.email);
                return (
                  <tr key={m.email} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                    <td className="px-4 py-2.5 text-neutral-800">{m.email}</td>
                    <td className="px-4 py-2.5 text-neutral-500 text-xs">{fmt(m.added_at)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="default" className="text-xs">Active</Badge>
                    </td>
                    <td className="px-4 py-2.5">
                      <form action={removeAction}>
                        <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2 text-red-600 hover:text-red-700 hover:border-red-300">
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {unsub.map((m) => (
                <tr key={m.email} className="border-b border-neutral-50 last:border-0 bg-neutral-50/50">
                  <td className="px-4 py-2.5 text-neutral-400 line-through">{m.email}</td>
                  <td className="px-4 py-2.5 text-neutral-400 text-xs">{fmt(m.added_at)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="secondary" className="text-xs">Unsubscribed</Badge>
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
