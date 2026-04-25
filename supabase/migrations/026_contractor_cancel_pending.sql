-- Track soft-cancel state so listing stays live until period end
ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS cancel_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS cancel_pending BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN contractors.cancel_at IS 'Stripe current_period_end at cancel time — listing goes dark after this';
COMMENT ON COLUMN contractors.cancel_pending IS 'True = user cancelled but still has paid time remaining';
