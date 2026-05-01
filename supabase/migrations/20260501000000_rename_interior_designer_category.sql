BEGIN;

UPDATE public.categories
SET name = 'Interior Design',
    slug = 'interior-design'
WHERE slug = 'interior-designer';

COMMIT;
