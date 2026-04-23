import { createAdminClient } from '@/lib/supabase/admin';
import { StatCard } from '@/components/admin/stat-card';
import { OverviewCharts } from '@/components/admin/overview-charts';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Users, Building2, UserPlus, PlusCircle, Clock, CreditCard } from 'lucide-react';

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
    { count: pendingBusinesses },
    { count: activeSubscriptions },
    { data: profilesLast30 },
    { data: contractorsLast30 },
    { data: contractorsByCategory },
    { data: recentAudit },
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
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('contractors')
      .select('*', { count: 'exact', head: true })
      .eq('subscription_status', 'active'),
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
    supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15),
  ]);

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
      pendingBusinesses: pendingBusinesses ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
    },
    userSignups: buildDailyCounts(profilesLast30),
    businessCreations: buildDailyCounts(contractorsLast30),
    byCategory,
    recentAudit: recentAudit ?? [],
  };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default async function AdminOverviewPage() {
  const { stats, userSignups, businessCreations, byCategory, recentAudit } =
    await getOverviewData();

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-800 mb-5">Overview</h2>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Users"        value={stats.totalUsers}        icon={Users}        />
        <StatCard label="Total Businesses"   value={stats.totalBusinesses}   icon={Building2}    />
        <StatCard label="New Users"          value={stats.newUsers}          icon={UserPlus}     sub="Last 7 days" />
        <StatCard label="New Businesses"     value={stats.newBusinesses}     icon={PlusCircle}   sub="Last 7 days" />
        <StatCard
          label="Pending Review"
          value={stats.pendingBusinesses}
          icon={Clock}
          sub="Businesses"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.activeSubscriptions}
          icon={CreditCard}
          sub="Businesses"
        />
      </div>

      <OverviewCharts
        userSignups={userSignups}
        businessCreations={businessCreations}
        byCategory={byCategory}
      />

      {/* Recent audit events */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-neutral-700 mb-3">Recent Admin Activity</h3>
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {recentAudit.length === 0 ? (
            <p className="text-sm text-neutral-400 p-4">No audit events yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-neutral-100 text-xs text-neutral-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-2.5 font-semibold">Action</th>
                    <th className="text-left px-4 py-2.5 font-semibold hidden sm:table-cell">Table</th>
                    <th className="text-left px-4 py-2.5 font-semibold hidden sm:table-cell">Target</th>
                    <th className="text-left px-4 py-2.5 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAudit.map((ev) => (
                    <tr key={ev.id} className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50">
                      <td className="px-4 py-2.5 font-mono text-xs text-neutral-700">{ev.action}</td>
                      <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                        {ev.target_table ? (
                          <Badge variant="secondary" className="text-xs font-mono">
                            {ev.target_table}
                          </Badge>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-500 font-mono hidden sm:table-cell">
                        {ev.target_id
                          ? <span title={ev.target_id}>{ev.target_id.slice(0, 8)}…</span>
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-neutral-400 whitespace-nowrap">
                        {fmt(ev.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
