-- ============================================================
-- Migration 006: Category Groups + Quote Requests + Notifications
-- ============================================================

-- 1a. Category Groups
CREATE TABLE IF NOT EXISTS public.category_groups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  icon        text NOT NULL,
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.category_groups FOR SELECT USING (true);

-- 1b. Add group_id to categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.category_groups(id);
CREATE INDEX IF NOT EXISTS categories_group_id_idx ON public.categories(group_id);

-- 1c. Seed category_groups
INSERT INTO public.category_groups (name, slug, icon, description, sort_order) VALUES
  ('Outdoors & Yard',       'outdoors-yard',      'Leaf',      'Lawn, landscaping, pools, outdoor living',          1),
  ('Interior',              'interior',            'Home',      'Flooring, painting, cabinets, tile, and more',      2),
  ('Exterior',              'exterior',            'Building2', 'Roofing, windows, siding, gutters, pressure wash',  3),
  ('Systems & Mechanical',  'systems-mechanical',  'Zap',       'HVAC, electrical, plumbing, solar, generators',     4),
  ('Construction',          'construction',        'HardHat',   'General contractors, concrete, home inspection',    5),
  ('Waterfront',            'waterfront',          'Waves',     'Docks, seawalls, and coastal property work',        6),
  ('Home Services',         'home-services',       'Sparkles',  'Cleaning, pest control, handyman',                  7)
ON CONFLICT (slug) DO NOTHING;

-- 1d. Upsert categories with group assignments
WITH groups AS (
  SELECT id, slug FROM public.category_groups
)
INSERT INTO public.categories (name, slug, icon, description, sort_order, group_id) VALUES
  -- Outdoors & Yard
  ('Lawn Care',             'lawn-care',            'Leaf',        'Mowing, edging, and routine lawn maintenance',            10,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Landscaping & Design',  'landscaping-design',   'Trees',       'Full landscaping design, hardscape, and new installs',    11,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Tree Service',          'tree-service',         'TreePine',    'Tree trimming, removal, and stump grinding',              12,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Irrigation',            'irrigation',           'Droplets',    'Sprinkler system installation and repair',                13,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Fencing',               'fencing',              'Shield',      'Wood, vinyl, aluminum, and chain-link fencing',           14,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Pool & Spa',            'pool-spa',             'Waves',       'Pool construction, maintenance, and repair',              15,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Deck & Porch',          'deck-porch',           'Sun',         'Deck building, porch construction, and repair',           16,  (SELECT id FROM groups WHERE slug='outdoors-yard')),
  ('Outdoor Kitchen',       'outdoor-kitchen',      'Flame',       'Outdoor kitchen and BBQ installations',                   17,  (SELECT id FROM groups WHERE slug='outdoors-yard')),

  -- Interior
  ('Flooring',              'flooring',             'Grid',        'Hardwood, tile, LVP, and carpet installation',            20,  (SELECT id FROM groups WHERE slug='interior')),
  ('Painting',              'painting',             'Paintbrush',  'Interior and exterior painting professionals',             21,  (SELECT id FROM groups WHERE slug='interior')),
  ('Cabinetry & Millwork',  'cabinetry-millwork',   'Box',         'Custom cabinetry, built-ins, and fine millwork',          22,  (SELECT id FROM groups WHERE slug='interior')),
  ('Drywall',               'drywall',              'Square',      'Drywall installation, repair, and finishing',              23,  (SELECT id FROM groups WHERE slug='interior')),
  ('Tile & Stone',          'tile-stone',           'Layers',      'Tile, stone, and countertop installation',                24,  (SELECT id FROM groups WHERE slug='interior')),
  ('Blinds & Window Treatments', 'blinds-window-treatments', 'PanelLeft', 'Blinds, shades, shutters, and drapes',             25,  (SELECT id FROM groups WHERE slug='interior')),

  -- Exterior
  ('Roofing',               'roofing',              'Home',        'Roof installation, repair, and replacement',              30,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Windows & Doors',       'windows-doors',        'DoorOpen',    'Window and door installation, replacement, repair',       31,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Gutters',               'gutters',              'ArrowDown',   'Gutter installation, cleaning, and repair',               32,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Siding',                'siding',               'LayoutGrid',  'Siding installation and repair',                          33,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Pressure Washing',      'pressure-washing',     'Wind',        'Residential and commercial pressure washing',             34,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Screen Enclosures',     'screen-enclosures',    'Grid2x2',     'Pool cages, porches, and screen enclosure installation',  35,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Hurricane Shutters',    'hurricane-shutters',   'ShieldAlert', 'Hurricane shutter and impact window installation',        36,  (SELECT id FROM groups WHERE slug='exterior')),
  ('Garage Doors',          'garage-doors',         'SquareParking','Garage door installation, repair, and openers',          37,  (SELECT id FROM groups WHERE slug='exterior')),

  -- Systems & Mechanical
  ('HVAC',                  'hvac',                 'Thermometer', 'Heating, ventilation, and air conditioning',              40,  (SELECT id FROM groups WHERE slug='systems-mechanical')),
  ('Electrical',            'electrical',           'Zap',         'Licensed electricians for residential and commercial',    41,  (SELECT id FROM groups WHERE slug='systems-mechanical')),
  ('Plumbing',              'plumbing',             'Pipette',     'Plumbers for repairs, installs, and remodels',            42,  (SELECT id FROM groups WHERE slug='systems-mechanical')),
  ('Solar',                 'solar',                'Sun',         'Solar panel installation and battery storage',             43,  (SELECT id FROM groups WHERE slug='systems-mechanical')),
  ('Generator',             'generator',            'Cpu',         'Whole-home generator installation and service',           44,  (SELECT id FROM groups WHERE slug='systems-mechanical')),
  ('Security Systems',      'security-systems',     'Lock',        'Alarm systems, cameras, and smart home security',        45,  (SELECT id FROM groups WHERE slug='systems-mechanical')),
  ('Septic',                'septic',               'ArrowDownToLine', 'Septic system installation, pumping, and repair',    46,  (SELECT id FROM groups WHERE slug='systems-mechanical')),

  -- Construction
  ('General Contractor',    'general-contractor',   'HardHat',     'Full-service residential and commercial GCs',             50,  (SELECT id FROM groups WHERE slug='construction')),
  ('Concrete & Masonry',    'concrete-masonry',     'Building2',   'Driveways, patios, foundations, and masonry',             51,  (SELECT id FROM groups WHERE slug='construction')),
  ('Home Inspection',       'home-inspection',      'ClipboardCheck','Pre-purchase and insurance home inspections',            52,  (SELECT id FROM groups WHERE slug='construction')),

  -- Waterfront
  ('Dock & Marine',         'dock-marine',          'Anchor',      'Dock building, repair, and marine construction',          60,  (SELECT id FROM groups WHERE slug='waterfront')),
  ('Seawall',               'seawall',              'Waves',       'Seawall installation, repair, and inspection',            61,  (SELECT id FROM groups WHERE slug='waterfront')),

  -- Home Services
  ('Cleaning',              'cleaning',             'Sparkles',    'Residential and commercial cleaning services',            70,  (SELECT id FROM groups WHERE slug='home-services')),
  ('Pest Control',          'pest-control',         'Bug',         'Termite, pest, and wildlife control',                     71,  (SELECT id FROM groups WHERE slug='home-services')),
  ('Handyman',              'handyman',             'Wrench',      'General repairs, installs, and honey-do lists',           72,  (SELECT id FROM groups WHERE slug='home-services'))

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  group_id = EXCLUDED.group_id;

-- Remove old slugs that no longer exist
DELETE FROM public.categories WHERE slug IN ('landscaping', 'moving', 'other');

-- 1e. Quote Requests
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     uuid REFERENCES public.category_groups(id),
  category_id  uuid REFERENCES public.categories(id),
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text,
  description  text NOT NULL,
  timeline     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert" ON public.quote_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin read" ON public.quote_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE TABLE IF NOT EXISTS public.quote_request_recipients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  contractor_id    uuid NOT NULL REFERENCES public.contractors(id) ON DELETE CASCADE,
  notified_at      timestamptz NOT NULL DEFAULT now(),
  viewed_at        timestamptz,
  UNIQUE(quote_request_id, contractor_id)
);

ALTER TABLE public.quote_request_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Contractor reads own" ON public.quote_request_recipients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.contractors WHERE id = contractor_id AND user_id = auth.uid())
);
CREATE POLICY "Admin read all" ON public.quote_request_recipients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Public insert" ON public.quote_request_recipients FOR INSERT WITH CHECK (true);

-- 1f. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL,
  title         text NOT NULL,
  body          text,
  link          text,
  read          boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(user_id, read);
