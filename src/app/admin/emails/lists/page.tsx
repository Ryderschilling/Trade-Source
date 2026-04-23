import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { createList } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function AdminEmailListsPage() {
  const supabase = createAdminClient();

  const { data: lists, error } = await supabase
    .from('email_lists')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);

  // Fetch member counts
  const { data: members } = await supabase
    .from('email_list_members')
    .select('list_id')
    .is('unsubscribed_at', null);

  const memberCount: Record<string, number> = {};
  for (const m of members ?? []) {
    memberCount[m.list_id] = (memberCount[m.list_id] ?? 0) + 1;
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Email Lists</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{(lists ?? []).length} lists</p>
        </div>
      </div>

      <div className="space-y-3">
        {(lists ?? []).map((l) => (
          <div key={l.id} className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-neutral-800">{l.name}</p>
              {l.description && <p className="text-xs text-neutral-500 mt-0.5">{l.description}</p>}
              {l.query_kind && (
                <Badge variant="secondary" className="text-xs mt-1">{l.query_kind}</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold text-neutral-800">
                {(memberCount[l.id] ?? 0).toLocaleString()}
                <span className="text-xs font-normal text-neutral-400 ml-1">subscribers</span>
              </span>
              <Link
                href={`/admin/emails/lists/${l.id}`}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                View
              </Link>
            </div>
          </div>
        ))}

        {(lists ?? []).length === 0 && (
          <p className="text-sm text-neutral-400">No lists yet.</p>
        )}

        {/* Quick create form */}
        <form action={createList} className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-neutral-600">Create New List</p>
          <Input name="name" placeholder="List name" className="h-8 text-sm" required />
          <Input name="description" placeholder="Description (optional)" className="h-8 text-sm" />
          <Button type="submit" size="sm" className="h-7">
            <Plus className="w-3.5 h-3.5 mr-1" />Create List
          </Button>
        </form>
      </div>
    </div>
  );
}
