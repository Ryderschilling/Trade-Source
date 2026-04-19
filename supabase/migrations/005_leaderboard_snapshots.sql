-- ============================================================
-- Migration 005: Leaderboard Snapshots
-- Records daily leaderboard positions for historical analytics
-- ============================================================

create table if not exists public.leaderboard_snapshots (
  id            uuid    default gen_random_uuid() primary key,
  snapshot_date date    not null default current_date,
  category      text    not null check (category in ('most_viewed', 'top_rated', 'most_reviewed')),
  rank          integer not null check (rank between 1 and 10),
  contractor_id uuid    not null references public.contractors(id) on delete cascade,
  metric_value  numeric not null,
  created_at    timestamptz default now()
);

-- One snapshot per day per category per rank slot
create unique index if not exists leaderboard_snapshots_unique
  on public.leaderboard_snapshots(snapshot_date, category, rank);

create index if not exists leaderboard_snapshots_contractor_idx
  on public.leaderboard_snapshots(contractor_id);

create index if not exists leaderboard_snapshots_date_category_idx
  on public.leaderboard_snapshots(snapshot_date, category);

alter table public.leaderboard_snapshots enable row level security;

-- Leaderboard positions are public data
create policy "Public can read snapshots"
  on public.leaderboard_snapshots for select using (true);
