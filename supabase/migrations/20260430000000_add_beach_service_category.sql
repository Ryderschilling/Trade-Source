BEGIN;

INSERT INTO public.categories (name, slug, icon, description, sort_order, group_id)
VALUES (
  'Beach Service',
  'beach-service',
  'Umbrella',
  'Beach setup, umbrella and chair rentals, and coastal event services',
  54,
  (SELECT id FROM public.category_groups WHERE slug = 'coastal-marine')
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
WHERE public.categories.slug = 'beach-service'
  AND public.categories.group_id = cg.id;

COMMIT;
