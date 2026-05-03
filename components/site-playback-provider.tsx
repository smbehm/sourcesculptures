"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { YouTubePlayer } from "react-youtube";

import type { VideoQualityTier } from "@/lib/playback-types";
import { syncAllSiteVideosMuted, tryPlayAllSiteVideos } from "@/lib/native-video-registry";
import { usePlaybackMuteStore } from "@/lib/playback-mute-store";
import { safeYoutubePlayVideo } from "@/lib/safe-media-play";
import {
  applyPreferredQuality,
  reinforcePreferredQuality,
} from "@/lib/youtube-quality";

export type { VideoQualityTier };

/** Matches typical YouTube embed policy — iOS Chrome/WKWebKit is strict about missing features. */
const IFRAME_ALLOW_FEATURES = [
  "accelerometer",
  "autoplay",
  "clipboard-write",
  "encrypted-media",
  "gyroscope",
  "picture-in-picture",
  "web-share",
  "fullscreen",
] as const;

/**
 * Patch iframe `allow` so autoplay / encrypted-media work across mobile browsers.
 * Chrome Android historically needed `autoplay`; iOS WebKit benefits from the full set.
 */
export function patchYtIframeAllow(player: YouTubePlayer) {
  try {
    const p = player as unknown as { getIframe?: () => HTMLIFrameElement };
    const iframe = p.getIframe?.();
    if (!iframe) return;
    const cur = iframe.getAttribute("allow") ?? "";
    const existing = cur
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    const names = new Set(
      existing.map((chunk) => chunk.split(/\s+/)[0]?.toLowerCase()).filter(Boolean),
    );
    const merged = [...existing];
    for (const feat of IFRAME_ALLOW_FEATURES) {
      if (!names.has(feat.toLowerCase())) {
        merged.push(feat);
        names.add(feat.toLowerCase());
      }
    }
    iframe.setAttribute("allow", merged.join("; "));
  } catch {
    /* noop */
  }
}

/**
 * Mute or request audible playback.
 * When `unlockAudio` is false and `muted` is false, only `playVideo()` runs so embeds
 * stay muted (browser autoplay policy). Never call `unMute` outside a gesture.
 */
function setPlayerMuted(
  player: YouTubePlayer,
  muted: boolean,
  unlockAudio = false,
) {
  const p = player as unknown as {
    mute?: () => unknown;
    unMute?: () => unknown;
    setVolume?: (n: number) => unknown;
    playVideo?: () => unknown;
  };
  try {
    if (muted) {
      p.mute?.();
      return;
    }
    if (!unlockAudio) {
      safeYoutubePlayVideo(p);
      return;
    }
    p.unMute?.();
    p.setVolume?.(100);
    safeYoutubePlayVideo(p);
  } catch {
    /* noop — iframe may be mid-teardown */
  }
}

const STORAGE_MUTE = "sourcesculptures:playback:mute";

function preferredTierForViewport(): VideoQualityTier {
  if (typeof window === "undefined") return "hd1080";
  return window.matchMedia("(max-width: 1023px)").matches ? "hd1080" : "hd2160";
}

type PlaybackContextValue = {
  toggleMute: () => void;
  registerParallaxPlayer: (slug: string, player: YouTubePlayer | null) => void;
  registerHeroPlayer: (player: YouTubePlayer | null) => void;
  setActiveParallaxSlug: (slug: string | null) => void;
  reinforcePlaybackQuality: (player: YouTubePlayer) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function SitePlaybackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [videoQuality, setVideoQuality] = useState<VideoQualityTier>("hd1080");

  // Refs for synchronous access inside callbacks (no stale closures)
  const siteMutedRef = useRef(false);
  const videoQualityRef = useRef<VideoQualityTier>("hd1080");
  const activeParallaxSlugRef = useRef<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);
  const initialGestureUnlockDoneRef = useRef(false);
  /** After a real unlock gesture, panel switches may call unMute (desktop + post-unlock iOS). */
  const sessionAudioUnlockedRef = useRef(false);

  const siteMuted = usePlaybackMuteStore((s) => s.siteMuted);

  // Keep refs in sync with state
  useEffect(() => {
    siteMutedRef.current = siteMuted;
  }, [siteMuted]);

  useEffect(() => {
    videoQualityRef.current = videoQuality;
  }, [videoQuality]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MUTE, siteMuted ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [siteMuted]);

  // Track viewport quality tier
  useEffect(() => {
    const sync = () => {
      const tier = preferredTierForViewport();
      videoQualityRef.current = tier;
      setVideoQuality(tier);
    };
    sync();
    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /**
   * Apply the mute policy synchronously — reads only refs.
   * Use `unlockAudio: true` only from real user gestures (toggle, first tap).
   */
  const applyPolicySync = useCallback(
    (muted: boolean, opts?: { unlockAudio?: boolean }) => {
      const gestureUnlock = opts?.unlockAudio ?? false;
      if (muted) {
        sessionAudioUnlockedRef.current = false;
      } else if (gestureUnlock) {
        sessionAudioUnlockedRef.current = true;
      }
      const unlock =
        gestureUnlock || (!muted && sessionAudioUnlockedRef.current);

      const physicalSiteMuted = muted || !sessionAudioUnlockedRef.current;
      syncAllSiteVideosMuted(physicalSiteMuted);
      usePlaybackMuteStore.setState({ physicalSiteMuted: physicalSiteMuted });

      const q = videoQualityRef.current;
      const hero = heroPlayerRef.current;
      const audibleSlug = hero ? null : activeParallaxSlugRef.current;

      parallaxPlayersRef.current.forEach((player, slug) => {
        applyPreferredQuality(player, q);
        const silence = muted || slug !== audibleSlug;
        if (silence) {
          setPlayerMuted(player, true);
        } else {
          setPlayerMuted(player, false, unlock);
        }
      });

      if (hero) {
        applyPreferredQuality(hero, q);
        setPlayerMuted(hero, muted, !muted && unlock);
      }
    },
    [],
  );

  // Hydrate mute preference from localStorage and sync physical mute / native videos
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MUTE);
      if (stored === "1") {
        siteMutedRef.current = true;
        usePlaybackMuteStore.setState({ siteMuted: true });
      } else if (stored === "0") {
        siteMutedRef.current = false;
        usePlaybackMuteStore.setState({ siteMuted: false });
      }
    } catch {
      /* noop */
    }
    applyPolicySync(siteMutedRef.current);
  }, [applyPolicySync]);

  /**
   * Toggle mute — full audio unlock path runs synchronously in the tap/click handler.
   */
  const toggleMute = useCallback(() => {
    const next = !siteMutedRef.current;
    siteMutedRef.current = next;
    usePlaybackMuteStore.setState({ siteMuted: next });
    applyPolicySync(next, { unlockAudio: true });
  }, [applyPolicySync]);

  // Sync mute across tabs (no gesture — never unlock audio remotely)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_MUTE) return;
      if (e.newValue === "1") {
        siteMutedRef.current = true;
        usePlaybackMuteStore.setState({ siteMuted: true });
        applyPolicySync(true);
      } else if (e.newValue === "0") {
        siteMutedRef.current = false;
        usePlaybackMuteStore.setState({ siteMuted: false });
        applyPolicySync(false);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [applyPolicySync]);

  /**
   * First touchstart, click, or scroll (excluding mute control) unlocks audio if the user
   * has not chosen muted via the control / persisted mute (`siteMuted`).
   */
  useEffect(() => {
    const onFirstGesture = (e: Event) => {
      if (initialGestureUnlockDoneRef.current) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("[data-site-mute-control]")) return;
      if (usePlaybackMuteStore.getState().siteMuted) return;
      initialGestureUnlockDoneRef.current = true;
      applyPolicySync(false, { unlockAudio: true });
      tryPlayAllSiteVideos();
    };
    const optsTouch = { capture: true, passive: true } as const;
    const optsScroll = { capture: true, passive: true } as const;
    window.addEventListener("touchstart", onFirstGesture, optsTouch);
    window.addEventListener("click", onFirstGesture, true);
    window.addEventListener("scroll", onFirstGesture, optsScroll);
    return () => {
      window.removeEventListener("touchstart", onFirstGesture, optsTouch);
      window.removeEventListener("click", onFirstGesture, true);
      window.removeEventListener("scroll", onFirstGesture, optsScroll);
    };
  }, [applyPolicySync]);

  const setActiveParallaxSlug = useCallback(
    (slug: string | null) => {
      activeParallaxSlugRef.current = slug;
      // Re-apply policy so audio follows the newly active panel
      applyPolicySync(siteMutedRef.current);
    },
    [applyPolicySync]
  );

  const registerParallaxPlayer = useCallback(
    (slug: string, player: YouTubePlayer | null) => {
      const m = parallaxPlayersRef.current;
      if (player) {
        m.set(slug, player);
        // Apply current policy to newly registered player
        applyPolicySync(siteMutedRef.current);
      } else {
        m.delete(slug);
      }
    },
    [applyPolicySync]
  );

  const registerHeroPlayer = useCallback(
    (player: YouTubePlayer | null) => {
      heroPlayerRef.current = player;
      if (player) {
        applyPolicySync(siteMutedRef.current);
      }
    },
    [applyPolicySync]
  );

  const reinforcePlaybackQuality = useCallback((player: YouTubePlayer) => {
    reinforcePreferredQuality(player, videoQualityRef.current);
  }, []);

  // Re-apply policy whenever quality tier changes
  useEffect(() => {
    applyPolicySync(siteMutedRef.current);
  }, [videoQuality, applyPolicySync]);

  const value = useMemo(
    () => ({
      toggleMute,
      registerParallaxPlayer,
      registerHeroPlayer,
      setActiveParallaxSlug,
      reinforcePlaybackQuality,
    }),
    [
      toggleMute,
      registerParallaxPlayer,
      registerHeroPlayer,
      setActiveParallaxSlug,
      reinforcePlaybackQuality,
    ]
  );

  return (
    <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
  );
}

export function useSitePlayback() {
  const ctx = useContext(PlaybackContext);
  const siteMuted = usePlaybackMuteStore((s) => s.siteMuted);
  if (!ctx) {
    throw new Error("useSitePlayback must be used within SitePlaybackProvider");
  }
  return { ...ctx, siteMuted };
}

/** @deprecated Use useSitePlayback */
export function useSiteAudio() {
  return useSitePlayback();
}
