import { safeVideoPlay } from "@/lib/safe-media-play";

const videos = new Set<HTMLVideoElement>();

/** Register a native `<video>` for site-wide mute sync. Returns cleanup. */
export function registerSiteVideo(el: HTMLVideoElement): () => void {
  videos.add(el);
  return () => {
    videos.delete(el);
  };
}

export function syncAllSiteVideosMuted(muted: boolean): void {
  for (const v of videos) {
    try {
      v.muted = muted;
    } catch {
      /* noop */
    }
  }
}

/** Best-effort play on all registered videos (e.g. after gesture). */
export function tryPlayAllSiteVideos(): void {
  for (const v of videos) {
    safeVideoPlay(v);
  }
}
