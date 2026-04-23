-- 023_admin_platform.sql
-- Admin platform: settings, audit log, featured slots, email marketing,
-- contact messages, stripe events, system message sender.

-- ============================================================
-- SITE SETTINGS (key/value — hero copy, footer, flags, static pages)
-- ============================================================
create table public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.site_settings enable row level security;

create policy "site_settings public read"
  on public.site_settings for select using (true);
-- writes only via service role (admin uses createAdminClient)

insert into public.site_settings (key, value) values
  ('hero',            '{"headline":"Find a trusted local pro","subhead":"30A and Northwest Florida","cta":"Find a Pro"}'::jsonb),
  ('footer',          '{"columns":[]}'::jsonb),
  ('flags',           '{"maintenance_mode":false,"signup_enabled":true,"contractor_signup_enabled":true,"reviews_enabled":true}'::jsonb),
  ('page_about',      '{"markdown":""}'::jsonb),
  ('page_how',        '{"markdown":""}'::jsonb),
  ('page_tradesmen',  '{"markdown":""}'::jsonb),
  ('page_privacy',    '{"markdown":""}'::jsonb),
  ('page_terms',      '{"markdown":""}'::jsonb)
on conflict (key) do nothing;

-- ============================================================
-- FEATURED PLACEMENTS (homepage carousel ordering + schedule)
-- ============================================================
create table public.featured_placements (
  id            uuid primary key default uuid_generate_v4(),
  contractor_id uuid not null references public.contractors(id) on delete cascade,
  slot          text not null default 'homepage_carousel',
  sort_order    integer not null default 0,
  starts_at     timestamptz,
  ends_at       timestamptz,
  created_at    timestamptz not null default now(),
  created_by    text
);

create index featured_placements_slot_idx on public.featured_placements(slot, sort_order);
create index featured_placements_window_idx on public.featured_placements(starts_at, ends_at);

alter table public.featured_placements enable row level security;
create policy "featured public read"
  on public.featured_placements for select using (true);

-- ============================================================
-- CONTACT MESSAGES (from /contact)
-- ============================================================
create table public.contact_messages (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text,
  body        text not null,
  status      text not null default 'new' check (status in ('new','read','replied','archived')),
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages(status);
create trigger contact_messages_updated_at
  before update on public.contact_messages
  for each row execute procedure public.set_updated_at();

alter table public.contact_messages enable row level security;
create policy "contact anyone can insert"
  on public.contact_messages for insert with check (true);

-- ============================================================
-- STRIPE EVENTS (webhook log for replay / debugging)
-- ============================================================
create table public.stripe_events (
  id            text primary key,
  type          text not null,
  payload       jsonb not null,
  processed_at  timestamptz,
  processing_error text,
  created_at    timestamptz not null default now()
);
create index stripe_events_type_idx on public.stripe_events(type);
create index stripe_events_unprocessed_idx on public.stripe_events(created_at)
  where processed_at is null;

alter table public.stripe_events enable row level security;
-- no public policies — admin-only via service client

-- ============================================================
-- EMAIL MARKETING
-- ============================================================
create table public.email_lists (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  query_kind  text check (query_kind in ('all_users','all_contractors','contractors_by_category','homeowners','custom_sql')),
  query_args  jsonb,
  created_at  timestamptz not null default now(),
  created_by  text
);

create table public.email_list_members (
  list_id    uuid not null references public.email_lists(id) on delete cascade,
  email      text not null,
  user_id    uuid references public.profiles(id) on delete set null,
  unsubscribed_at timestamptz,
  added_at   timestamptz not null default now(),
  primary key (list_id, email)
);

create table public.email_campaigns (
  id          uuid primary key default uuid_generate_v4(),
  list_id     uuid not null references public.email_lists(id) on delete restrict,
  subject     text not null,
  body_markdown text not null,
  status      text not null default 'draft' check (status in ('draft','sending','sent','failed','paused')),
  scheduled_at timestamptz,
  sent_at     timestamptz,
  recipient_count integer default 0,
  delivered_count integer default 0,
  failed_count integer default 0,
  created_at  timestamptz not null default now(),
  created_by  text
);

create table public.email_sends (
  id           uuid primary key default uuid_generate_v4(),
  campaign_id  uuid references public.email_campaigns(id) on delete cascade,
  kind         text not null,
  to_email     text not null,
  resend_id    text,
  status       text not null default 'queued' check (status in ('queued','sent','failed','bounced','unsubscribed')),
  error        text,
  meta         jsonb,
  created_at   timestamptz not null default now()
);
create index email_sends_campaign_idx on public.email_sends(campaign_id);
create index email_sends_kind_idx on public.email_sends(kind, created_at desc);

alter table public.email_lists enable row level security;
alter table public.email_list_members enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_sends enable row level security;
-- service-role only for all of the above

-- Global unsubscribe list
create table public.email_unsubscribes (
  email      text primary key,
  reason     text,
  created_at timestamptz not null default now()
);
alter table public.email_unsubscribes enable row level security;
create policy "unsubscribe insert by anyone"
  on public.email_unsubscribes for insert with check (true);
create policy "unsubscribe read own by email"
  on public.email_unsubscribes for select using (true);

-- ============================================================
-- ADMIN AUDIT LOG
-- ============================================================
create table public.admin_audit_log (
  id          bigserial primary key,
  actor       text not null,
  action      text not null,
  target_table text,
  target_id    text,
  diff        jsonb,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now()
);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor, created_at desc);
create index admin_audit_log_target_idx on public.admin_audit_log(target_table, target_id);

alter table public.admin_audit_log enable row level security;
-- service-role only
