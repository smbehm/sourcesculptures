
-- Fix 1: Restrict site_settings public SELECT to a whitelist of non-sensitive keys
DROP POLICY IF EXISTS "public reads site_settings" ON public.site_settings;
CREATE POLICY "public reads non-sensitive site_settings"
ON public.site_settings
FOR SELECT
USING (key IN ('hero_title','hero_subtitle','about_text','contact_email','social_links','footer_text'));

-- Fix 2: Explicit SELECT policy for project-media bucket (public read of that bucket only)
CREATE POLICY "Public can read project media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'project-media');

-- Fix 3: Revoke EXECUTE on has_role from authenticated/anon/public; keep for service_role and definer usage via RLS
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
