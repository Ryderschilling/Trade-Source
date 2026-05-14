-- 027_enable_rls_stripe_orphans.sql
-- Migration 024 created stripe_orphans without enabling RLS. The Stripe webhook
-- writes via the service-role client (which bypasses RLS), so enabling RLS with
-- no policies produces a safe silent-deny for every other role.

alter table public.stripe_orphans enable row level security;
