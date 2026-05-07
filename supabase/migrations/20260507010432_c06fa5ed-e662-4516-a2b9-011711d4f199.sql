-- Create public storage bucket for project images
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-media', 'project-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Project media is publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

-- Admins can upload
CREATE POLICY "Admins can upload project media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));

-- Admins can update
CREATE POLICY "Admins can update project media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));

-- Admins can delete
CREATE POLICY "Admins can delete project media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-media' AND public.has_role(auth.uid(), 'admin'));