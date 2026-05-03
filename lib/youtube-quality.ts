import type { YouTubePlayer } from "react-youtube";

import type { VideoQualityTier } from "@/lib/playback-types";

type YtQuality = string;

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
    getPlayerState?: () => number;
  };
}

export function applyPreferredQuality(
  player: YouTubePlayer,
  tier: VideoQualityTier
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
    /* noop — iframe may be tearing down */
  }
}

/**
 * YouTube often ignores quality requests until a few seconds after playback
 * starts. Retry at increasing intervals. The 0ms call is speculative (fires
 * before playback), remaining calls fire after PLAYING state is confirmed.
 */
export function reinforcePreferredQuality(
  player: YouTubePlayer,
  tier: VideoQualityTier
): void {
  const delays = [0, 250, 800, 2000, 4000];
  for (const ms of delays) {
    window.setTimeout(() => {
      try {
        applyPreferredQuality(player, tier);
      } catch {
        /* noop */
      }
    }, ms);
  }
}
