import type { YouTubePlayer } from "react-youtube";

import type { VideoQualityTier } from "@/lib/playback-types";

type YtQuality = string;

/** Prefer 4K-capable labels first; YouTube omits levels the upload does not offer. */
const ORDER_4K: readonly YtQuality[] = [
  "hd2160",
  "hd1440",
  "highres",
  "hd1080",
  "hd720",
  "large",
  "medium",
  "small",
];

const ORDER_HD: readonly YtQuality[] = [
  "hd1080",
  "hd720",
  "large",
  "medium",
  "small",
];

function getPlayer(player: YouTubePlayer) {
  return player as unknown as {
    getAvailableQualityLevels?: () => YtQuality[];
    setPlaybackQuality?: (q: YtQuality) => void;
    getPlaybackQuality?: () => YtQuality;
  };
}

/**
 * Picks the best available level matching the user’s HD vs 4K preference.
 * Mobile embeds often ignore or restrict this; desktop generally honors it when the video supports it.
 */
export function applyPreferredQuality(
  player: YouTubePlayer,
  tier: VideoQualityTier,
): void {
  const p = getPlayer(player);
  const order = tier === "hd2160" ? ORDER_4K : ORDER_HD;
  try {
    const available = p.getAvailableQualityLevels?.() ?? [];
    if (!available.length) {
      p.setPlaybackQuality?.(order[0] ?? "hd1080");
      return;
    }
    for (const q of order) {
      if (available.includes(q)) {
        p.setPlaybackQuality?.(q);
        return;
      }
    }
    p.setPlaybackQuality?.(available[0]);
  } catch {
    /* API may throw while the iframe is tearing down */
  }
}

/** YouTube frequently accepts quality only after playback has started — retry a few times. */
export function reinforcePreferredQuality(
  player: YouTubePlayer,
  tier: VideoQualityTier,
): void {
  const delays = [0, 120, 400, 1200];
  for (const ms of delays) {
    window.setTimeout(() => applyPreferredQuality(player, tier), ms);
  }
}
