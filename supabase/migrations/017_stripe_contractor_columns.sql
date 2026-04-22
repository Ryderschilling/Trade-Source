-- Add Stripe billing columns to contractors
ALTER TABLE public.contractors
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

CREATE INDEX IF NOT EXISTS contractors_stripe_customer_id_idx
  ON public.contractors (stripe_customer_id);

CREATE INDEX IF NOT EXISTS contractors_stripe_subscription_id_idx
  ON public.contractors (stripe_subscription_id);
