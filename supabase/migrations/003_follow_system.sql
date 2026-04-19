-- ============================================================
-- Migration 003: Follow System
-- ============================================================

create table public.user_follows (
  follower_id  uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

create index user_follows_follower_id_idx  on public.user_follows(follower_id);
create index user_follows_following_id_idx on public.user_follows(following_id);

alter table public.user_follows enable row level security;

-- Anyone can read follows (needed for follower/following counts)
create policy "Anyone can view follows"
  on public.user_follows for select using (true);

-- Authenticated users can follow (only as themselves)
create policy "Authenticated users can follow"
  on public.user_follows for insert
  with check (auth.uid() = follower_id);

-- Authenticated users can unfollow (only their own follows)
create policy "Authenticated users can unfollow"
  on public.user_follows for delete
  using (auth.uid() = follower_id);
