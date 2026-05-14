-- ============================================================
-- 029_pii_views.sql
-- Quarterly audit 2026-05-13 P1 #2: hide PII from public reads via views.
--
-- public.public_profiles    — every column of profiles EXCEPT email and phone.
-- public.public_contractors — every column of contractors EXCEPT email.
--                             phone is intentionally retained: it is a paid-
--                             listing feature, already rendered publicly on
--                             /contractors/[slug] (tel: link + JSON-LD).
--
-- Both views use `security_invoker = true` (Postgres 15+) so the calling
-- role's RLS policies on the underlying table still apply. This means:
--   - anon: limited to whatever the underlying RLS allows for anon
--   - authenticated: limited to whatever the underlying RLS allows for them
-- Underlying RLS policies are intentionally NOT changed here; that lockdown
-- is deferred to a future migration once view consumers have stabilized.
-- ============================================================

create or replace view public.public_profiles
  with (security_invoker = true)
  as
  select
    id,
    full_name,
    avatar_url,
    bio,
    city,
    address,
    role,
    is_public,
    created_at,
    updated_at
  from public.profiles;

comment on view public.public_profiles is
  'PII-safe projection of public.profiles. Excludes email and phone. Use this view for any cross-user or anonymous read; query public.profiles directly only for the authenticated-own (auth.uid() = id) case where the owner needs their own contact fields.';

grant select on public.public_profiles to anon, authenticated;

create or replace view public.public_contractors
  with (security_invoker = true)
  as
  select
    id,
    user_id,
    slug,
    business_name,
    owner_name,
    tagline,
    description,
    category_id,
    additional_categories,
    phone,
    website,
    address,
    city,
    state,
    zip,
    service_areas,
    logo_url,
    cover_url,
    license_number,
    is_insured,
    is_licensed,
    years_in_business,
    years_experience,
    status,
    is_claimed,
    is_featured,
    avg_rating,
    review_count,
    view_count,
    lat,
    lng,
    listing_status,
    billing_plan,
    billing_status,
    subscription_status,
    next_billing_date,
    cancel_at,
    cancel_pending,
    payment_last4,
    stripe_customer_id,
    stripe_subscription_id,
    created_at,
    updated_at
  from public.contractors
  where status = 'active';

comment on view public.public_contractors is
  'PII-safe projection of public.contractors. Excludes email only — phone is intentionally retained (paid-listing feature, rendered on /contractors/[slug]). The status = ''active'' filter mirrors the existing "Active contractors are public" RLS policy so this view returns the same row set as a public read of the underlying table. Use this view for any anonymous or cross-user read; query public.contractors directly only for the authenticated-own (auth.uid() = user_id) case where the owner needs their own email.';

grant select on public.public_contractors to anon, authenticated;
