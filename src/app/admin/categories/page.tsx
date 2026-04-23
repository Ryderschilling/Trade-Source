import { createAdminClient } from '@/lib/supabase/admin';
import { TabBar } from '@/components/admin/tab-bar';
import { CategoriesTab } from './categories-tab';
import { GroupsTab } from './groups-tab';

const TABS = [
  { id: 'categories', label: 'Categories' },
  { id: 'groups',     label: 'Groups'     },
];

async function getData() {
  const supabase = createAdminClient();

  const [{ data: cats }, { data: groups }, { data: bizCounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('*, category_groups(name)')
      .order('sort_order', { ascending: true }),
    supabase
      .from('category_groups')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase
      .from('contractors')
      .select('category_id'),
  ]);

  const bizCountMap: Record<string, number> = {};
  for (const b of bizCounts ?? []) {
    if (b.category_id) bizCountMap[b.category_id] = (bizCountMap[b.category_id] ?? 0) + 1;
  }

  const catCountMap: Record<string, number> = {};
  for (const c of cats ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gid = (c as any).group_id;
    if (gid) catCountMap[gid] = (catCountMap[gid] ?? 0) + 1;
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: (cats ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      group_id: c.group_id,
      group_name: c.category_groups?.name ?? null,
      sort_order: c.sort_order,
      business_count: bizCountMap[c.id] ?? 0,
    })),
    groups: (groups ?? []).map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      icon: g.icon,
      description: g.description,
      sort_order: g.sort_order,
      category_count: catCountMap[g.id] ?? 0,
    })),
  };
}

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? 'categories';
  const { categories, groups } = await getData();

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-neutral-800">Categories</h2>
        <p className="text-sm text-neutral-500 mt-0.5">
          {categories.length} categories across {groups.length} groups
        </p>
      </div>

      <TabBar tabs={TABS} activeTab={tab} baseHref="/admin/categories" />

      {tab === 'categories' && (
        <CategoriesTab categories={categories} groups={groups} />
      )}

      {tab === 'groups' && (
        <GroupsTab groups={groups} />
      )}
    </div>
  );
}
