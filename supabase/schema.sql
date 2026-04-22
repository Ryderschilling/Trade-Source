-- ============================================================
-- Trade Source — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  avatar_url  text,
  role        text not null default 'homeowner' check (role in ('homeowner', 'contractor', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  icon        text,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Seed categories — representative cross-section for fresh installs.
-- The full 70-trade taxonomy is populated by migrations 006 and 015.
insert into public.categories (name, slug, icon, description, sort_order) values
  ('Roofing',              'roofing',          'Home',        'Roof installation, repair, and replacement',                        10),
  ('Electrical',           'electrical',       'Zap',         'Licensed electricians for all residential and commercial work',     22),
  ('Plumbing',             'plumbing',         'Droplets',    'Plumbers for repairs, installs, and remodels',                      20),
  ('HVAC',                 'hvac',             'Thermometer', 'Heating, ventilation, and air conditioning specialists',            21),
  ('Flooring',             'flooring',         'Grid',        'Hardwood, tile, LVP, and carpet installation',                      31),
  ('Landscaping',          'landscaping',      'Trees',       'Full landscaping design, hardscape, and new installs',              40),
  ('Pool & Spa',           'pool-spa',         'Waves',       'Pool construction, maintenance, and repair',                        44),
  ('Pest Control',         'pest-control',     'Bug',         'Termite, pest, and wildlife control',                               62),
  ('Handyman',             'handyman',         'Wrench',      'General repairs, installs, and honey-do lists',                     65),
  ('House Cleaning',       'house-cleaning',   'Sparkles',    'Residential and vacation rental cleaning services',                 67);

-- ============================================================
-- CONTRACTORS
-- ============================================================
create table public.contractors (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid references public.profiles(id) on delete set null,
  slug               text not null unique,
  business_name      text not null,
  owner_name         text,
  tagline            text,
  description        text,
  category_id        uuid not null references public.categories(id),
  phone              text,
  email              text,
  website            text,
  address            text,
  city               text not null default '30A',
  state              text not null default 'FL',
  zip                text,
  service_areas      text[] not null default '{}',
  logo_url           text,
  cover_url          text,
  license_number     text,
  is_insured         boolean not null default false,
  is_licensed        boolean not null default false,
  years_in_business  integer,
  status             text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  is_claimed         boolean not null default false,
  is_featured        boolean not null default false,
  avg_rating         numeric(3,2),
  review_count       integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index contractors_category_id_idx on public.contractors(category_id);
create index contractors_status_idx on public.contractors(status);
create index contractors_slug_idx on public.contractors(slug);

create trigger contractors_updated_at
  before update on public.contractors
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id              uuid primary key default uuid_generate_v4(),
  contractor_id   uuid not null references public.contractors(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  rating          integer not null check (rating between 1 and 5),
  title           text,
  body            text,
  is_verified     boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(contractor_id, user_id)
);

create index reviews_contractor_id_idx on public.reviews(contractor_id);

create trigger reviews_updated_at
  before update on public.reviews
  for each row execute procedure public.set_updated_at();

-- Recompute avg_rating and review_count on the contractor after review change
create or replace function public.refresh_contractor_rating()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_contractor_id uuid;
begin
  v_contractor_id := coalesce(new.contractor_id, old.contractor_id);
  update public.contractors
  set
    avg_rating   = (select round(avg(rating)::numeric, 2) from public.reviews where contractor_id = v_contractor_id),
    review_count = (select count(*) from public.reviews where contractor_id = v_contractor_id)
  where id = v_contractor_id;
  return null;
end;
$$;

create trigger refresh_rating_on_insert
  after insert on public.reviews
  for each row execute procedure public.refresh_contractor_rating();

create trigger refresh_rating_on_update
  after update on public.reviews
  for each row execute procedure public.refresh_contractor_rating();

create trigger refresh_rating_on_delete
  after delete on public.reviews
  for each row execute procedure public.refresh_contractor_rating();

-- ============================================================
-- LEADS
-- ============================================================
create table public.leads (
  id                uuid primary key default uuid_generate_v4(),
  contractor_id     uuid not null references public.contractors(id) on delete cascade,
  name              text not null,
  email             text not null,
  phone             text,
  message           text not null,
  service_type      text,
  preferred_contact text not null default 'either' check (preferred_contact in ('email', 'phone', 'either')),
  status            text not null default 'new' check (status in ('new', 'viewed', 'contacted', 'closed')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index leads_contractor_id_idx on public.leads(contractor_id);
create index leads_status_idx on public.leads(status);

create trigger leads_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- PORTFOLIO PHOTOS
-- ============================================================
create table public.portfolio_photos (
  id              uuid primary key default uuid_generate_v4(),
  contractor_id   uuid not null references public.contractors(id) on delete cascade,
  url             text not null,
  caption         text,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index portfolio_photos_contractor_id_idx on public.portfolio_photos(contractor_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles         enable row level security;
alter table public.categories        enable row level security;
alter table public.contractors       enable row level security;
alter table public.reviews           enable row level security;
alter table public.leads             enable row level security;
alter table public.portfolio_photos  enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- CATEGORIES (public read-only)
create policy "Categories are public"
  on public.categories for select using (true);

-- CONTRACTORS (active listings are public)
create policy "Active contractors are public"
  on public.contractors for select using (status = 'active');

create policy "Contractors can view own listing regardless of status"
  on public.contractors for select
  using (auth.uid() = user_id);

create policy "Contractors can update own listing"
  on public.contractors for update
  using (auth.uid() = user_id);

create policy "Authenticated users can insert contractor"
  on public.contractors for insert
  with check (auth.uid() = user_id);

-- REVIEWS (public read, owners write own)
create policy "Reviews are public"
  on public.reviews for select using (true);

create policy "Authenticated users can insert reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete
  using (auth.uid() = user_id);

-- LEADS (contractors can view their own leads; anyone can insert)
create policy "Anyone can submit a lead"
  on public.leads for insert
  with check (true);

create policy "Contractor owner can view their leads"
  on public.leads for select
  using (
    exists (
      select 1 from public.contractors c
      where c.id = leads.contractor_id
        and c.user_id = auth.uid()
    )
  );

create policy "Contractor owner can update lead status"
  on public.leads for update
  using (
    exists (
      select 1 from public.contractors c
      where c.id = leads.contractor_id
        and c.user_id = auth.uid()
    )
  );

-- PORTFOLIO PHOTOS (public read, owner write)
create policy "Portfolio photos are public"
  on public.portfolio_photos for select using (true);

create policy "Contractor owner can manage portfolio photos"
  on public.portfolio_photos for all
  using (
    exists (
      select 1 from public.contractors c
      where c.id = portfolio_photos.contractor_id
        and c.user_id = auth.uid()
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values
  ('contractor-logos',    'contractor-logos',    true),
  ('contractor-covers',   'contractor-covers',   true),
  ('portfolio-photos',    'portfolio-photos',    true),
  ('avatars',             'avatars',             true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public read contractor logos"
  on storage.objects for select using (bucket_id = 'contractor-logos');

create policy "Authenticated upload contractor logos"
  on storage.objects for insert
  with check (bucket_id = 'contractor-logos' and auth.role() = 'authenticated');

create policy "Public read contractor covers"
  on storage.objects for select using (bucket_id = 'contractor-covers');

create policy "Authenticated upload contractor covers"
  on storage.objects for insert
  with check (bucket_id = 'contractor-covers' and auth.role() = 'authenticated');

create policy "Public read portfolio photos"
  on storage.objects for select using (bucket_id = 'portfolio-photos');

create policy "Authenticated upload portfolio photos"
  on storage.objects for insert
  with check (bucket_id = 'portfolio-photos' and auth.role() = 'authenticated');

create policy "Public read avatars"
  on storage.objects for select using (bucket_id = 'avatars');

create policy "Authenticated upload avatars"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
