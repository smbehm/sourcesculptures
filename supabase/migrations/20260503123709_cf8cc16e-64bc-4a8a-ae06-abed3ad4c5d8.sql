
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin role to FIRST signup only
CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

-- Projects table mirroring Amber CMS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'live', -- live | draft
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brief_description TEXT,
  overview TEXT,
  client TEXT,
  year INTEGER,
  categories TEXT[] NOT NULL DEFAULT '{}',
  -- Credits (6 pairs)
  credit_title_1 TEXT, credit_name_1 TEXT,
  credit_title_2 TEXT, credit_name_2 TEXT,
  credit_title_3 TEXT, credit_name_3 TEXT,
  credit_title_4 TEXT, credit_name_4 TEXT,
  credit_title_5 TEXT, credit_name_5 TEXT,
  credit_title_6 TEXT, credit_name_6 TEXT,
  -- Preview (used on listing/hero loop)
  preview_image_url TEXT,
  preview_video_youtube_id TEXT,
  preview_video_url TEXT,
  -- Main video on detail page
  main_image_url TEXT,
  main_video_youtube_id TEXT,
  main_video_url TEXT,
  show_main_video_controls BOOLEAN NOT NULL DEFAULT false,
  -- Extra videos
  show_video_2 BOOLEAN NOT NULL DEFAULT false,
  video_2_youtube_id TEXT,
  video_2_url TEXT,
  show_video_2_controls BOOLEAN NOT NULL DEFAULT false,
  show_video_3 BOOLEAN NOT NULL DEFAULT false,
  video_3_youtube_id TEXT,
  video_3_url TEXT,
  show_video_3_controls BOOLEAN NOT NULL DEFAULT false,
  -- Gallery image URLs
  gallery TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public reads live projects" ON public.projects FOR SELECT USING (status = 'live' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update projects" ON public.projects FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete projects" ON public.projects FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER projects_set_updated_at BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Site settings (key-value store) for additional no-code edits
CREATE TABLE public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins write site_settings" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed existing 5 projects
INSERT INTO public.projects (sort_order, featured, status, title, slug, brief_description, overview, categories, preview_video_youtube_id, main_video_youtube_id) VALUES
(1, true, 'live', 'Source Spirits — No Art', 'source-spirits', 'Brand Film', 'A cinematic introduction to Source Spirits. A study in restraint — bottle, light, and movement composed as a single sculpted gesture.', ARRAY['Brand Film'], 'aoD2vFN5wFw', 'aoD2vFN5wFw'),
(2, true, 'live', 'The Veil', 'the-veil', 'Short Film', 'An editorial study in light, fabric and silence. Slow, deliberate frames that let texture and breath carry the narrative.', ARRAY['Short Film'], 'lDyARVNEOAc', 'lDyARVNEOAc'),
(3, true, 'live', 'Infirna', 'infirna', 'Brand Film', 'A meditation on form — sculpted in motion. Crafted to feel both intimate and monumental, with a focus on material and atmosphere.', ARRAY['Brand Film'], 'XQzXnpOq_uY', 'XQzXnpOq_uY'),
(4, true, 'live', 'Together', 'together', 'Editorial', 'Intimate frames from a day shared. A documentary-led approach that holds onto the small, unrepeatable moments between people.', ARRAY['Editorial'], 'hEqjP3YHiCc', 'hEqjP3YHiCc'),
(5, true, 'live', 'Isabelle', 'isabelle', 'Portrait', 'A portrait film built around presence and quiet attention. Composed with a single subject, natural light, and unhurried pacing.', ARRAY['Portrait'], 'OjU5UZ2_MfM', 'OjU5UZ2_MfM');
