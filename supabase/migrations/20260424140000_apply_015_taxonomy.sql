BEGIN;

-- ============================================================
-- Migration: Apply the 015 taxonomy to a database that never
-- had 015 run. Replaces the 006 category_groups with the
-- final 13-group system (015's 10 + Real Estate & Property,
-- Legal & Financial, Design & Architecture).
--
-- Accounts for slug renames already applied by 20260424130000:
--   physical-therapy  → physical-therapist
--   cpa-tax           → cpa-accounting
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- Step 1: Null all group_id FKs so the group rows can be deleted
-- ─────────────────────────────────────────────────────────────
UPDATE public.categories SET group_id = NULL;


-- ─────────────────────────────────────────────────────────────
-- Step 2: Replace all category_groups with the final 13 groups
-- ─────────────────────────────────────────────────────────────
DELETE FROM public.category_groups;

INSERT INTO public.category_groups (name, slug, icon, description, sort_order) VALUES
  ('Exterior & Structure',  'exterior-structure',   'Building2',  'Roofing, siding, windows, gutters, and structural work',                1),
  ('Mechanical Systems',    'mechanical-systems',   'Zap',        'Plumbing, HVAC, electrical, solar, and generators',                     2),
  ('Interior & Remodel',    'interior-remodel',     'Home',       'Painting, flooring, cabinetry, tile, and full remodels',                3),
  ('Outdoor & Landscape',   'outdoor-landscape',    'Leaf',       'Landscaping, lawn care, pool, irrigation, and outdoor living',          4),
  ('Coastal & Marine',      'coastal-marine',       'Waves',      'Docks, seawalls, hurricane shutters, and flood mitigation',             5),
  ('Property Services',     'property-services',    'Sparkles',   'Cleaning, pest control, handyman, and home management',                 6),
  ('Vacation Rentals',      'vacation-rentals',     'Key',        'Rental management, turnover cleaning, and short-term rental services',  7),
  ('Automotive',            'automotive',           'Car',        'Auto repair, detailing, towing, and golf cart service',                 8),
  ('Health & Wellness',     'health-wellness',      'Heart',      'Chiropractic, massage, physical therapy, dental, and med spa',          9),
  ('Professional Services', 'professional-services','Briefcase',  'Real estate, insurance, financial, legal, and tax services',           10),
  ('Real Estate & Property','real-estate-property', 'Building2',  'Real estate agents, brokers, appraisers, title, and mortgage',         11),
  ('Legal & Financial',     'legal-financial',      'Scale',      'Attorneys, CPAs, financial advisors, and insurance professionals',     12),
  ('Design & Architecture', 'design-architecture',  'PenTool',    'Architects, interior designers, and land surveyors',                   13);


-- ─────────────────────────────────────────────────────────────
-- Step 3: Upsert all trades with correct group_id
--
-- ON CONFLICT DO UPDATE preserves existing UUIDs (contractor
-- FK references stay valid) and updates everything else.
-- New slugs are inserted. Zombie slugs (moving, other, etc.)
-- are not in this list and keep group_id = NULL.
-- ─────────────────────────────────────────────────────────────
WITH g AS (
  SELECT id, slug AS gslug FROM public.category_groups
)
INSERT INTO public.categories (name, slug, icon, description, sort_order, group_id) VALUES

  -- Exterior & Structure
  ('Roofing',                            'roofing',               'Home',            'Roof installation, repair, and replacement',                        10, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Siding',                             'siding',                'LayoutGrid',      'Siding installation and repair',                                    11, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Windows & Doors',                    'windows-doors',         'DoorOpen',        'Window and door installation, replacement, and repair',             12, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Gutters',                            'gutters',               'ArrowDown',       'Gutter installation, cleaning, and repair',                         13, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Painting (Exterior)',                'painting-exterior',     'Paintbrush',      'Exterior painting, staining, and coating',                          14, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Pressure Washing',                   'pressure-washing',      'Wind',            'Residential and commercial pressure washing',                       15, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Driveway & Paving',                  'driveway-paving',       'Car',             'Driveway installation, repair, and paving',                         16, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Foundation & Structural',            'foundation-structural', 'Building2',       'Foundation repair, structural work, and waterproofing',             17, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Stucco',                             'stucco',                'Layers',          'Stucco application, repair, and finishing',                         18, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Garage Doors',                       'garage-doors',          'DoorOpen',        'Garage door installation, repair, and maintenance',                 19, (SELECT id FROM g WHERE gslug='exterior-structure')),
  ('Screen Enclosures',                  'screen-enclosures',     'Grid',            'Screen enclosure installation and repair',                          20, (SELECT id FROM g WHERE gslug='exterior-structure')),

  -- Mechanical Systems
  ('Plumbing',                           'plumbing',              'Droplets',        'Plumbers for repairs, installs, and remodels',                      21, (SELECT id FROM g WHERE gslug='mechanical-systems')),
  ('HVAC',                               'hvac',                  'Thermometer',     'Heating, ventilation, and air conditioning specialists',            22, (SELECT id FROM g WHERE gslug='mechanical-systems')),
  ('Electrical',                         'electrical',            'Zap',             'Licensed electricians for all residential and commercial work',     23, (SELECT id FROM g WHERE gslug='mechanical-systems')),
  ('Solar',                              'solar',                 'Sun',             'Solar panel installation and battery storage',                      24, (SELECT id FROM g WHERE gslug='mechanical-systems')),
  ('Generator',                          'generator',             'Cpu',             'Whole-home generator installation and service',                     25, (SELECT id FROM g WHERE gslug='mechanical-systems')),
  ('Water Treatment & Softeners',        'water-treatment',       'Droplets',        'Water softener and treatment system installation and service',      26, (SELECT id FROM g WHERE gslug='mechanical-systems')),
  ('Gas Lines',                          'gas-lines',             'Flame',           'Natural gas and propane line installation and repair',              27, (SELECT id FROM g WHERE gslug='mechanical-systems')),

  -- Interior & Remodel
  ('Painting (Interior)',                'painting-interior',     'Paintbrush',      'Interior painting, wallpaper, and finishing',                       30, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Flooring',                           'flooring',              'Grid',            'Hardwood, tile, LVP, and carpet installation',                      31, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Drywall',                            'drywall',               'Square',          'Drywall installation, repair, and finishing',                       32, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Insulation',                         'insulation',            'Layers',          'Attic, wall, and spray foam insulation',                            33, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Carpentry & Trim',                   'carpentry-trim',        'Ruler',           'Crown molding, baseboards, trim, and custom carpentry',             34, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Cabinetry & Countertops',            'cabinetry-countertops', 'Box',             'Custom cabinetry, built-ins, and countertop installation',          35, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Tile & Stone',                       'tile-stone',            'Layers',          'Tile, stone, and countertop installation',                          36, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Kitchen Remodel',                    'kitchen-remodel',       'Utensils',        'Full kitchen renovation and remodeling',                            37, (SELECT id FROM g WHERE gslug='interior-remodel')),
  ('Bathroom Remodel',                   'bathroom-remodel',      'Droplets',        'Full bathroom renovation and remodeling',                           38, (SELECT id FROM g WHERE gslug='interior-remodel')),

  -- Outdoor & Landscape
  ('Landscaping',                        'landscaping',           'Trees',           'Full landscaping design, hardscape, and new installs',              40, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Lawn Care',                          'lawn-care',             'Leaf',            'Mowing, edging, and routine lawn maintenance',                      41, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Irrigation',                         'irrigation',            'Droplets',        'Sprinkler system installation and repair',                          42, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Tree Service',                       'tree-service',          'TreePine',        'Tree trimming, removal, and stump grinding',                        43, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Pool & Spa',                         'pool-spa',              'Waves',           'Pool construction, maintenance, and repair',                        44, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Outdoor Lighting',                   'outdoor-lighting',      'Lightbulb',       'Landscape and outdoor lighting installation',                       45, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Fencing',                            'fencing',               'Shield',          'Wood, vinyl, aluminum, and chain-link fencing',                     46, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Decks & Patios',                     'decks-patios',          'Sun',             'Deck building, patio construction, and repair',                     47, (SELECT id FROM g WHERE gslug='outdoor-landscape')),
  ('Outdoor Kitchen',                    'outdoor-kitchen',       'Flame',           'Outdoor kitchen and BBQ installations',                             48, (SELECT id FROM g WHERE gslug='outdoor-landscape')),

  -- Coastal & Marine
  ('Dock & Boathouse',                   'dock-boathouse',        'Anchor',          'Dock building, repair, and marine construction',                    50, (SELECT id FROM g WHERE gslug='coastal-marine')),
  ('Seawall & Bulkhead',                 'seawall-bulkhead',      'Waves',           'Seawall and bulkhead installation, repair, and inspection',         51, (SELECT id FROM g WHERE gslug='coastal-marine')),
  ('Hurricane Shutters & Impact Windows','hurricane-shutters',    'ShieldAlert',     'Hurricane shutter and impact window installation',                  52, (SELECT id FROM g WHERE gslug='coastal-marine')),
  ('Flood Mitigation',                   'flood-mitigation',      'ArrowDownToLine', 'Flood barrier, sump pump, and mitigation systems',                  53, (SELECT id FROM g WHERE gslug='coastal-marine')),

  -- Property Services (property-management intentionally excluded — lives in Real Estate & Property)
  ('Home Watch',                         'home-watch',            'Eye',             'Vacancy property checks and home watch services',                   61, (SELECT id FROM g WHERE gslug='property-services')),
  ('Pest Control',                       'pest-control',          'Bug',             'Termite, pest, and wildlife control',                               62, (SELECT id FROM g WHERE gslug='property-services')),
  ('Security Systems',                   'security-systems',      'Lock',            'Alarm systems, cameras, and smart home security',                   63, (SELECT id FROM g WHERE gslug='property-services')),
  ('Locksmith',                          'locksmith',             'Key',             'Lock installation, rekeying, and emergency lockout service',        64, (SELECT id FROM g WHERE gslug='property-services')),
  ('Handyman',                           'handyman',              'Wrench',          'General repairs, installs, and honey-do lists',                     65, (SELECT id FROM g WHERE gslug='property-services')),
  ('Junk Removal',                       'junk-removal',          'Trash2',          'Residential and commercial junk and debris removal',                66, (SELECT id FROM g WHERE gslug='property-services')),
  ('House Cleaning',                     'house-cleaning',        'Sparkles',        'Residential and vacation rental cleaning services',                 67, (SELECT id FROM g WHERE gslug='property-services')),

  -- Vacation Rentals
  ('Rental Management',                  'rental-management',     'ClipboardCheck',  'Short-term rental property management services',                    70, (SELECT id FROM g WHERE gslug='vacation-rentals')),
  ('Turnover Cleaning',                  'turnover-cleaning',     'Sparkles',        'Guest turnover and vacation rental cleaning',                       71, (SELECT id FROM g WHERE gslug='vacation-rentals')),
  ('Linen Service',                      'linen-service',         'Package',         'Vacation rental linen supply and laundry service',                  72, (SELECT id FROM g WHERE gslug='vacation-rentals')),
  ('Rental Photography & Virtual Tours', 'rental-photography',    'Camera',          'Professional photography and virtual tours for rentals',            73, (SELECT id FROM g WHERE gslug='vacation-rentals')),
  ('Staging for Rentals',                'staging-rentals',       'Home',            'Furniture and décor staging for rental properties',                 74, (SELECT id FROM g WHERE gslug='vacation-rentals')),

  -- Automotive
  ('Auto Repair',                        'auto-repair',           'Wrench',          'General auto repair and maintenance',                               80, (SELECT id FROM g WHERE gslug='automotive')),
  ('Auto Body & Paint',                  'auto-body-paint',       'Paintbrush',      'Collision repair, dent removal, and auto painting',                 81, (SELECT id FROM g WHERE gslug='automotive')),
  ('Oil Change',                         'oil-change',            'Droplets',        'Oil change and basic vehicle maintenance',                          82, (SELECT id FROM g WHERE gslug='automotive')),
  ('Tire Shop',                          'tire-shop',             'Circle',          'Tire sales, installation, and rotation',                            83, (SELECT id FROM g WHERE gslug='automotive')),
  ('Car Detailing',                      'car-detailing',         'Car',             'Interior and exterior car detailing',                               84, (SELECT id FROM g WHERE gslug='automotive')),
  ('Towing',                             'towing',                'Truck',           'Vehicle towing and roadside assistance',                            85, (SELECT id FROM g WHERE gslug='automotive')),
  ('Golf Cart Repair',                   'golf-cart-repair',      'Cpu',             'Golf cart repair, maintenance, and upgrades',                       86, (SELECT id FROM g WHERE gslug='automotive')),

  -- Health & Wellness
  -- Note: using physical-therapist and cpa-accounting (already renamed in 20260424130000)
  ('Chiropractor',                       'chiropractor',          'Activity',        'Chiropractic care and spinal adjustment',                           90, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Massage Therapy',                    'massage-therapy',       'Heart',           'Therapeutic and relaxation massage services',                       91, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Physical Therapist',                 'physical-therapist',    'PersonStanding',  'Licensed physical therapists',                                      92, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Dentist',                            'dentist',               'Smile',           'General and cosmetic dental services',                              93, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Med Spa',                            'med-spa',               'Sparkles',        'Medical spa, aesthetics, and wellness treatments',                  94, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Personal Training',                  'personal-training',     'Activity',        'One-on-one fitness coaching and personal training',                 95, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Primary Care',                       'primary-care',          'Stethoscope',     'Family medicine and primary care physicians',                       96, (SELECT id FROM g WHERE gslug='health-wellness')),
  ('Mental Health Counseling',           'mental-health',         'Brain',           'Licensed counselors and therapists',                                97, (SELECT id FROM g WHERE gslug='health-wellness')),

  -- Real Estate & Property
  ('Real Estate Agent',                  'real-estate-agent',     'UserCircle',      'Licensed real estate agents for buying and selling',               100, (SELECT id FROM g WHERE gslug='real-estate-property')),
  ('Real Estate Brokerage',              'real-estate-brokerage', 'Building2',       'Full-service brokerages for residential and commercial',           101, (SELECT id FROM g WHERE gslug='real-estate-property')),
  ('Property Management',               'property-management',   'Key',             'Vacation rental and long-term property management',                102, (SELECT id FROM g WHERE gslug='real-estate-property')),
  ('Home Inspector',                     'home-inspector',        'ClipboardCheck',  'Licensed home inspectors for pre-purchase and new construction',   103, (SELECT id FROM g WHERE gslug='real-estate-property')),
  ('Title & Escrow',                     'title-escrow',          'FileCheck',       'Title companies and escrow services',                              104, (SELECT id FROM g WHERE gslug='real-estate-property')),
  ('Mortgage & Lending',                 'mortgage-lending',      'Landmark',        'Mortgage brokers and local lenders',                               105, (SELECT id FROM g WHERE gslug='real-estate-property')),
  ('Real Estate Appraiser',              'real-estate-appraiser', 'Scale',           'Licensed property appraisers',                                     106, (SELECT id FROM g WHERE gslug='real-estate-property')),

  -- Legal & Financial
  ('Real Estate Attorney',               'real-estate-attorney',  'Scale',           'Attorneys specializing in real estate transactions',               200, (SELECT id FROM g WHERE gslug='legal-financial')),
  ('Estate Planning',                    'estate-planning',       'FileText',        'Wills, trusts, and estate planning attorneys',                     201, (SELECT id FROM g WHERE gslug='legal-financial')),
  ('Business Attorney',                  'business-attorney',     'Briefcase',       'Business formation, contracts, and litigation',                    202, (SELECT id FROM g WHERE gslug='legal-financial')),
  ('CPA / Accounting',                   'cpa-accounting',        'Calculator',      'Certified public accountants and tax professionals',               203, (SELECT id FROM g WHERE gslug='legal-financial')),
  ('Financial Advisor',                  'financial-advisor',     'TrendingUp',      'Certified financial planners and advisors',                        204, (SELECT id FROM g WHERE gslug='legal-financial')),
  ('Insurance Agent',                    'insurance-agent',       'Shield',          'Home, auto, and life insurance agents',                            205, (SELECT id FROM g WHERE gslug='legal-financial')),

  -- Design & Architecture
  ('Architect',                          'architect',             'PenTool',         'Licensed architects for residential and commercial',               400, (SELECT id FROM g WHERE gslug='design-architecture')),
  ('Interior Designer',                  'interior-designer',     'Palette',         'Interior design and space planning',                               401, (SELECT id FROM g WHERE gslug='design-architecture')),
  ('Land Surveyor',                      'land-surveyor',         'Map',             'Licensed land surveyors',                                          402, (SELECT id FROM g WHERE gslug='design-architecture'))

ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order,
  group_id    = EXCLUDED.group_id;


-- ─────────────────────────────────────────────────────────────
-- Step 4: Sync category_group text for all rows that have
-- a group_id. Single JOIN pass covers everything.
-- Rows with group_id = NULL (zombie categories) are untouched.
-- ─────────────────────────────────────────────────────────────
UPDATE public.categories c
SET category_group = cg.name
FROM public.category_groups cg
WHERE c.group_id = cg.id;

COMMIT;
