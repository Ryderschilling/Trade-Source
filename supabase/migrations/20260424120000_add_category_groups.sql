-- ============================================================
-- Migration: Add category_group column and insert Real Estate,
-- Legal & Financial, Health & Wellness, and Design & Architecture
-- categories.
-- ============================================================

-- Step 1: Add category_group column (no-op if already present)
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS category_group text NOT NULL DEFAULT 'Home Services';

-- Step 2: Back-fill all pre-existing categories
UPDATE public.categories
SET category_group = 'Home Services'
WHERE category_group = 'Home Services'; -- default already applied; explicit for clarity

-- Step 3: Insert new categories
INSERT INTO public.categories (name, slug, icon, description, sort_order, category_group) VALUES

  -- Real Estate & Property
  ('Real Estate Agent',      'real-estate-agent',      'UserCircle',    'Licensed real estate agents for buying and selling',                       100, 'Real Estate & Property'),
  ('Real Estate Brokerage',  'real-estate-brokerage',  'Building2',     'Full-service brokerages for residential and commercial',                   101, 'Real Estate & Property'),
  ('Property Management',    'property-management',    'Key',           'Vacation rental and long-term property management',                        102, 'Real Estate & Property'),
  ('Home Inspector',         'home-inspector',         'ClipboardCheck','Licensed home inspectors for pre-purchase and new construction',            103, 'Real Estate & Property'),
  ('Title & Escrow',         'title-escrow',           'FileCheck',     'Title companies and escrow services',                                      104, 'Real Estate & Property'),
  ('Mortgage & Lending',     'mortgage-lending',       'Landmark',      'Mortgage brokers and local lenders',                                       105, 'Real Estate & Property'),
  ('Real Estate Appraiser',  'real-estate-appraiser',  'Scale',         'Licensed property appraisers',                                             106, 'Real Estate & Property'),

  -- Legal & Financial
  ('Real Estate Attorney',   'real-estate-attorney',   'Scale',         'Attorneys specializing in real estate transactions',                        200, 'Legal & Financial'),
  ('Estate Planning',        'estate-planning',        'FileText',      'Wills, trusts, and estate planning attorneys',                             201, 'Legal & Financial'),
  ('Business Attorney',      'business-attorney',      'Briefcase',     'Business formation, contracts, and litigation',                            202, 'Legal & Financial'),
  ('CPA / Accounting',       'cpa-accounting',         'Calculator',    'Certified public accountants and tax professionals',                       203, 'Legal & Financial'),
  ('Financial Advisor',      'financial-advisor',      'TrendingUp',    'Certified financial planners and advisors',                                204, 'Legal & Financial'),
  ('Insurance Agent',        'insurance-agent',        'Shield',        'Home, auto, and life insurance agents',                                    205, 'Legal & Financial'),

  -- Health & Wellness
  ('Chiropractor',           'chiropractor',           'Activity',      'Licensed chiropractors and spinal care',                                   300, 'Health & Wellness'),
  ('Physical Therapist',     'physical-therapist',     'PersonStanding','Licensed physical therapists',                                             301, 'Health & Wellness'),
  ('Dentist',                'dentist',                'Smile',         'General and cosmetic dentistry',                                           302, 'Health & Wellness'),
  ('Primary Care',           'primary-care',           'Stethoscope',   'Family medicine and primary care physicians',                              303, 'Health & Wellness'),
  ('Mental Health Counseling','mental-health',         'Brain',         'Licensed counselors and therapists',                                       304, 'Health & Wellness'),

  -- Design & Architecture
  ('Architect',              'architect',              'PenTool',       'Licensed architects for residential and commercial',                        400, 'Design & Architecture'),
  ('Interior Designer',      'interior-designer',      'Palette',       'Interior design and space planning',                                       401, 'Design & Architecture'),
  ('Land Surveyor',          'land-surveyor',          'Map',           'Licensed land surveyors',                                                  402, 'Design & Architecture')

ON CONFLICT (slug) DO NOTHING;

-- Step 4: Fix category_group on pre-existing slugs that conflicted above
-- (ON CONFLICT DO NOTHING skips the insert, so we patch the group separately)
UPDATE public.categories SET category_group = 'Real Estate & Property'
  WHERE slug IN ('real-estate-agent', 'property-management');

UPDATE public.categories SET category_group = 'Legal & Financial'
  WHERE slug IN ('financial-advisor', 'insurance-agent', 'attorney', 'cpa-tax');

UPDATE public.categories SET category_group = 'Health & Wellness'
  WHERE slug IN ('chiropractor', 'dentist', 'physical-therapy', 'massage-therapy', 'med-spa', 'personal-training');
