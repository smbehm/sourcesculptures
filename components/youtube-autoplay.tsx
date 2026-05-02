"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSiteAudio } from "@/components/site-audio-provider";
import { chromelessYoutubeEmbedUrl } from "@/lib/youtube";

type YouTubeAutoplayProps = {
  videoId: string;
  title: string;
  className?: string;
};

/**
 * Muted autoplay when the frame is sufficiently in view; poster when out of view
 * so playback does not run off-screen (bandwidth + UX).
 */
export function YouTubeAutoplay({
  videoId,
  title,
  className = "",
}: YouTubeAutoplayProps) {
  const { siteMuted } = useSiteAudio();
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting && entry.intersectionRatio > 0.35);
      },
      { threshold: [0, 0.35, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const poster = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  const embedSrc = useMemo(
    () => chromelessYoutubeEmbedUrl(videoId, { muted: siteMuted }),
    [videoId, siteMuted],
  );

  return (
    <div
      ref={rootRef}
      className={`relative aspect-video w-full overflow-hidden bg-black ${className}`}
    >
      {active ? (
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
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <span className="sr-only">Video loads when in view</span>
          </div>
        </>
      )}
    </div>
  );
}
