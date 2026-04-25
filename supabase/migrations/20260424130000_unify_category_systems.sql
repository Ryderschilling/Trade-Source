BEGIN;

-- ============================================================
-- Migration: Unify the two category systems introduced by
-- 015_new_taxonomy.sql and 20260424120000_add_category_groups.sql.
--
-- Execution order matters — steps must run sequentially.
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- Step 1: Add the three new category_groups
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.category_groups (name, slug, icon, description, sort_order) VALUES
  ('Real Estate & Property', 'real-estate-property', 'Building2', 'Real estate agents, brokers, appraisers, title, and mortgage professionals', 11),
  ('Legal & Financial',      'legal-financial',      'Scale',     'Attorneys, CPAs, financial advisors, and insurance professionals',            12),
  ('Design & Architecture',  'design-architecture',  'PenTool',   'Architects, interior designers, and land surveyors',                          13)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order;


-- ─────────────────────────────────────────────────────────────
-- Step 2: Delete duplicate rows before slug renames
--
-- All DELETEs are guarded so we never drop a row that a
-- contractor already references (mirrors the 015 safety guard).
-- ─────────────────────────────────────────────────────────────

-- physical-therapist was inserted by 20260424120000 (group_id = null).
-- We keep the 015 physical-therapy row (which has the correct group_id)
-- and rename it below, so this duplicate can go.
DELETE FROM public.categories
WHERE slug = 'physical-therapist'
  AND id NOT IN (
    SELECT DISTINCT category_id
    FROM public.contractors
    WHERE category_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT unnest(additional_categories)
    FROM public.contractors
    WHERE cardinality(additional_categories) > 0
  );

-- cpa-accounting was inserted by 20260424120000 (group_id = null).
-- We keep the 015 cpa-tax row (which has the correct group_id)
-- and rename it below, so this duplicate can go.
DELETE FROM public.categories
WHERE slug = 'cpa-accounting'
  AND id NOT IN (
    SELECT DISTINCT category_id
    FROM public.contractors
    WHERE category_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT unnest(additional_categories)
    FROM public.contractors
    WHERE cardinality(additional_categories) > 0
  );

-- attorney (015 generic slug) is fully superseded by real-estate-attorney,
-- estate-planning, and business-attorney added in 20260424120000.
DELETE FROM public.categories
WHERE slug = 'attorney'
  AND id NOT IN (
    SELECT DISTINCT category_id
    FROM public.contractors
    WHERE category_id IS NOT NULL
  )
  AND id NOT IN (
    SELECT DISTINCT unnest(additional_categories)
    FROM public.contractors
    WHERE cardinality(additional_categories) > 0
  );


-- ─────────────────────────────────────────────────────────────
-- Step 3: Rename 015 slugs to their canonical forms
-- ─────────────────────────────────────────────────────────────

-- physical-therapy → physical-therapist (more precise trade label)
UPDATE public.categories SET
  name        = 'Physical Therapist',
  slug        = 'physical-therapist',
  icon        = 'PersonStanding',
  description = 'Licensed physical therapists'
WHERE slug = 'physical-therapy';

-- cpa-tax → cpa-accounting (matches the 20260424120000 insert intent)
UPDATE public.categories SET
  name        = 'CPA / Accounting',
  slug        = 'cpa-accounting',
  icon        = 'Calculator',
  description = 'Certified public accountants and tax professionals'
WHERE slug = 'cpa-tax';


-- ─────────────────────────────────────────────────────────────
-- Step 4: Assign group_id for categories added in 20260424120000
--
-- Those inserts used only (name, slug, icon, description,
-- sort_order, category_group) — group_id was not included,
-- so it defaulted to NULL.
-- ─────────────────────────────────────────────────────────────

UPDATE public.categories
SET group_id = (SELECT id FROM public.category_groups WHERE slug = 'real-estate-property')
WHERE slug IN (
  'real-estate-brokerage',
  'home-inspector',
  'title-escrow',
  'mortgage-lending',
  'real-estate-appraiser'
);

UPDATE public.categories
SET group_id = (SELECT id FROM public.category_groups WHERE slug = 'legal-financial')
WHERE slug IN (
  'real-estate-attorney',
  'estate-planning',
  'business-attorney'
);

-- primary-care and mental-health go under the existing health-wellness group
UPDATE public.categories
SET group_id = (SELECT id FROM public.category_groups WHERE slug = 'health-wellness')
WHERE slug IN (
  'primary-care',
  'mental-health'
);

UPDATE public.categories
SET group_id = (SELECT id FROM public.category_groups WHERE slug = 'design-architecture')
WHERE slug IN (
  'architect',
  'interior-designer',
  'land-surveyor'
);


-- ─────────────────────────────────────────────────────────────
-- Step 5: Resolve split-brain slugs
--
-- These rows existed in 015 under professional-services or
-- property-services, but semantically belong in the new groups.
-- ─────────────────────────────────────────────────────────────

UPDATE public.categories
SET group_id = (SELECT id FROM public.category_groups WHERE slug = 'real-estate-property')
WHERE slug IN ('real-estate-agent', 'property-management');

UPDATE public.categories
SET group_id = (SELECT id FROM public.category_groups WHERE slug = 'legal-financial')
WHERE slug IN ('financial-advisor', 'insurance-agent', 'cpa-accounting');


-- ─────────────────────────────────────────────────────────────
-- Step 6: Re-add high-demand 30A trades removed in 015
--
-- screen-enclosures and garage-doors were pruned in 015 but
-- remain strong local demand categories.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.categories (name, slug, icon, description, sort_order, group_id) VALUES
  ('Garage Doors',      'garage-doors',      'DoorOpen', 'Garage door installation, repair, and maintenance', 19,
    (SELECT id FROM public.category_groups WHERE slug = 'exterior-structure')),
  ('Screen Enclosures', 'screen-enclosures', 'Grid',     'Screen enclosure installation and repair',          20,
    (SELECT id FROM public.category_groups WHERE slug = 'exterior-structure'))
ON CONFLICT (slug) DO NOTHING;


-- ─────────────────────────────────────────────────────────────
-- Step 7: Sync category_group text from group_id (single pass)
--
-- Fixes the 'Home Services' default on all 015 trades, corrects
-- any stale text on reassigned rows, and covers the new inserts
-- from steps 4–6 in one statement.
--
-- NOTE: category_group is now redundant with group_id.
-- It can be dropped (ALTER TABLE public.categories DROP COLUMN
-- category_group) once frontend code is confirmed to read
-- group_id exclusively.
-- ─────────────────────────────────────────────────────────────
UPDATE public.categories c
SET category_group = cg.name
FROM public.category_groups cg
WHERE c.group_id = cg.id;

COMMIT;
