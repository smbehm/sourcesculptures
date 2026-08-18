DROP POLICY IF EXISTS "public reads live projects" ON public.projects;

CREATE POLICY "anon reads live projects"
ON public.projects FOR SELECT TO anon
USING (status = 'live');

CREATE POLICY "authenticated reads live or admin"
ON public.projects FOR SELECT TO authenticated
USING (status = 'live' OR public.has_role(auth.uid(), 'admin'::app_role));