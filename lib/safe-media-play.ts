/**
 * HTMLVideoElement.play() returns a Promise; always attach .catch() for autoplay rejections.
 * YouTube IFrame API playVideo() is usually sync but may be wrapped; handle both.
 */
export function safeVideoPlay(video: HTMLVideoElement): void {
  try {
    const r = video.play();
    if (r !== undefined && typeof (r as Promise<void>).catch === "function") {
      (r as Promise<void>).catch(() => {
        /* autoplay policy or removed element */
      });
    }
  } catch {
    /* sync throw from play() */
  }
}

type MinimalYtPlayer = { playVideo?: () => unknown };

export function safeYoutubePlayVideo(player: MinimalYtPlayer): void {
  try {
    const ret = player.playVideo?.();
    if (
      ret != null &&
      typeof ret === "object" &&
      "catch" in ret &&
      typeof (ret as Promise<void>).catch === "function"
    ) {
      (ret as Promise<void>).catch(() => {});
    }
  } catch {
    /* noop */
  }
}
