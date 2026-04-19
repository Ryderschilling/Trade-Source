-- ============================================================
-- Migration 004: Contractor View Count
-- ============================================================

alter table public.contractors
  add column if not exists view_count integer not null default 0;

-- Stored procedure to atomically increment view_count
create or replace function public.increment_view_count(p_contractor_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.contractors
  set view_count = view_count + 1
  where id = p_contractor_id;
$$;
