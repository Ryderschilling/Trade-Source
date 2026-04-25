-- Partial unique index prevents duplicate active/waitlisted/pending_review
-- rows of the same addon for the same business under concurrent server actions
CREATE UNIQUE INDEX IF NOT EXISTS business_addons_unique_active
  ON business_addons (business_id, addon_type)
  WHERE status IN ('active', 'waitlisted', 'pending_review');

-- Track Stripe rollback failures so we can manually reconcile leaked objects
CREATE TABLE IF NOT EXISTS stripe_orphans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES contractors(id) ON DELETE SET NULL,
  stripe_object_type text NOT NULL,
  stripe_object_id text NOT NULL,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  reconciled_at timestamptz,
  reconciled_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS stripe_orphans_unreconciled_idx
  ON stripe_orphans (created_at) WHERE reconciled_at IS NULL;

-- Featured Email needs to link to the actual Stripe charge
ALTER TABLE business_addons
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

ALTER TABLE business_addons
  ADD COLUMN IF NOT EXISTS amount_paid_cents integer;
