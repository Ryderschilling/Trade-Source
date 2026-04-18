import { createAdminClient } from '@/lib/supabase/admin';
import { StatCard } from '@/components/admin/stat-card';
import { OverviewCharts } from '@/components/admin/overview-charts';
import { Users, Building2, UserPlus, PlusCircle } from 'lucide-react';

async function getOverviewData() {
  const supabase = createAdminClient();

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { count: totalUsers },
    { count: totalBusinesses },
    { count: newUsers },
    { count: newBusinesses },
    { data: profilesLast30 },
    { data: contractorsLast30 },
    { data: contractorsByCategory },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('contractors').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString()),
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('contractors')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('contractors')
      .select('category_id, categories!inner(name)')
      .not('category_id', 'is', null),
  ]);

  // Build a day-by-day array for the last 30 days
  function buildDailyCounts(rows: { created_at: string }[] | null) {
    const counts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      counts[key] = 0;
    }
    for (const row of rows ?? []) {
      const key = new Date(row.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (key in counts) counts[key]++;
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }

  // Aggregate by category
  const catMap: Record<string, number> = {};
  for (const row of contractorsByCategory ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const name = (row as any).categories?.name ?? 'Unknown';
    catMap[name] = (catMap[name] ?? 0) + 1;
  }
  const byCategory = Object.entries(catMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    stats: {
      totalUsers: totalUsers ?? 0,
      totalBusinesses: totalBusinesses ?? 0,
      newUsers: newUsers ?? 0,
      newBusinesses: newBusinesses ?? 0,
    },
    userSignups: buildDailyCounts(profilesLast30),
    businessCreations: buildDailyCounts(contractorsLast30),
    byCategory,
  };
}

export default async function AdminOverviewPage() {
  const { stats, userSignups, businessCreations, byCategory } =
    await getOverviewData();

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-5">Overview</h2>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={Users}
        />
        <StatCard
          label="Total Businesses"
          value={stats.totalBusinesses}
          icon={Building2}
        />
        <StatCard
          label="New Users"
          value={stats.newUsers}
          icon={UserPlus}
          sub="Last 7 days"
        />
        <StatCard
          label="New Businesses"
          value={stats.newBusinesses}
          icon={PlusCircle}
          sub="Last 7 days"
        />
      </div>

      <OverviewCharts
        userSignups={userSignups}
        businessCreations={businessCreations}
        byCategory={byCategory}
      />
    </div>
  );
}
