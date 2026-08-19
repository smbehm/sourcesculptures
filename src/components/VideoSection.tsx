import { useCallback, useEffect, useRef, useState } from "react";
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

// YouTube player states (YT.PlayerState)
const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

// The iframe API only accepts commands once the player inside has booted and
// answered our {event:"listening"} handshake. Anything sent before that is
// dropped on the floor, which is why we re-send the handshake a few times and
// keep a reconcile loop instead of firing commands once and hoping.
const HANDSHAKE_EVERY_MS = 600;
const HANDSHAKE_ATTEMPTS = 20;
const POSTER_FALLBACK_MS = 4000;
const RECONCILE_MS = 800;

// The events a real YouTube player sends back once it is listening. Anything
// else on the message channel is somebody else's traffic, not proof of life.
const YT_EVENTS = new Set([
  "onReady",
  "onStateChange",
  "infoDelivery",
  "initialDelivery",
  "apiInfoDelivery",
  "onPlaybackQualityChange",
]);

/**
 * True once the visitor has actually interacted with the page.
 *
 * Browsers only allow audible playback after a real gesture. Asking the player
 * to unmute before that does not just fail quietly — it can stop the video from
 * playing at all, so we stay muted until the page has been activated.
 */
const useUserActivated = () => {
  const [activated, setActivated] = useState(
    () => typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true
  );

  useEffect(() => {
    if (activated) return;
    const onGesture = () => setActivated(true);
    const events = ["pointerdown", "touchend", "click", "keydown", "preloader-gesture"];
    events.forEach((e) => window.addEventListener(e, onGesture, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onGesture));
  }, [activated]);

  return activated;
};

const VideoSection = ({ youtubeId, title, href, poster, videoUrl, showControls = false, deferUntilScroll = false }: VideoSectionProps) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // A deferred video waits for the first scroll before it loads at all. Read
  // the current offset up front so a reload that restores scroll position
  // (or a deep link) does not leave the embed waiting for a scroll that the
  // visitor has effectively already made.
  const [scrolled, setScrolled] = useState(
    () => !deferUntilScroll || (typeof window !== "undefined" && window.scrollY > 0)
  );
  const [shouldLoad, setShouldLoad] = useState(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  // Set when the player never answers the handshake (blocked embed, extension,
  // hostile network). We then trust the URL's autoplay=1 and reveal the iframe
  // rather than stranding the visitor on a poster frame.
  const [apiBlind, setApiBlind] = useState(false);

  const { muted: globalMuted } = useSound();
  const { activeId, reportRatio, unregister } = useActiveVideo();
  const userActivated = useUserActivated();

  const id = `video-${youtubeId}`;
  const isActive = activeId === id;

  // What we want the player to be doing right now.
  const wantPlay = shouldLoad && inView;
  const wantSound = wantPlay && isActive && !globalMuted && userActivated;
  // With visible controls the visitor is in charge: we still pause off-screen,
  // but we never fight a deliberate pause.
  const forcePlay = !showControls;

  const wantPlayRef = useRef(wantPlay);
  const wantSoundRef = useRef(wantSound);
  // readyRef: commands are worth sending. playerAliveRef: the player has
  // actually answered, so we can stop the handshake.
  const readyRef = useRef(false);
  const playerAliveRef = useRef(false);
  const stateRef = useRef<number | null>(null);
  const playerMutedRef = useRef<boolean | null>(null);
  const qualitySetRef = useRef(false);
  const announcedReadyRef = useRef(false);
  const handshakeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const posterFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopHandshake = useCallback(() => {
    if (handshakeRef.current !== null) {
      clearInterval(handshakeRef.current);
      handshakeRef.current = null;
    }
    if (posterFallbackRef.current !== null) {
      clearTimeout(posterFallbackRef.current);
      posterFallbackRef.current = null;
    }
  }, []);

  useEffect(() => stopHandshake, [stopHandshake]);

  useEffect(() => {
    if (!deferUntilScroll || scrolled) return;
    const onScroll = () => {
      if (window.scrollY > 0) setScrolled(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [deferUntilScroll, scrolled]);

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
  const desiredQualityRef = useRef(desiredQuality);
  desiredQualityRef.current = desiredQuality;

  // Always autoplay muted with no controls; we control play/pause + mute via postMessage.
  // NOTE: We intentionally DO NOT pass loop=1&playlist=ID — that makes YouTube render
  // the center prev/pause/next overlay buttons on mobile. We loop manually via postMessage.
  const src = shouldLoad
    ? (videoUrl ?? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&controls=${showControls ? 1 : 0}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=${showControls ? 0 : 1}&fs=${showControls ? 1 : 0}&showinfo=0&cc_load_policy=0&enablejsapi=1&origin=${encodeURIComponent(origin)}&vq=${desiredQuality}&hd=1`)
    : undefined;

  const send = useCallback((func: string, args: unknown[] = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  // Push the player toward the state we want. Safe to call repeatedly: it only
  // ever re-sends the command for the state we are already asking for.
  const applyDesired = useCallback(() => {
    if (!readyRef.current) return;
    if (wantPlayRef.current) {
      send("playVideo");
      if (wantSoundRef.current) send("unMute");
      else send("mute");
    } else {
      send("pauseVideo");
      send("seekTo", [0, true]);
      send("mute");
    }
  }, [send]);

  useEffect(() => {
    wantPlayRef.current = wantPlay;
    wantSoundRef.current = wantSound;
    applyDesired();
  }, [wantPlay, wantSound, applyDesired]);

  // The player answered us: it will accept commands from here on.
  const markPlayerAlive = useCallback(() => {
    playerAliveRef.current = true;
    setApiBlind(false);
    stopHandshake();
    if (!announcedReadyRef.current) {
      announcedReadyRef.current = true;
      try { window.dispatchEvent(new Event("preview-video-ready")); } catch { /* noop */ }
    }
    if (readyRef.current) return;
    readyRef.current = true;
    applyDesired();
  }, [applyDesired, stopHandshake]);

  // Listen for YT iframe events via postMessage
  useEffect(() => {
    if (!shouldLoad) return;
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      let data: { event?: string; info?: unknown } | null = null;
      try {
        data = typeof ev.data === "string" ? JSON.parse(ev.data) : (ev.data as typeof data);
      } catch {
        return;
      }
      // Only the player's own events count as proof of life — the page shares
      // this message channel with everything else on it.
      if (!data || !data.event || !YT_EVENTS.has(data.event)) return;
      markPlayerAlive();

      const info = data.info as { playerState?: number; muted?: boolean } | undefined;
      if (info && typeof info.muted === "boolean") playerMutedRef.current = info.muted;

      const playerState =
        data.event === "onStateChange" && typeof data.info === "number"
          ? (data.info as number)
          : info?.playerState;

      if (typeof playerState !== "number") return;
      stateRef.current = playerState;
      setPlaying(playerState === YT_PLAYING);

      // Ask for high quality exactly once per load. Re-sending it (as this
      // component used to, on every info message) makes the player tear down
      // and re-buffer the stream over and over, which reads as "the video
      // never starts".
      if (playerState === YT_PLAYING && !qualitySetRef.current) {
        qualitySetRef.current = true;
        send("setPlaybackQuality", [desiredQualityRef.current]);
      }

      // Manual loop: when the video ends, seek back and play again.
      if (playerState === YT_ENDED && forcePlay) {
        send("seekTo", [0, true]);
        if (wantPlayRef.current) send("playVideo");
      }
      if (playerState === YT_PAUSED && forcePlay && wantPlayRef.current) {
        send("playVideo");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [shouldLoad, markPlayerAlive, send, forcePlay]);

  // Handshake: subscribe to player events. The player boots asynchronously, so
  // repeat until it answers rather than assuming the first message landed.
  const handleIframeLoad = useCallback(() => {
    stopHandshake();
    let attempts = 0;
    const listen = () => {
      if (playerAliveRef.current || attempts >= HANDSHAKE_ATTEMPTS) {
        if (handshakeRef.current !== null) {
          clearInterval(handshakeRef.current);
          handshakeRef.current = null;
        }
        return;
      }
      attempts += 1;
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening" }),
        "*"
      );
    };
    listen();
    handshakeRef.current = setInterval(listen, HANDSHAKE_EVERY_MS);
    posterFallbackRef.current = setTimeout(() => {
      if (playerAliveRef.current) return;
      // Still no answer. Keep knocking, but stop hiding the video behind its
      // poster — the embed's own autoplay=1 is very likely running by now.
      setApiBlind(true);
      readyRef.current = true;
      applyDesired();
      if (!announcedReadyRef.current) {
        announcedReadyRef.current = true;
        try { window.dispatchEvent(new Event("preview-video-ready")); } catch { /* noop */ }
      }
    }, POSTER_FALLBACK_MS);
  }, [applyDesired, stopHandshake]);

  // Self-healing loop: commands get dropped (player still booting, iOS gesture
  // rules, a tab that was backgrounded mid-scroll). Compare what the player
  // reports against what we want and re-issue only on a real mismatch.
  useEffect(() => {
    if (!shouldLoad) return;
    const timer = setInterval(() => {
      if (!readyRef.current) return;
      const state = stateRef.current;
      // Buffering counts as running: the player is already on its way.
      const isRunning = state === YT_PLAYING || state === YT_BUFFERING;

      if (!wantPlayRef.current) {
        if (isRunning) applyDesired();
        return;
      }
      if (!isRunning) {
        if (forcePlay) applyDesired();
        return;
      }
      // Playing: the only thing left to correct is the mute state. The player
      // reports `muted`, so a value equal to wantSound means they disagree.
      const reportedMuted = playerMutedRef.current;
      if (reportedMuted !== null && reportedMuted === wantSoundRef.current) applyDesired();
    }, RECONCILE_MS);
    return () => clearInterval(timer);
  }, [shouldLoad, applyDesired, forcePlay]);

  // iOS Safari blocks programmatic autoplay until a user gesture. Retry on any
  // gesture, but only for the video that should actually be playing — kicking
  // every off-screen embed just saturates bandwidth and stalls the one on screen.
  useEffect(() => {
    if (!shouldLoad) return;
    const kick = () => {
      if (!wantPlayRef.current) return;
      const state = stateRef.current;
      if (state === YT_PLAYING || state === YT_BUFFERING) return;
      applyDesired();
    };
    const opts = { passive: true } as const;
    window.addEventListener("touchstart", kick, opts);
    window.addEventListener("touchend", kick, opts);
    window.addEventListener("click", kick);
    window.addEventListener("pointerdown", kick);
    window.addEventListener("keydown", kick);
    window.addEventListener("wheel", kick, opts);
    window.addEventListener("scroll", kick, opts);
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
  }, [shouldLoad, applyDesired]);

  // Reveal the iframe once it is genuinely rolling (or once we have given up on
  // hearing from it), so the poster never lifts on a frozen first frame.
  const revealVideo = isActive && inView && (playing || apiBlind);

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
