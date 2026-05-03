/**
 * Deploy badge label — **fully automatic** on Vercel (no manual bump).
 * Baked in at `next build`, so desktop and phone show the same string after deploy.
 *
 * - Commit SHA changes when you push new code.
 * - Deployment suffix changes on every Vercel deploy (including redeploys of the same commit).
 *
 * Optional override: set `NEXT_PUBLIC_DEPLOY_VERSION` in Vercel project env.
 */
export function getDeployVersionLabel(): string {
  const explicit = process.env.NEXT_PUBLIC_DEPLOY_VERSION?.trim();
  if (explicit) return explicit;
  const buildStamp = process.env.NEXT_PUBLIC_BUILD_STAMP?.trim();
  const stampShort = buildStamp ? buildStamp.slice(0, 16).replace("T", " ") : null;

  const rawSha =
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.trim() ??
    process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  const sha = rawSha && rawSha.length >= 7 ? rawSha.slice(0, 7) : null;

  const rawDpl = process.env.VERCEL_DEPLOYMENT_ID?.trim();
  const dplShort =
    rawDpl && rawDpl.length >= 4
      ? rawDpl.replace(/^dpl_/, "").slice(-6)
      : null;

  if (sha && dplShort && stampShort) return `${sha} · ${dplShort} · ${stampShort}`;
  if (sha && dplShort) return `${sha} · ${dplShort}`;
  if (sha && stampShort) return `${sha} · ${stampShort}`;
  if (dplShort && stampShort) return `${dplShort} · ${stampShort}`;
  if (sha) return sha;
  if (dplShort) return dplShort;
  if (stampShort) return stampShort;

  return "local";
}
