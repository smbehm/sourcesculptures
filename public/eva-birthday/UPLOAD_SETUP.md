# Shared image upload setup

The team landing page now has a drag-and-drop / file-picker uploader and a shared collection browser. Uploads use a separate private Supabase bucket. The existing public project-media bucket is unchanged.

Before shared uploads work on the live Vercel site:
1. Apply supabase/migrations/20261006090000_eva_team_images.sql to the existing Supabase project. This creates a private bucket limited to JPG/PNG/WebP, 20 MB per file, with no public read/write policies.
2. In Vercel server environment variables configure SUPABASE_URL (or existing VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY and EVA_TEAM_UPLOAD_KEY. Use a strong random team key. The service role key must remain server-only: never give it a VITE_ prefix or put it in public files.
3. Deploy the API file api/eva-images.mjs and updated public/eva-birthday files together. The endpoint is /api/eva-images; confirm Vercel serves it as a function and not the SPA fallback.
4. Share only the team access key with the team. Test two browsers: connect, upload an image, refresh in the second browser and confirm it appears. Test a wrong key, invalid file and oversized image.

The browser sends image bytes directly to a short-lived signed Supabase upload URL; they do not go through Vercel’s small request-body limit. Reads use one-hour signed URLs. Refresh the collection to renew them. The team key stays in page memory and is cleared on reload. Only explicitly selected or dropped files are uploaded. Filename/category are stored; dates, names of depicted people and source information should be included in the filename until richer metadata is added. Original images retain their embedded metadata, so review photos before sharing them.

Local file previews cannot call the server endpoint. The UI reports this or missing hosting configuration instead of claiming an upload succeeded. No migration, server secret configuration or deployment was performed as part of the local implementation.
