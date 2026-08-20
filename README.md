# SOURCEsculptures

Works by Rey Jaffet & Sean Behm. Vite + React + TypeScript + Tailwind (shadcn/ui),
Supabase backend, deployed on Vercel.

## Deployed routes

| Route | Built from | Purpose |
|---|---|---|
| `/` | `src/` | Main portfolio site (homepage) |
| `/landing-site/` | `scripts/build-vercel.mjs` | Archived "Coming Soon" splash, `noindex`. Kept for maintenance windows. |
| `/sphere` | `sphere/index.html` | Bhutan sphere pattern bench. Unlisted (`noindex`, not linked from the site). |
| `/SITE/*`, `/SITE2/*` | — | 301 → `/` (legacy paths, links preserved) |

## Commands

```bash
npm run dev          # main app, http://localhost:8080/
npm run build        # full Vercel output: / + /landing-site/ + /sphere
npm run build:main   # main app only → dist/
npm run lint
npm test
```

## Environment

`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
must be set in Vercel Project Settings → Environment Variables (all environments).
Locally, put them in an untracked `.env`.

## Putting the splash back up

To point the domain at the maintenance splash, change the last rewrite in
`vercel.json` from `/index.html` to `/landing-site/index.html` and redeploy.

## Video sources

`src/lib/projectMedia.ts` resolves three per-video source types, selectable in
the admin UI on preview, main, and videos 2–3:

| Source | Field | Renders as |
|---|---|---|
| `youtube` | video ID or any YouTube URL | `youtube-nocookie` iframe |
| `file` | uploaded file URL | native `<video>` |
| `url` | external/CDN URL | native `<video>` |

Moving a video to a CDN (Bunny.net or similar) is a content change, not a code
change: set the source to External URL and paste the direct-play URL.

**Format note:** the native `<video>` element has no HLS support. `.m3u8`
playlists play in Safari only — Chrome and Firefox need `hls.js` (~40 kB) added.
Direct-play `.mp4` works everywhere with no new dependency.

## History

`SITE2/` was a parallel copy of `src/` created to prototype native/CDN video.
It was removed once the work turned out to be unnecessary — the three source
types above already cover it, and the copy had never diverged from `src/`.
Recoverable from git history if ever needed.

## Database migrations

`supabase/migrations/` is the source of truth for schema and RLS policy history.

Migrations authored in Lovable are applied to the linked Supabase project by
Lovable at author time, so a migration file landing in this repo usually
documents a change that is *already live* on the database. Verify against the
Supabase dashboard before assuming a migration still needs to run.

Three security migrations were imported from the Lovable project on 2026-08-18:

| Migration | Effect |
|---|---|
| `20260717013859` | Pins `search_path` on `SECURITY DEFINER` functions; revokes `EXECUTE` on email-queue functions from `anon`/`authenticated` |
| `20260717015126` | Restricts `site_settings` public SELECT to a key whitelist; explicit read policy for the `project-media` bucket; locks down `has_role` |
| `20260818202000` | Splits `projects` SELECT: `anon` sees `status = 'live'` only, `authenticated` sees live-or-admin |
