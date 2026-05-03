import { getYoutubeEmbedOrigin } from "@/lib/embed-origin";

/** YouTube IFrame `playerVars` — chromeless; origin must match the embedding page for the JS API. */
export function buildYoutubePlayerVars(options: {
  /** Start muted for autoplay compliance; unmute via IFrame API after user gesture. */
  startMuted: boolean;
  /**
   * Parent document origin — use `window.location.origin` after mount.
   * If this does not match the real page, mute/quality API calls fail silently.
   */
  origin?: string;
}): Record<string, string | number> {
  const origin = options.origin?.trim() || getYoutubeEmbedOrigin();
  const v: Record<string, string | number> = {
    enablejsapi: 1,
    autoplay: 1,
    mute: options.startMuted ? 1 : 0,
    controls: 0,
    modestbranding: 1,
    rel: 0,
    playsinline: 1,
    fs: 0,
    disablekb: 1,
    iv_load_policy: 3,
    cc_load_policy: 0,
    /** Deprecated but still suppresses some metadata chrome in several embed builds */
    showinfo: 0,
    /* Quality is applied via IFrame API (`youtube-quality.ts`). Omit legacy `vq` — it can break embeds. */
  };
  if (origin) {
    v.origin = origin;
  }
  return v;
}
