-- Expand business_addons status CHECK to include reserved + sent
ALTER TABLE business_addons DROP CONSTRAINT IF EXISTS business_addons_status_check;

ALTER TABLE business_addons
  ADD CONSTRAINT business_addons_status_check
  CHECK (status IN (
    'active',
    'paused',
    'cancelled',
    'waitlisted',
    'pending_review',
    'reserved',
    'sent'
  ));

-- Add source column to stripe_orphans if not present
ALTER TABLE stripe_orphans
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'unknown';

-- REMEDIATION (run manually, not automatically):
-- After fixing, insert the QA test's orphaned $250 charge.
-- Pull the real pi_* from stripe_events where event_type='checkout.session.completed'
-- and processing_error ilike '%status_check%'.
--
-- INSERT INTO business_addons (
--   business_id, addon_type, status, reserved_month,
--   stripe_payment_intent_id, amount_paid_cents, started_at
-- ) VALUES (
--   '203c430d-ea86-4354-bdcd-6463bea87688',
--   'featured_email',
--   'reserved',
--   '2026-05',
--   '<pi_* from stripe_events>',
--   25000,
--   NOW()
-- )
-- ON CONFLICT DO NOTHING;
