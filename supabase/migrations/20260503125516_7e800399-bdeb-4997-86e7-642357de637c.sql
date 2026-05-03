
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS preview_media_type text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS main_media_type text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS preview_video_source text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS main_video_source text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS video_2_source text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS video_3_source text NOT NULL DEFAULT 'youtube',
  ADD COLUMN IF NOT EXISTS preview_video_file text,
  ADD COLUMN IF NOT EXISTS main_video_file text,
  ADD COLUMN IF NOT EXISTS video_2_file text,
  ADD COLUMN IF NOT EXISTS video_3_file text,
  ADD COLUMN IF NOT EXISTS credits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS gallery_items jsonb NOT NULL DEFAULT '[]'::jsonb;
