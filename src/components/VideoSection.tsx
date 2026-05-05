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
  const [playing, setPlaying] = useState(false);
  const { muted: globalMuted } = useSound();
  const { activeId, reportRatio, unregister } = useActiveVideo();

  const id = `video-${youtubeId}`;
  const isActive = activeId === id;
  const [inView, setInView] = useState(false);
  const revealVideo = isActive && ready && inView;

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
          setInView(e.intersectionRatio > 0.1);
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
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // Track viewport so quality target updates if user resizes between desktop/mobile.
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" && window.matchMedia("(min-width: 1025px)").matches
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1025px)");
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // Desktop: target 4K; Mobile/tablet: target 1080p minimum.
  const desiredQuality = isDesktop ? "hd2160" : "hd1080";

  // Always autoplay muted with no controls; we control play/pause + mute via postMessage.
  // NOTE: We intentionally DO NOT pass loop=1&playlist=ID — that makes YouTube render
  // the center prev/pause/next overlay buttons on mobile. We loop manually via postMessage.
  const src = shouldLoad
    ? (videoUrl ?? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=${showControls ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=${showControls ? 0 : 1}&fs=${showControls ? 1 : 0}&showinfo=0&cc_load_policy=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&vq=${desiredQuality}&hd=1`)
    : undefined;

  const post = (func: string, args: unknown[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  };

  // Force the highest available quality. YouTube's API picks from
  // getAvailableQualityLevels — we try our preferred ladder in order.
  const forceQuality = () => {
    const ladder = isDesktop
      ? ["highres", "hd2160", "hd1440", "hd1080"]
      : ["hd1080", "hd1440", "hd2160", "highres"];
    ladder.forEach((q) => post("setPlaybackQuality", [q]));
  };

  // Listen for YT iframe events via postMessage
  useEffect(() => {
    if (!shouldLoad) return;
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      try {
        const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
        if (data?.event === "onReady" || data?.event === "infoDelivery") {
          if (!ready) {
            try { window.dispatchEvent(new Event("preview-video-ready")); } catch { /* noop */ }
          }
          setReady(true);
        }
        // Manual loop: when video ends (state 0), seek to 0 and play again
        const info = data?.info;
        const playerState = data?.event === "onStateChange" ? data?.info : info?.playerState;
        if (typeof playerState === "number") {
          setPlaying(playerState === 1);
          if (playerState === 1) forceQuality();
        }
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

  // Subscribe to YT events once iframe loads. Keep playback running muted in
  // the background so scroll handoffs never trigger YouTube's pause overlay.
  const handleIframeLoad = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "listening" }), "*");
    // Briefly play to force buffering/preload of the first frames, then pause
    // immediately if not yet in view. We unpause when the user scrolls to it.
    post("mute");
    post("playVideo");
    forceQuality();
    setTimeout(() => {
      if (!inView) {
        post("pauseVideo");
        post("seekTo", [0, true]);
      }
      setReady(true);
    }, 400);
  };

  // React to active/mute changes without pausing, so native pause controls
  // never get a chance to appear during scroll transitions.
  useEffect(() => {
    if (!shouldLoad || !ready) return;
    forceQuality();
    if (inView) {
      post("playVideo");
      if (isActive && !globalMuted) post("unMute");
      else post("mute");
    } else {
      post("pauseVideo");
      post("seekTo", [0, true]);
      post("mute");
    }
    const t1 = setTimeout(() => {
      if (inView) post("playVideo");
      forceQuality();
    }, 1500);
    const interval = setInterval(forceQuality, 5000);
    return () => {
      clearTimeout(t1);
      clearInterval(interval);
    };
  }, [isActive, globalMuted, shouldLoad, ready, desiredQuality, inView]);


  // iOS Safari blocks programmatic autoplay until a user gesture.
  // Kick play on ANY user gesture (including the preloader's "tap to enter")
  // so the YouTube center play-button overlay never appears.
  useEffect(() => {
    if (!shouldLoad) return;
    const kick = () => {
      post("playVideo");
      if (isActive && !globalMuted) post("unMute");
      else post("mute");
    };
    window.addEventListener("touchstart", kick, { passive: true });
    window.addEventListener("touchend", kick, { passive: true });
    window.addEventListener("click", kick);
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    window.addEventListener("wheel", kick, { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("preloader-gesture", kick);
    return () => {
      window.removeEventListener("touchstart", kick);
      window.removeEventListener("touchend", kick);
      window.removeEventListener("click", kick);
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("wheel", kick);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("preloader-gesture", kick);
    };
  }, [shouldLoad, isActive, globalMuted]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen-stable overflow-hidden bg-background"
    >
      {/* Poster: snaps in instantly when video becomes inactive (covers any
          YT overlay flash), fades out smoothly only when video is playing. */}
      <img
        src={posterSrc}
        alt={title}
        loading="lazy"
        decoding="async"
        className="video-cover"
        style={{
          zIndex: 1,
          opacity: revealVideo ? 0 : 1,
          transition: revealVideo ? "opacity 500ms ease" : "none",
        }}
      />

      {src && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 0 }}
          aria-hidden={!isActive}
        >
          <div
            className="absolute left-1/2 top-1/2 [--yt-oversize:1.35] md:[--yt-oversize:1.2]"
            style={{
              transform: "translate(-50%, -50%)",
              // Oversize on mobile too so YouTube's center play/pause overlay
              // (which flashes briefly during state changes) is pushed outside
              // the visible crop.
              width: "calc(max(100vw, calc(100svh * 16 / 9)) * var(--yt-oversize))",
              height: "calc(max(100svh, calc(100vw * 9 / 16)) * var(--yt-oversize))",
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
