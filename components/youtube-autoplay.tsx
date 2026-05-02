"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteAudio } from "@/components/site-audio-provider";
import { getYoutubeEmbedOrigin } from "@/lib/embed-origin";
import { chromelessYoutubeEmbedUrl } from "@/lib/youtube";

type YouTubeAutoplayProps = {
  videoId: string;
  title: string;
  className?: string;
  /**
   * `hero` — edge-to-edge cinematic strip (project pages): always plays when mounted, cover-style iframe.
   * `inline` — aspect-video block with intersection-triggered load (home sections if reused).
   */
  variant?: "inline" | "hero";
};

/**
 * Muted autoplay when the frame is sufficiently in view; poster when out of view (inline only).
 */
export function YouTubeAutoplay({
  videoId,
  title,
  className = "",
  variant = "inline",
}: YouTubeAutoplayProps) {
  const { siteMuted } = useSiteAudio();
  const rootRef = useRef<HTMLDivElement>(null);
  const isHero = variant === "hero";
  const [active, setActive] = useState(isHero);

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

  const embedOrigin = useMemo(() => getYoutubeEmbedOrigin(), []);

  const embedSrc = useMemo(
    () =>
      chromelessYoutubeEmbedUrl(videoId, {
        muted: siteMuted,
        embedOrigin,
      }),
    [videoId, siteMuted, embedOrigin],
  );

  const poster = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  const iframeCore = (
    <>
      <iframe
        key={`${videoId}-${siteMuted}`}
        title={title}
        className="pointer-events-none absolute inset-0 z-0 h-full w-full select-none border-0"
        src={embedSrc}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
      />
      <div
        className="pointer-events-auto absolute inset-0 z-[1] bg-transparent"
        aria-hidden
      />
    </>
  );

  if (isHero) {
    return (
      <div
        ref={rootRef}
        className={`relative w-full bg-black ${className}`}
      >
        <div className="relative w-full overflow-hidden">
          {/* Cover-scale iframe: full-bleed width, crops side letterboxing (no "theater" pillarbox) */}
          <div className="relative min-h-[56.25vw] w-full md:min-h-[min(56.25vw,85vh)]">
            <div className="absolute left-1/2 top-1/2 z-0 h-[56.25vw] max-w-none min-h-[115vh] min-w-[177.78vh] w-[100vw] -translate-x-1/2 -translate-y-1/2">
              {iframeCore}
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
        iframeCore
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
