BEGIN;

-- Add Photography as a general category under Design & Architecture.
-- Distinct from rental-photography (Vacation Rentals) which is rental-specific.

INSERT INTO public.categories (name, slug, icon, description, sort_order, group_id)
VALUES (
  'Photography',
  'photography',
  'Camera',
  'Professional photography for real estate, events, portraits, and more',
  403,
  (SELECT id FROM public.category_groups WHERE slug = 'design-architecture')
)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  icon        = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order  = EXCLUDED.sort_order,
  group_id    = EXCLUDED.group_id;

UPDATE public.categories
SET category_group = cg.name
FROM public.category_groups cg
WHERE public.categories.slug = 'photography'
  AND public.categories.group_id = cg.id;

COMMIT;
