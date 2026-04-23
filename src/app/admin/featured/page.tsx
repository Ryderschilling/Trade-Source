import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { removeFeaturedPlacement } from './actions';
import { AddPlacementForm } from './add-placement-form';

function fmt(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isActive(p: { starts_at: string | null; ends_at: string | null }) {
  const now = new Date();
  if (p.starts_at && new Date(p.starts_at) > now) return false;
  if (p.ends_at && new Date(p.ends_at) < now) return false;
  return true;
}

const SLOT_LABELS: Record<string, string> = {
  homepage_hero: 'Homepage Hero',
  homepage_featured: 'Homepage Featured',
  sidebar: 'Sidebar',
  category_top: 'Category Top',
};

async function getPlacements() {
  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('featured_placements')
    .select('*, contractors(id, business_name, status)')
    .order('slot', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export default async function AdminFeaturedPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placements: any[] = await getPlacements();

  // Group by slot
  const bySlot: Record<string, typeof placements> = {};
  for (const p of placements) {
    if (!bySlot[p.slot]) bySlot[p.slot] = [];
    bySlot[p.slot].push(p);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Featured Placements</h2>
          <p className="text-sm text-neutral-500 mt-0.5">{placements.length} total placements</p>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(bySlot).map(([slot, items]) => (
          <div key={slot}>
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-2">
              {SLOT_LABELS[slot] ?? slot}
            </h3>
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {items.map((p) => {
                    const active = isActive(p);
                    const removeAction = removeFeaturedPlacement.bind(null, p.id);
                    return (
                      <tr key={p.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={active ? 'default' : 'secondary'} className="text-xs shrink-0">
                              {active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Link
                              href={`/admin/businesses/${p.contractors?.id}`}
                              className="font-medium text-neutral-800 hover:text-blue-600 hover:underline"
                            >
                              {p.contractors?.business_name ?? p.contractor_id}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-400">
                          {fmt(p.starts_at)
                            ? `${fmt(p.starts_at)} → ${fmt(p.ends_at) ?? '∞'}`
                            : 'Always on'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <form action={removeAction} className="inline">
                            <Button type="submit" size="sm" variant="outline" className="h-6 text-xs px-2 text-red-600 hover:text-red-700 hover:border-red-300">
                              Remove
                            </Button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {placements.length === 0 && (
          <p className="text-sm text-neutral-400">No featured placements yet.</p>
        )}

        <AddPlacementForm />
      </div>
    </div>
  );
}
