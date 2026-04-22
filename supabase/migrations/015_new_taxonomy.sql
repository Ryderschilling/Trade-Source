-- ============================================================
-- Migration 015: Replace category_groups and categories with
-- the new 10-group, 70-trade taxonomy.
-- ============================================================

-- Step 1: Clear group assignments so old groups can be deleted
UPDATE public.categories SET group_id = NULL;

-- Step 2: Remove old groups
DELETE FROM public.category_groups;

-- Step 3: Insert new groups
INSERT INTO public.category_groups (name, slug, icon, description, sort_order) VALUES
  ('Exterior & Structure',  'exterior-structure',   'Building2',  'Roofing, siding, windows, gutters, and structural work',                 1),
  ('Mechanical Systems',    'mechanical-systems',   'Zap',        'Plumbing, HVAC, electrical, solar, and generators',                      2),
  ('Interior & Remodel',    'interior-remodel',     'Home',       'Painting, flooring, cabinetry, tile, and full remodels',                 3),
  ('Outdoor & Landscape',   'outdoor-landscape',    'Leaf',       'Landscaping, lawn care, pool, irrigation, and outdoor living',           4),
  ('Coastal & Marine',      'coastal-marine',       'Waves',      'Docks, seawalls, hurricane shutters, and flood mitigation',              5),
  ('Property Services',     'property-services',    'Sparkles',   'Cleaning, pest control, handyman, and home management',                  6),
  ('Vacation Rentals',      'vacation-rentals',     'Key',        'Rental management, turnover cleaning, and short-term rental services',   7),
  ('Automotive',            'automotive',           'Car',        'Auto repair, detailing, towing, and golf cart service',                  8),
  ('Health & Wellness',     'health-wellness',      'Heart',      'Chiropractic, massage, physical therapy, dental, and med spa',           9),
  ('Professional Services', 'professional-services','Briefcase',  'Real estate, insurance, financial, legal, and tax services',            10)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order;

-- Step 4: Upsert all 70 trades
WITH groups AS (
  SELECT id, slug FROM public.category_groups
)
INSERT INTO public.categories (name, slug, icon, description, sort_order, group_id) VALUES

  -- Exterior & Structure
  ('Roofing',                           'roofing',               'Home',           'Roof installation, repair, and replacement',                        10, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Siding',                            'siding',                'LayoutGrid',     'Siding installation and repair',                                    11, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Windows & Doors',                   'windows-doors',         'DoorOpen',       'Window and door installation, replacement, and repair',             12, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Gutters',                           'gutters',               'ArrowDown',      'Gutter installation, cleaning, and repair',                         13, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Painting (Exterior)',               'painting-exterior',     'Paintbrush',     'Exterior painting, staining, and coating',                          14, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Pressure Washing',                  'pressure-washing',      'Wind',           'Residential and commercial pressure washing',                       15, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Driveway & Paving',                 'driveway-paving',       'Car',            'Driveway installation, repair, and paving',                         16, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Foundation & Structural',           'foundation-structural', 'Building2',      'Foundation repair, structural work, and waterproofing',             17, (SELECT id FROM groups WHERE slug='exterior-structure')),
  ('Stucco',                            'stucco',                'Layers',         'Stucco application, repair, and finishing',                         18, (SELECT id FROM groups WHERE slug='exterior-structure')),

  -- Mechanical Systems
  ('Plumbing',                          'plumbing',              'Droplets',       'Plumbers for repairs, installs, and remodels',                      20, (SELECT id FROM groups WHERE slug='mechanical-systems')),
  ('HVAC',                              'hvac',                  'Thermometer',    'Heating, ventilation, and air conditioning specialists',            21, (SELECT id FROM groups WHERE slug='mechanical-systems')),
  ('Electrical',                        'electrical',            'Zap',            'Licensed electricians for all residential and commercial work',     22, (SELECT id FROM groups WHERE slug='mechanical-systems')),
  ('Solar',                             'solar',                 'Sun',            'Solar panel installation and battery storage',                      23, (SELECT id FROM groups WHERE slug='mechanical-systems')),
  ('Generator Installation',            'generator',             'Cpu',            'Whole-home generator installation and service',                     24, (SELECT id FROM groups WHERE slug='mechanical-systems')),
  ('Water Treatment & Softeners',       'water-treatment',       'Droplets',       'Water softener and treatment system installation and service',      25, (SELECT id FROM groups WHERE slug='mechanical-systems')),
  ('Gas Lines',                         'gas-lines',             'Flame',          'Natural gas and propane line installation and repair',              26, (SELECT id FROM groups WHERE slug='mechanical-systems')),

  -- Interior & Remodel
  ('Painting (Interior)',               'painting-interior',     'Paintbrush',     'Interior painting, wallpaper, and finishing',                       30, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Flooring',                          'flooring',              'Grid',           'Hardwood, tile, LVP, and carpet installation',                      31, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Drywall',                           'drywall',               'Square',         'Drywall installation, repair, and finishing',                       32, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Insulation',                        'insulation',            'Layers',         'Attic, wall, and spray foam insulation',                            33, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Carpentry & Trim',                  'carpentry-trim',        'Ruler',          'Crown molding, baseboards, trim, and custom carpentry',             34, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Cabinetry & Countertops',           'cabinetry-countertops', 'Box',            'Custom cabinetry, built-ins, and countertop installation',          35, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Tile & Stone',                      'tile-stone',            'Layers',         'Tile, stone, and countertop installation',                          36, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Kitchen Remodel',                   'kitchen-remodel',       'Utensils',       'Full kitchen renovation and remodeling',                            37, (SELECT id FROM groups WHERE slug='interior-remodel')),
  ('Bathroom Remodel',                  'bathroom-remodel',      'Droplets',       'Full bathroom renovation and remodeling',                           38, (SELECT id FROM groups WHERE slug='interior-remodel')),

  -- Outdoor & Landscape
  ('Landscaping',                       'landscaping',           'Trees',          'Full landscaping design, hardscape, and new installs',              40, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Lawn Care',                         'lawn-care',             'Leaf',           'Mowing, edging, and routine lawn maintenance',                      41, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Irrigation',                        'irrigation',            'Droplets',       'Sprinkler system installation and repair',                          42, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Tree Service',                      'tree-service',          'TreePine',       'Tree trimming, removal, and stump grinding',                        43, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Pool & Spa',                        'pool-spa',              'Waves',          'Pool construction, maintenance, and repair',                        44, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Outdoor Lighting',                  'outdoor-lighting',      'Lightbulb',      'Landscape and outdoor lighting installation',                       45, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Fencing',                           'fencing',               'Shield',         'Wood, vinyl, aluminum, and chain-link fencing',                     46, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Decks & Patios',                    'decks-patios',          'Sun',            'Deck building, patio construction, and repair',                     47, (SELECT id FROM groups WHERE slug='outdoor-landscape')),
  ('Outdoor Kitchen',                   'outdoor-kitchen',       'Flame',          'Outdoor kitchen and BBQ installations',                             48, (SELECT id FROM groups WHERE slug='outdoor-landscape')),

  -- Coastal & Marine
  ('Dock & Boathouse',                  'dock-boathouse',        'Anchor',         'Dock building, repair, and marine construction',                    50, (SELECT id FROM groups WHERE slug='coastal-marine')),
  ('Seawall & Bulkhead',                'seawall-bulkhead',      'Waves',          'Seawall and bulkhead installation, repair, and inspection',         51, (SELECT id FROM groups WHERE slug='coastal-marine')),
  ('Hurricane Shutters & Impact Windows','hurricane-shutters',   'ShieldAlert',    'Hurricane shutter and impact window installation',                  52, (SELECT id FROM groups WHERE slug='coastal-marine')),
  ('Flood Mitigation',                  'flood-mitigation',      'ArrowDownToLine','Flood barrier, sump pump, and mitigation systems',                  53, (SELECT id FROM groups WHERE slug='coastal-marine')),

  -- Property Services
  ('Property Management',               'property-management',   'Building2',      'Full-service residential property management',                      60, (SELECT id FROM groups WHERE slug='property-services')),
  ('Home Watch',                        'home-watch',            'Eye',            'Vacancy property checks and home watch services',                   61, (SELECT id FROM groups WHERE slug='property-services')),
  ('Pest Control',                      'pest-control',          'Bug',            'Termite, pest, and wildlife control',                               62, (SELECT id FROM groups WHERE slug='property-services')),
  ('Security Systems',                  'security-systems',      'Lock',           'Alarm systems, cameras, and smart home security',                   63, (SELECT id FROM groups WHERE slug='property-services')),
  ('Locksmith',                         'locksmith',             'Key',            'Lock installation, rekeying, and emergency lockout service',        64, (SELECT id FROM groups WHERE slug='property-services')),
  ('Handyman',                          'handyman',              'Wrench',         'General repairs, installs, and honey-do lists',                     65, (SELECT id FROM groups WHERE slug='property-services')),
  ('Junk Removal',                      'junk-removal',          'Trash2',         'Residential and commercial junk and debris removal',                66, (SELECT id FROM groups WHERE slug='property-services')),
  ('House Cleaning',                    'house-cleaning',        'Sparkles',       'Residential and vacation rental cleaning services',                 67, (SELECT id FROM groups WHERE slug='property-services')),

  -- Vacation Rentals
  ('Rental Management',                 'rental-management',     'ClipboardCheck', 'Short-term rental property management services',                    70, (SELECT id FROM groups WHERE slug='vacation-rentals')),
  ('Turnover Cleaning',                 'turnover-cleaning',     'Sparkles',       'Guest turnover and vacation rental cleaning',                       71, (SELECT id FROM groups WHERE slug='vacation-rentals')),
  ('Linen Service',                     'linen-service',         'Package',        'Vacation rental linen supply and laundry service',                  72, (SELECT id FROM groups WHERE slug='vacation-rentals')),
  ('Rental Photography & Virtual Tours','rental-photography',    'Camera',         'Professional photography and virtual tours for rentals',            73, (SELECT id FROM groups WHERE slug='vacation-rentals')),
  ('Staging for Rentals',               'staging-rentals',       'Home',           'Furniture and décor staging for rental properties',                 74, (SELECT id FROM groups WHERE slug='vacation-rentals')),

  -- Automotive
  ('Auto Repair',                       'auto-repair',           'Wrench',         'General auto repair and maintenance',                               80, (SELECT id FROM groups WHERE slug='automotive')),
  ('Auto Body & Paint',                 'auto-body-paint',       'Paintbrush',     'Collision repair, dent removal, and auto painting',                 81, (SELECT id FROM groups WHERE slug='automotive')),
  ('Oil Change',                        'oil-change',            'Droplets',       'Oil change and basic vehicle maintenance',                          82, (SELECT id FROM groups WHERE slug='automotive')),
  ('Tire Shop',                         'tire-shop',             'Circle',         'Tire sales, installation, and rotation',                            83, (SELECT id FROM groups WHERE slug='automotive')),
  ('Car Detailing',                     'car-detailing',         'Car',            'Interior and exterior car detailing',                               84, (SELECT id FROM groups WHERE slug='automotive')),
  ('Towing',                            'towing',                'Truck',          'Vehicle towing and roadside assistance',                            85, (SELECT id FROM groups WHERE slug='automotive')),
  ('Golf Cart Repair',                  'golf-cart-repair',      'Cpu',            'Golf cart repair, maintenance, and upgrades',                       86, (SELECT id FROM groups WHERE slug='automotive')),

  -- Health & Wellness
  ('Chiropractor',                      'chiropractor',          'Activity',       'Chiropractic care and spinal adjustment',                           90, (SELECT id FROM groups WHERE slug='health-wellness')),
  ('Massage Therapy',                   'massage-therapy',       'Heart',          'Therapeutic and relaxation massage services',                       91, (SELECT id FROM groups WHERE slug='health-wellness')),
  ('Physical Therapy',                  'physical-therapy',      'Activity',       'Physical rehabilitation and therapy',                               92, (SELECT id FROM groups WHERE slug='health-wellness')),
  ('Dentist',                           'dentist',               'Heart',          'General and cosmetic dental services',                              93, (SELECT id FROM groups WHERE slug='health-wellness')),
  ('Med Spa',                           'med-spa',               'Sparkles',       'Medical spa, aesthetics, and wellness treatments',                  94, (SELECT id FROM groups WHERE slug='health-wellness')),
  ('Personal Training',                 'personal-training',     'Activity',       'One-on-one fitness coaching and personal training',                 95, (SELECT id FROM groups WHERE slug='health-wellness')),

  -- Professional Services
  ('Real Estate Agent',                 'real-estate-agent',     'Home',           'Residential and commercial real estate agents',                    100, (SELECT id FROM groups WHERE slug='professional-services')),
  ('Insurance Agent',                   'insurance-agent',       'Shield',         'Home, auto, and business insurance',                               101, (SELECT id FROM groups WHERE slug='professional-services')),
  ('Financial Advisor',                 'financial-advisor',     'TrendingUp',     'Wealth management and financial planning',                         102, (SELECT id FROM groups WHERE slug='professional-services')),
  ('Attorney',                          'attorney',              'Briefcase',      'Real estate, estate planning, and general legal services',         103, (SELECT id FROM groups WHERE slug='professional-services')),
  ('CPA & Tax',                         'cpa-tax',               'Briefcase',      'Tax preparation, accounting, and CPA services',                   104, (SELECT id FROM groups WHERE slug='professional-services'))

ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order,
  group_id    = EXCLUDED.group_id;

-- Step 5: Remove old slugs no longer in the taxonomy, only when not referenced by any contractor
DELETE FROM public.categories
WHERE slug IN (
  'general-contractor', 'concrete-masonry', 'moving', 'other',
  'painting', 'cabinetry-millwork', 'cleaning',
  'landscaping-design', 'deck-porch', 'dock-marine', 'seawall',
  'blinds-window-treatments', 'screen-enclosures', 'garage-doors',
  'septic', 'home-inspection'
)
AND id NOT IN (
  SELECT DISTINCT category_id FROM public.contractors WHERE category_id IS NOT NULL
)
AND id NOT IN (
  SELECT DISTINCT unnest(additional_categories)
  FROM public.contractors
  WHERE cardinality(additional_categories) > 0
);
