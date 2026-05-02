import { getYoutubeEmbedOrigin } from "@/lib/embed-origin";

/** YouTube IFrame `playerVars` — chromeless; origin required for API + mobile policies. */
export function buildYoutubePlayerVars(options: {
  /** Start muted for autoplay compliance; unmute via IFrame API after user gesture. */
  startMuted: boolean;
}): Record<string, string | number> {
  const origin = getYoutubeEmbedOrigin();
  const v: Record<string, string | number> = {
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
  };
  if (origin) {
    v.origin = origin;
  }
  return v;
}
