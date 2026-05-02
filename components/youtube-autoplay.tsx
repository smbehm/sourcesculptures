"use client";

import Image from "next/image";
import YouTube from "react-youtube";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSitePlayback } from "@/components/site-playback-provider";
import { buildYoutubePlayerVars } from "@/lib/youtube-player-vars";
import { useYoutubeEmbedReady } from "@/lib/use-youtube-embed-ready";

type YouTubeAutoplayProps = {
  videoId: string;
  title: string;
  className?: string;
  variant?: "inline" | "hero";
};

function youtubePosterSrc(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

export function YouTubeAutoplay({
  videoId,
  title,
  className = "",
  variant = "inline",
}: YouTubeAutoplayProps) {
  const { registerHeroPlayer, reinforcePlaybackQuality } = useSitePlayback();
  const { ready: embedReady, origin: embedOrigin } = useYoutubeEmbedReady();
  const rootRef = useRef<HTMLDivElement>(null);
  const isHero = variant === "hero";
  const [active, setActive] = useState(isHero);
  /** Hide YouTube thumbnail layer once the iframe is actually playing (avoids black flash). */
  const [showYtPoster, setShowYtPoster] = useState(true);

  const ytOpts = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: buildYoutubePlayerVars({
        startMuted: true,
        origin: embedOrigin,
      }),
    }),
    [embedOrigin],
  );

  useEffect(() => {
    setShowYtPoster(true);
  }, [videoId]);

  useEffect(() => {
    return () => {
      if (isHero) registerHeroPlayer(null);
    };
  }, [isHero, registerHeroPlayer]);

  useEffect(() => {
    if (isHero) return;

    const el = rootRef.current;
    if (!el) return;

    let io: IntersectionObserver | null = null;

    const attach = () => {
      io?.disconnect();
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      const minRatio = mobile ? 0.12 : 0.35;
      const thresholds = mobile
        ? [0, 0.08, 0.12, 0.18, 0.25, 0.35, 0.5]
        : [0, 0.35, 0.6];
      io = new IntersectionObserver(
        ([entry]) => {
          setActive(entry.isIntersecting && entry.intersectionRatio > minRatio);
        },
        {
          threshold: thresholds,
          rootMargin: mobile ? "12% 0px 12% 0px" : "0px",
        },
      );
      io.observe(el);
    };

    attach();
    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", attach);
    return () => {
      mq.removeEventListener("change", attach);
      io?.disconnect();
    };
  }, [isHero]);

  const poster = youtubePosterSrc(videoId);

  const handleHeroReady = (e: { target: import("react-youtube").YouTubePlayer }) => {
    registerHeroPlayer(e.target);
    reinforcePlaybackQuality(e.target);
  };

  const handleInlineReady = (e: { target: import("react-youtube").YouTubePlayer }) => {
    reinforcePlaybackQuality(e.target);
  };

  const handleEnd = (e: { target: import("react-youtube").YouTubePlayer }) => {
    try {
      e.target.seekTo(0, true);
      e.target.playVideo();
    } catch {
      /* noop */
    }
  };

  const handleStateChange = (e: {
    data: number;
    target: import("react-youtube").YouTubePlayer;
  }) => {
    if (e.data === YouTube.PlayerState.PLAYING) {
      reinforcePlaybackQuality(e.target);
      setShowYtPoster(false);
    }
  };

  const sharedTubeClasses =
    "absolute inset-0 h-full w-full [&>div]:absolute [&>div]:inset-0 [&>div]:h-full [&>div]:w-full";

  const posterLayer = showYtPoster && embedReady && (
    <Image
      src={poster}
      alt=""
      fill
      className="pointer-events-none absolute inset-0 z-[1] object-cover transition-opacity duration-500 ease-out"
      sizes="100vw"
      priority={isHero}
    />
  );

  if (isHero) {
    return (
      <div
        ref={rootRef}
        className={`relative left-1/2 w-screen min-w-0 -translate-x-1/2 bg-black ${className}`}
      >
        <div className="relative w-full overflow-hidden">
          <div className="relative min-h-[100dvh] w-full md:min-h-[min(56.25vw,85vh)]">
            <div
              className="absolute left-1/2 top-1/2 z-0 max-w-none -translate-x-1/2 -translate-y-1/2 md:h-[56.25vw] md:min-h-[115vh] md:min-w-[177.78vh] md:w-[100vw] max-md:h-[100dvh] max-md:min-h-[100dvh] max-md:w-[177.78vh] max-md:min-w-full max-md:max-w-none"
            >
              <div className="absolute inset-0 overflow-hidden bg-black">
                {!embedReady ? (
                  <Image
                    src={poster}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                ) : (
                  <>
                    <YouTube
                      videoId={videoId}
                      opts={ytOpts}
                      title={title}
                      className={`${sharedTubeClasses} z-0`}
                      iframeClassName="pointer-events-none absolute inset-0 h-full w-full border-0"
                      onReady={handleHeroReady}
                      onStateChange={handleStateChange}
                      onEnd={handleEnd}
                    />
                    {posterLayer}
                    <div
                      className="pointer-events-auto absolute inset-0 z-[2] bg-transparent"
                      aria-hidden
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative aspect-video w-full overflow-hidden bg-black ${className}`}
    >
      {active ? (
        !embedReady ? (
          <Image
            src={poster}
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="100vw"
            priority={false}
          />
        ) : (
          <>
            <YouTube
              videoId={videoId}
              opts={ytOpts}
              title={title}
              className={`${sharedTubeClasses} z-0`}
              iframeClassName="pointer-events-none absolute inset-0 h-full w-full border-0"
              onReady={handleInlineReady}
              onStateChange={handleStateChange}
              onEnd={handleEnd}
            />
            {posterLayer}
            <div
              className="pointer-events-auto absolute inset-0 z-[2] bg-transparent"
              aria-hidden
            />
          </>
        )
      ) : (
        <>
          <Image
            src={poster}
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="100vw"
            priority={false}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-transparent md:bg-black/25">
            <span className="sr-only">Video loads when in view</span>
          </div>
        </>
      )}
    </div>
  );
}
