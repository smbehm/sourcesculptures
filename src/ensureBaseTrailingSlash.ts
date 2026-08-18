/**
 * ensureBaseTrailingSlash — sub-path mount guard
 *
 * A Vite app built with a non-root base (e.g. `/preview/`) requires a trailing
 * slash on the mount path. Without it, React Router's basename does not match
 * and the homepage never mounts (preloader shows, then a blank screen).
 *
 * The main app now builds at base "/", so this is a no-op there — the early
 * return below handles it. Kept in place so the same source tree can still be
 * built to a sub-path without regressing.
 */
export function ensureBaseTrailingSlash(): void {
  const base = import.meta.env.BASE_URL;
  if (!base || base === "/") return;

  const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
  const { pathname, search, hash } = window.location;

  if (pathname === normalized) {
    window.location.replace(`${base}${search}${hash}`);
  }
}
