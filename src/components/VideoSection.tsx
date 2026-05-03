import { useEffect, useRef, useState } from "react";

interface VideoSectionProps {
  youtubeId: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  poster?: string;
}

/**
 * Fullscreen cinematic YouTube section.
 * - Lazy-mounts the iframe only when the section is near the viewport
 * - Uses YouTube's native loop (playlist=ID) + autoplay + mute + playsinline
 * - Uses 100svh + transform/scale wrapper so the video covers without bars on mobile
 */
const VideoSection = ({ youtubeId, eyebrow, title, subtitle, href, poster }: VideoSectionProps) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200% 0px 200% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const posterSrc = poster ?? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  const src = shouldLoad
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&showinfo=0`
    : undefined;

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen-stable overflow-hidden bg-background"
    >
      {/* Poster (always present, prevents flash/gaps) */}
      <img
        src={posterSrc}
        alt={title}
        loading="lazy"
        decoding="async"
        className="video-cover"
        style={{ opacity: ready ? 0 : 1, transition: "opacity 700ms ease" }}
      />

      {/* Iframe scaled to cover (YouTube preserves 16:9 letterbox; we scale up) */}
      {src && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: "translate(-50%, -50%)",
              width: "max(100vw, calc(100svh * 16 / 9))",
              height: "max(100svh, calc(100vw * 9 / 16))",
            }}
          >
            <iframe
              src={src}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              onLoad={() => setTimeout(() => setReady(true), 400)}
              className="block w-full h-full border-0 pointer-events-none"
            />
          </div>
        </div>
      )}

      {/* Veil for text legibility */}
      <div className="veil" />

      {/* Text overlay */}
      <div className="relative z-10 flex h-full w-full flex-col items-start justify-end p-6 sm:p-10 md:p-16">
        {eyebrow && (
          <span className="font-display tracking-cinema text-[10px] sm:text-[11px] uppercase text-white/70 mb-3">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-white uppercase font-bold leading-[0.95] text-[clamp(2.5rem,9vw,7rem)] drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-4 max-w-xl text-white/80 text-sm sm:text-base leading-relaxed">
            {subtitle}
          </p>
        )}
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 font-display tracking-cinema text-[11px] uppercase text-white/90 border-b border-white/40 pb-1 hover:text-white hover:border-white transition-colors"
          >
            View Project →
          </a>
        )}
      </div>
    </section>
  );
};

export default VideoSection;
