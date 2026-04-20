import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { StatCard } from '@/components/admin/stat-card';
import { TakeSnapshotButton } from './take-snapshot-button';
import { Eye, Star, MessageSquare, Trophy, CalendarDays } from 'lucide-react';

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getLeaderboardData() {
  const supabase = createAdminClient();

  const contractorSelect = `
    id, slug, business_name, city, state,
    avg_rating, review_count, view_count,
    categories(name)
  `;

  const [
    { data: mostViewedRaw },
    { data: topRatedCandidates },
    { data: mostReviewedRaw },
    { data: snapshots },
    { data: snapshotDates },
  ] = await Promise.all([
    supabase
      .from('contractors')
      .select(contractorSelect)
      .eq('status', 'active')
      .order('view_count', { ascending: false })
      .limit(10),
    supabase
      .from('contractors')
      .select(contractorSelect)
      .eq('status', 'active')
      .gte('review_count', 3)
      .not('avg_rating', 'is', null)
      .limit(50),
    supabase
      .from('contractors')
      .select(contractorSelect)
      .eq('status', 'active')
      .order('review_count', { ascending: false })
      .limit(10),
    // Fetch all rank-1 snapshots for historical "days at #1" analytics
    supabase
      .from('leaderboard_snapshots')
      .select('contractor_id, category, snapshot_date, contractors(business_name, slug)')
      .eq('rank', 1)
      .order('snapshot_date', { ascending: false }),
    // Distinct snapshot dates to count how many days have been tracked
    supabase
      .from('leaderboard_snapshots')
      .select('snapshot_date')
      .order('snapshot_date', { ascending: false }),
  ]);

  type ContractorRow = {
    id: string;
    slug: string;
    business_name: string;
    city: string;
    state: string;
    avg_rating: number | null;
    review_count: number;
    view_count: number;
    categories: { name: string } | null;
    score?: number;
  };

  const mostViewed = (mostViewedRaw ?? []) as unknown as ContractorRow[];
  const mostReviewed = (mostReviewedRaw ?? []) as unknown as ContractorRow[];

  const topRated = ((topRatedCandidates ?? []) as unknown as ContractorRow[])
    .map((c) => ({
      ...c,
      score: (c.avg_rating ?? 0) * Math.log(c.review_count + 1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Count distinct tracked days
  const distinctDates = new Set((snapshotDates ?? []).map((r) => r.snapshot_date));
  const trackedDays = distinctDates.size;
  const latestSnapshot = snapshotDates?.[0]?.snapshot_date ?? null;

  // Aggregate "days at #1" per contractor per category
  type DaysAtTop = {
    contractor_id: string;
    business_name: string;
    slug: string;
    days: number;
  };

  const daysAtTopMap: Record<string, Record<string, DaysAtTop>> = {
    most_viewed: {},
    top_rated: {},
    most_reviewed: {},
  };

  for (const snap of (snapshots ?? []) as unknown as {
    contractor_id: string;
    category: string;
    snapshot_date: string;
    contractors: { business_name: string; slug: string } | null;
  }[]) {
    const cat = snap.category;
    if (!(cat in daysAtTopMap)) continue;
    const existing = daysAtTopMap[cat][snap.contractor_id];
    if (existing) {
      existing.days++;
    } else {
      daysAtTopMap[cat][snap.contractor_id] = {
        contractor_id: snap.contractor_id,
        business_name: snap.contractors?.business_name ?? 'Unknown',
        slug: snap.contractors?.slug ?? '',
        days: 1,
      };
    }
  }

  const topByDays = (cat: string): DaysAtTop[] =>
    Object.values(daysAtTopMap[cat] ?? {})
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);

  return {
    mostViewed,
    topRated,
    mostReviewed,
    trackedDays,
    latestSnapshot,
    historicalMostViewed: topByDays('most_viewed'),
    historicalTopRated: topByDays('top_rated'),
    historicalMostReviewed: topByDays('most_reviewed'),
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RankingsTable({
  rows,
  metric,
}: {
  rows: {
    id: string;
    slug: string;
    business_name: string;
    city: string;
    state: string;
    avg_rating: number | null;
    review_count: number;
    view_count: number;
    categories: { name: string } | null;
    score?: number;
  }[];
  metric: 'view_count' | 'top_rated' | 'review_count';
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-sm">
        <thead className="bg-neutral-50 text-xs font-medium text-neutral-500 uppercase tracking-wide">
          <tr>
            <th className="px-4 py-3 text-left w-10">#</th>
            <th className="px-4 py-3 text-left">Business</th>
            <th className="px-4 py-3 text-left hidden md:table-cell">Trade</th>
            <th className="px-4 py-3 text-left hidden lg:table-cell">Location</th>
            <th className="px-4 py-3 text-right">Views</th>
            <th className="px-4 py-3 text-right">Rating</th>
            <th className="px-4 py-3 text-right">Reviews</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {rows.map((c, i) => (
            <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3 font-medium text-neutral-400">{i + 1}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/contractors/${c.slug}`}
                  className="font-medium text-neutral-900 hover:text-blue-600 transition-colors"
                  target="_blank"
                >
                  {c.business_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">
                {c.categories?.name ?? '—'}
              </td>
              <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">
                {c.city}, {c.state}
              </td>
              <td className="px-4 py-3 text-right text-neutral-700">
                <span className={metric === 'view_count' ? 'font-semibold text-neutral-900' : ''}>
                  {c.view_count.toLocaleString()}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-neutral-700">
                {c.avg_rating != null ? (
                  <span className={metric === 'top_rated' ? 'font-semibold text-neutral-900' : ''}>
                    {Number(c.avg_rating).toFixed(1)}
                  </span>
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-right text-neutral-700">
                <span className={metric === 'review_count' ? 'font-semibold text-neutral-900' : ''}>
                  {c.review_count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HistoricalTable({
  rows,
  label,
}: {
  rows: { contractor_id: string; business_name: string; slug: string; days: number }[];
  label: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">{label}</h4>
      <div className="rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-neutral-100 bg-white">
            {rows.map((r, i) => (
              <tr key={r.contractor_id} className="hover:bg-neutral-50">
                <td className="px-4 py-2.5 w-8 text-neutral-400 font-medium">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-neutral-900">
                  <Link
                    href={`/contractors/${r.slug}`}
                    className="hover:text-blue-600 transition-colors"
                    target="_blank"
                  >
                    {r.business_name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-right text-neutral-500">
                  {r.days} {r.days === 1 ? 'day' : 'days'} at #1
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminLeaderboardPage() {
  const {
    mostViewed,
    topRated,
    mostReviewed,
    trackedDays,
    latestSnapshot,
    historicalMostViewed,
    historicalTopRated,
    historicalMostReviewed,
  } = await getLeaderboardData();

  const hasHistory = trackedDays > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Leaderboard</h2>
          <p className="text-sm text-neutral-500 mt-0.5">
            Current rankings &amp; historical analytics
          </p>
        </div>
        <TakeSnapshotButton />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="#1 Most Viewed"
          value={mostViewed[0]?.business_name ?? '—'}
          icon={Eye}
          sub={mostViewed[0] ? `${mostViewed[0].view_count.toLocaleString()} views` : undefined}
        />
        <StatCard
          label="#1 Top Rated"
          value={topRated[0]?.business_name ?? '—'}
          icon={Star}
          sub={topRated[0] ? `${Number(topRated[0].avg_rating).toFixed(1)} ★ · ${topRated[0].review_count} reviews` : undefined}
        />
        <StatCard
          label="#1 Most Reviewed"
          value={mostReviewed[0]?.business_name ?? '—'}
          icon={MessageSquare}
          sub={mostReviewed[0] ? `${mostReviewed[0].review_count} reviews` : undefined}
        />
        <StatCard
          label="Days Tracked"
          value={trackedDays}
          icon={CalendarDays}
          sub={latestSnapshot ? `Last: ${latestSnapshot}` : 'No snapshots yet'}
        />
      </div>

      {/* Current Rankings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="text-base font-semibold text-neutral-800">Current Rankings</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-700">Most Viewed</span>
            </div>
            <RankingsTable rows={mostViewed} metric="view_count" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-700">Top Rated</span>
              <span className="text-xs text-neutral-400">(weighted by review volume)</span>
            </div>
            <RankingsTable rows={topRated} metric="top_rated" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-3.5 w-3.5 text-neutral-400" />
              <span className="text-sm font-medium text-neutral-700">Most Reviewed</span>
            </div>
            <RankingsTable rows={mostReviewed} metric="review_count" />
          </div>
        </div>
      </div>

      {/* Historical Analytics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-neutral-500" />
          <h3 className="text-base font-semibold text-neutral-800">Historical — Days at #1</h3>
        </div>

        {!hasHistory ? (
          <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
            <p className="text-sm font-medium text-neutral-500">No snapshot history yet</p>
            <p className="mt-1 text-xs text-neutral-400">
              Click <strong>Take Snapshot</strong> above to start recording daily rankings.
              Run it once per day to build historical data over time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HistoricalTable rows={historicalMostViewed} label="Most Viewed" />
            <HistoricalTable rows={historicalTopRated} label="Top Rated" />
            <HistoricalTable rows={historicalMostReviewed} label="Most Reviewed" />
          </div>
        )}
      </div>
    </div>
  );
}
