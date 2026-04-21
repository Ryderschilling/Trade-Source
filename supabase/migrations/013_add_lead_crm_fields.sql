-- Add notes field to leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes text;

-- Update status constraint to support CRM pipeline
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'won', 'lost'));

-- Migrate existing statuses
UPDATE public.leads SET status = 'contacted' WHERE status = 'viewed';
UPDATE public.leads SET status = 'lost' WHERE status = 'closed';
