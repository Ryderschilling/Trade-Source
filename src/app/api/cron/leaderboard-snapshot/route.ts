import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const select = 'id, avg_rating, review_count, view_count';

  const [
    { data: mostViewed },
    { data: mostReviewed },
    { data: topRatedCandidates },
  ] = await Promise.all([
    supabase.from('contractors').select(select).eq('status', 'active').order('view_count', { ascending: false }).limit(10),
    supabase.from('contractors').select(select).eq('status', 'active').order('review_count', { ascending: false }).limit(10),
    supabase.from('contractors').select(select).eq('status', 'active').gte('review_count', 3).not('avg_rating', 'is', null).limit(50),
  ]);

  const topRated = (topRatedCandidates ?? [])
    .map((c) => ({ ...c, score: (c.avg_rating ?? 0) * Math.log(c.review_count + 1) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const today = new Date().toISOString().slice(0, 10);

  const rows = [
    ...(mostViewed ?? []).map((c, i) => ({ snapshot_date: today, category: 'most_viewed' as const, rank: i + 1, contractor_id: c.id, metric_value: c.view_count })),
    ...(mostReviewed ?? []).map((c, i) => ({ snapshot_date: today, category: 'most_reviewed' as const, rank: i + 1, contractor_id: c.id, metric_value: c.review_count })),
    ...topRated.map((c, i) => ({ snapshot_date: today, category: 'top_rated' as const, rank: i + 1, contractor_id: c.id, metric_value: c.score })),
  ];

  const { error } = await supabase
    .from('leaderboard_snapshots')
    .upsert(rows, { onConflict: 'snapshot_date,category,rank' });

  if (error) {
    console.error('[leaderboard-snapshot]', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, date: today, rows: rows.length });
}
