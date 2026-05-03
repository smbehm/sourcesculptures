import type { YouTubePlayer } from "react-youtube";

/** Ensures `allow="autoplay"` — needed on some mobile browsers; react-youtube does not set it. */
export function patchYtIframeAllow(player: YouTubePlayer): void {
  try {
    const iframe = (
      player as unknown as { getIframe?: () => HTMLIFrameElement | null }
    ).getIframe?.();
    if (!iframe) return;
    const cur = iframe.allow?.trim() ?? "";
    if (!cur.includes("autoplay")) {
      iframe.allow = cur ? `${cur}; autoplay` : "autoplay";
    }
  } catch {
    /* noop */
  }
}
