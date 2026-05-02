export type ChromelessEmbedOptions = {
  /** Default true — keep muted until the user unmutes via the site control (required for autoplay). */
  muted?: boolean;
};

/** Chromeless-style embed — controls hidden; loop requires playlist=id */
export function chromelessYoutubeEmbedUrl(
  videoId: string,
  options?: ChromelessEmbedOptions,
): string {
  const muted = options?.muted ?? true;
  const q = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    controls: "0",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    loop: "1",
    playlist: videoId,
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    /** Reduces extra chrome / keyboard shortcuts surfacing as UI hints */
    cc_load_policy: "0",
    /** Limits JS API surface (helps avoid interactive overlays on some clients) */
    enablejsapi: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}

export function youtubePosterUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}
