/**
 * Loads `https://www.youtube.com/iframe_api` once and resolves when `YT.Player` exists.
 * Chains `window.onYouTubeIframeAPIReady` with any existing handler (e.g. react-youtube).
 */
export function ensureYoutubeIframeApiLoaded(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  const w = window as Window & {
    YT?: { Player?: unknown };
    onYouTubeIframeAPIReady?: () => void;
  };

  if (w.YT?.Player) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;
    let poll: number | undefined;

    const finish = () => {
      if (settled) return;
      if (w.YT?.Player) {
        settled = true;
        if (poll !== undefined) window.clearInterval(poll);
        resolve();
      }
    };

    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      finish();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.onerror = () => {
        if (!settled) {
          settled = true;
          if (poll !== undefined) window.clearInterval(poll);
          reject(new Error("Failed to load YouTube IFrame API"));
        }
      };
      document.head.appendChild(tag);
    }

    poll = window.setInterval(finish, 32);

    window.setTimeout(() => {
      if (poll !== undefined) window.clearInterval(poll);
      if (!settled) {
        settled = true;
        reject(new Error("YouTube IFrame API did not become ready in time"));
      }
    }, 20_000);
  });
}
