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
  videoUrl?: string;
  showControls?: boolean;
  deferUntilScroll?: boolean;
}

const VideoSection = ({ youtubeId, title, href, poster, videoUrl, showControls = false, deferUntilScroll = false }: VideoSectionProps) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [scrolled, setScrolled] = useState(!deferUntilScroll);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!deferUntilScroll || scrolled) return;
    const onScroll = () => {
      if (window.scrollY > 0) setScrolled(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [deferUntilScroll, scrolled]);
  const [ready, setReady] = useState(false);
  const { muted: globalMuted } = useSound();
  const { activeId, reportRatio, unregister } = useActiveVideo();

  const id = `video-${youtubeId}`;
  const isActive = activeId === id;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !scrolled) return;

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
      { rootMargin: "200% 0px 200% 0px" }
    );
    ioLoad.observe(el);

    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);
    const ioRatio = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          reportRatio(id, e.intersectionRatio);
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
  }, [id, reportRatio, unregister, scrolled]);

  const posterSrc = poster ?? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  // Always autoplay muted with no controls; we control play/pause + mute via postMessage.
  // NOTE: We intentionally DO NOT pass loop=1&playlist=ID — that makes YouTube render
  // the center prev/pause/next overlay buttons on mobile. We loop manually via postMessage.
  const src = shouldLoad
    ? (videoUrl ?? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=${showControls ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=${showControls ? 0 : 1}&fs=${showControls ? 1 : 0}&showinfo=0&cc_load_policy=0&enablejsapi=1`)
    : undefined;

  const post = (func: string, args: unknown[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  };

  // Listen for YT iframe events via postMessage
  useEffect(() => {
    if (!shouldLoad) return;
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        if (data?.event === "onReady" || data?.event === "infoDelivery") {
          setReady(true);
        }
        // Manual loop: when video ends (state 0), seek to 0 and play again
        const info = data?.info;
        const playerState = data?.event === "onStateChange" ? data?.info : info?.playerState;
        if (playerState === 0) {
          post("seekTo", [0, true]);
          post("playVideo");
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [shouldLoad]);

  // Subscribe to YT events once iframe loads
  const handleIframeLoad = () => {
    // Tell YT iframe to start sending us events
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "listening" }), "*");
    // Fallback: assume ready shortly after
    setTimeout(() => setReady(true), 600);
  };

  // React to active/mute changes. Never pause — pausing makes YouTube show
  // a large center pause/play overlay that we cannot style across origins.
  // Instead, keep all videos playing and only toggle mute on the active one.
  useEffect(() => {
    if (!shouldLoad || !ready) return;
    post("playVideo");
    // Request 4K on desktop, 720p HD on mobile/tablet.
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches;
    post("setPlaybackQuality", [isMobile ? "hd1080" : "hd2160"]);
    if (isActive && !globalMuted) post("unMute");
    else post("mute");
  }, [isActive, globalMuted, shouldLoad, ready]);

  // iOS Safari blocks programmatic autoplay until a user gesture.
  // On the first touch/click anywhere, re-issue play to the active video.
  useEffect(() => {
    if (!shouldLoad) return;
    const kick = () => {
      // Always kick this video into play on any gesture so iOS never shows
      // the YouTube center play-button overlay when user scrolls to it.
      post("playVideo");
      if (isActive && !globalMuted) post("unMute");
      else post("mute");
    };
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("touchend", kick, { passive: true });
    window.addEventListener("click", kick);
    return () => {
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("touchend", kick);
      window.removeEventListener("click", kick);
    };
  }, [shouldLoad, isActive, globalMuted]);

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
        style={{ opacity: ready && isActive ? 0 : 1, transition: "opacity 500ms ease" }}
      />

      {src && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ opacity: ready && isActive ? 1 : 0, transition: "opacity 500ms ease" }}
          aria-hidden={!isActive}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: "translate(-50%, -50%)",
              // Oversize ~20% so YouTube's title bar (top) and any UI (bottom)
              // are clipped off-screen on every device/orientation.
              width: "calc(max(100vw, calc(100svh * 16 / 9)) * 1.2)",
              height: "calc(max(100svh, calc(100vw * 9 / 16)) * 1.2)",
            }}
          >
            <iframe
              ref={iframeRef}
              src={src}
              title={title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
              onLoad={handleIframeLoad}
              className="block w-full h-full border-0 pointer-events-none"
            />
          </div>
        </div>
      )}

      {/* Click-catcher overlay covers any YT UI and provides navigation */}
      {href ? (
        <a href={href} aria-label={title} className="absolute inset-0 z-10 block" />
      ) : (
        <div className="absolute inset-0 z-10" aria-hidden="true" />
      )}
    </section>
  );
};

export default VideoSection;
