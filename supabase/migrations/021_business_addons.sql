-- ============================================================
-- Migration 021: Business add-ons + billing columns on contractors
-- ============================================================

-- Billing metadata on contractors
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS billing_plan    TEXT NOT NULL DEFAULT 'free'
    CHECK (billing_plan IN ('free', 'standard', 'pro')),
  ADD COLUMN IF NOT EXISTS billing_status  TEXT NOT NULL DEFAULT 'active'
    CHECK (billing_status IN ('active', 'paused', 'cancelled')),
  ADD COLUMN IF NOT EXISTS next_billing_date  TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS payment_last4      TEXT NULL;

-- Business add-ons
CREATE TABLE IF NOT EXISTS public.business_addons (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id    UUID NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  addon_type     TEXT NOT NULL
    CHECK (addon_type IN ('verified_badge', 'lead_notifications', 'homepage_slider', 'featured_email')),
  status         TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled', 'waitlisted', 'pending_review')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at   TIMESTAMPTZ NULL,
  notes          TEXT NULL,         -- license number for verified_badge
  reserved_month TEXT NULL          -- YYYY-MM for featured_email
);

CREATE INDEX IF NOT EXISTS business_addons_business_id_idx
  ON public.business_addons(business_id);

CREATE INDEX IF NOT EXISTS business_addons_type_status_idx
  ON public.business_addons(addon_type, status);

ALTER TABLE public.business_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own addons"
  ON public.business_addons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.contractors c
      WHERE c.id = business_addons.business_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all addons"
  ON public.business_addons FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
