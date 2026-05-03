ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS homepage_subtitle text;

UPDATE public.projects
SET homepage_subtitle = COALESCE(
  NULLIF(concat_ws(' · ', NULLIF(year::text, ''), categories[1]), ''),
  homepage_subtitle
)
WHERE homepage_subtitle IS NULL;