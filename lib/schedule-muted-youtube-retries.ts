import type { YouTubePlayer } from "react-youtube";

import { kickstartMutedYoutubePlayback } from "@/lib/safe-media-play";

const DEFAULT_DELAYS_MS = [0, 100, 350, 900, 2200];

/** Browsers often defer muted autoplay until the embed is unobstructed / fully wired. */
export function scheduleMutedYoutubeRetries(
  player: YouTubePlayer,
  delaysMs: readonly number[] = DEFAULT_DELAYS_MS,
): void {
  for (const ms of delaysMs) {
    window.setTimeout(() => kickstartMutedYoutubePlayback(player), ms);
  }
}
