import { useEffect, useRef, useState } from "react";
import { useSound } from "@/context/SoundContext";
import { useActiveVideo } from "@/context/ActiveVideoContext";

interface VideoSectionProps {
  youtubeId: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  poster?: string;
}

const VideoSection = ({ youtubeId, eyebrow, title, subtitle, href, poster }: VideoSectionProps) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [ready, setReady] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const { muted: globalMuted } = useSound();
  const { activeId, reportRatio, unregister } = useActiveVideo();

  const id = `video-${youtubeId}`;
  const isActive = activeId === id;

  // Build thresholds from 0..1 in fine steps for smooth ratio reporting
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ioLoad = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShouldLoad(true);
            ioLoad.disconnect();
            break;
          }
        }
      },
      { rootMargin: "150% 0px 150% 0px" }
    );
    ioLoad.observe(el);

    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const ioRatio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          reportRatio(id, e.intersectionRatio);
          setTitleVisible(e.intersectionRatio > 0.55);
        }
      },
      { threshold: thresholds }
    );
    ioRatio.observe(el);

    return () => {
      ioLoad.disconnect();
      ioRatio.disconnect();
      unregister(id);
    };
  }, [id, reportRatio, unregister]);

  const posterSrc = poster ?? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  // Always load muted (autoplay policy); we control play/pause + mute via postMessage
  const src = shouldLoad
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&showinfo=0&enablejsapi=1`
    : undefined;

  const post = (func: string, args: unknown[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  };

  // React to active/mute changes
  useEffect(() => {
    if (!shouldLoad) return;
    if (isActive) {
      post("playVideo");
      if (globalMuted) post("mute");
      else post("unMute");
    } else {
      post("pauseVideo");
      post("mute");
    }
  }, [isActive, globalMuted, shouldLoad, ready]);

  const Wrapper: any = href ? "a" : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen-stable overflow-hidden bg-background"
    >
      <img
        src={posterSrc}
        alt={title}
        loading="lazy"
        decoding="async"
        className="video-cover"
        style={{ opacity: ready ? 0 : 1, transition: "opacity 700ms ease" }}
      />

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
              ref={iframeRef}
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

      <div className="veil" />

      <Wrapper
        {...wrapperProps}
        className="absolute inset-0 z-10 flex h-full w-full flex-col items-center justify-center px-6 text-center"
        style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}
      >
        {eyebrow && (
          <span className="font-display tracking-cinema text-[10px] sm:text-[11px] uppercase text-white/70 mb-4">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display text-white uppercase font-bold leading-[0.95] tracking-[0.02em] text-[clamp(2.5rem,10vw,7.5rem)] drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-5 max-w-xl text-white/80 text-sm sm:text-base leading-relaxed">
            {subtitle}
          </p>
        )}
      </Wrapper>
    </section>
  );
};

export default VideoSection;
