-- ============================================================
-- Migration 018: Contractor Packages & package_name on leads
-- Run in Supabase SQL editor
-- ============================================================

create table public.contractor_packages (
  id             uuid primary key default uuid_generate_v4(),
  contractor_id  uuid not null references public.contractors(id) on delete cascade,
  name           text not null,
  description    text,
  price_label    text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index contractor_packages_contractor_id_idx on public.contractor_packages(contractor_id);

alter table public.contractor_packages enable row level security;

create policy "Packages are public"
  on public.contractor_packages for select
  using (
    exists (
      select 1 from public.contractors c
      where c.id = contractor_packages.contractor_id and c.status = 'active'
    )
  );

create policy "Owner can manage packages"
  on public.contractor_packages for all
  using (
    exists (
      select 1 from public.contractors c
      where c.id = contractor_packages.contractor_id and c.user_id = auth.uid()
    )
  );

alter table public.leads add column if not exists package_name text;
