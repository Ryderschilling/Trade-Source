-- Migration 007: Support multiple categories per contractor
ALTER TABLE public.contractors ADD COLUMN IF NOT EXISTS additional_categories uuid[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS contractors_additional_categories_idx ON public.contractors USING gin(additional_categories);
