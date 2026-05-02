"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { YouTubePlayer } from "react-youtube";

import type { VideoQualityTier } from "@/lib/playback-types";
import {
  applyPreferredQuality,
  reinforcePreferredQuality,
} from "@/lib/youtube-quality";

export type { VideoQualityTier };

/** Site-wide mute off → unmute + play; mute on → mute. Handles both sync YT.Player and promisified wrappers. */
function setPlayerMuted(player: YouTubePlayer, muted: boolean) {
  const p = player as unknown as {
    mute?: () => unknown;
    unMute?: () => unknown;
    playVideo?: () => unknown;
    setVolume?: (n: number) => unknown;
  };
  const float = (x: unknown) => {
    if (x != null && typeof (x as Promise<unknown>).then === "function") {
      void (x as Promise<unknown>).catch(() => {});
    }
  };
  try {
    if (muted) {
      float(p.mute?.());
      return;
    }
    const u = p.unMute?.();
    if (u != null && typeof (u as Promise<unknown>).then === "function") {
      void (u as Promise<unknown>)
        .then(() => {
          float(p.setVolume?.(100));
          float(p.playVideo?.());
        })
        .catch(() => {});
    } else {
      float(p.setVolume?.(100));
      float(p.playVideo?.());
    }
  } catch {
    /* noop */
  }
}

/** Persisted site-wide in localStorage (survives reload and matches cross-route SPA state after hydrate). */
const STORAGE_MUTE = "sourcesculptures:playback:mute";
const STORAGE_QUALITY = "sourcesculptures:playback:quality";

type PlaybackContextValue = {
  siteMuted: boolean;
  toggleMute: () => void;
  videoQuality: VideoQualityTier;
  setVideoQuality: (q: VideoQualityTier) => void;
  registerParallaxPlayer: (slug: string, player: YouTubePlayer | null) => void;
  registerHeroPlayer: (player: YouTubePlayer | null) => void;
  setActiveParallaxSlug: (slug: string | null) => void;
  /** Call when the player enters PLAYING — quality requests stick better after playback starts. */
  reinforcePlaybackQuality: (player: YouTubePlayer) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function SitePlaybackProvider({ children }: { children: React.ReactNode }) {
  /** Default unmuted: global bar mutes/unmutes the whole site; only one embed gets sound when unmuted. */
  const [siteMuted, setSiteMuted] = useState(false);
  const [videoQuality, setVideoQualityState] = useState<VideoQualityTier>("hd1080");
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [activeParallaxSlug, setActiveParallaxSlug] = useState<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);
  const videoQualityRef = useRef(videoQuality);
  const siteMutedRef = useRef(siteMuted);

  useLayoutEffect(() => {
    videoQualityRef.current = videoQuality;
    siteMutedRef.current = siteMuted;
  }, [videoQuality, siteMuted]);

  useEffect(() => {
    try {
      const m = localStorage.getItem(STORAGE_MUTE);
      const q = localStorage.getItem(STORAGE_QUALITY);
      queueMicrotask(() => {
        if (m === "0") setSiteMuted(false);
        else if (m === "1") setSiteMuted(true);
        if (q === "hd1080" || q === "hd2160") setVideoQualityState(q);
        setPrefsHydrated(true);
      });
    } catch {
      queueMicrotask(() => setPrefsHydrated(true));
    }
  }, []);

  /** Keep mute + quality in sync across browser tabs. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_MUTE && (e.newValue === "0" || e.newValue === "1")) {
        setSiteMuted(e.newValue === "1");
      }
      if (
        e.key === STORAGE_QUALITY &&
        (e.newValue === "hd1080" || e.newValue === "hd2160")
      ) {
        setVideoQualityState(e.newValue);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!prefsHydrated) return;
    try {
      localStorage.setItem(STORAGE_MUTE, siteMuted ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [siteMuted, prefsHydrated]);

  useEffect(() => {
    if (!prefsHydrated) return;
    try {
      localStorage.setItem(STORAGE_QUALITY, videoQuality);
    } catch {
      /* noop */
    }
  }, [videoQuality, prefsHydrated]);

  const applyPolicy = useCallback(
    (muted: boolean) => {
      const q = videoQualityRef.current;
      const hero = heroPlayerRef.current;
      const parallaxAudibleSlug = hero ? null : activeParallaxSlug;

      parallaxPlayersRef.current.forEach((player, slug) => {
        const audible = !muted && slug === parallaxAudibleSlug;
        applyPreferredQuality(player, q);
        setPlayerMuted(player, !audible);
      });
      if (hero) {
        applyPreferredQuality(hero, q);
        setPlayerMuted(hero, muted);
      }
    },
    [activeParallaxSlug],
  );

  const toggleMute = useCallback(() => {
    /**
     * Use explicit `!siteMuted` (not `setSiteMuted(p => !p)`) so React Strict Mode in dev
     * cannot double-invoke the updater and cancel the toggle.
     */
    const next = !siteMuted;
    setSiteMuted(next);
    queueMicrotask(() => {
      applyPolicy(next);
      requestAnimationFrame(() => applyPolicy(next));
    });
  }, [siteMuted, applyPolicy]);

  const setVideoQuality = useCallback(
    (q: VideoQualityTier) => {
      videoQualityRef.current = q;
      setVideoQualityState(q);
      queueMicrotask(() => {
        applyPolicy(siteMutedRef.current);
        requestAnimationFrame(() => applyPolicy(siteMutedRef.current));
      });
    },
    [applyPolicy],
  );

  const registerParallaxPlayer = useCallback(
    (slug: string, player: YouTubePlayer | null) => {
      const m = parallaxPlayersRef.current;
      if (player) m.set(slug, player);
      else m.delete(slug);
      if (player) {
        applyPolicy(siteMutedRef.current);
      }
    },
    [applyPolicy],
  );

  const registerHeroPlayer = useCallback(
    (player: YouTubePlayer | null) => {
      heroPlayerRef.current = player;
      if (player) {
        applyPolicy(siteMutedRef.current);
      }
    },
    [applyPolicy],
  );

  const reinforcePlaybackQuality = useCallback((player: YouTubePlayer) => {
    reinforcePreferredQuality(player, videoQualityRef.current);
  }, []);

  useEffect(() => {
    applyPolicy(siteMuted);
  }, [siteMuted, activeParallaxSlug, videoQuality, applyPolicy]);

  const value = useMemo(
    () => ({
      siteMuted,
      toggleMute,
      videoQuality,
      setVideoQuality,
      registerParallaxPlayer,
      registerHeroPlayer,
      setActiveParallaxSlug,
      reinforcePlaybackQuality,
    }),
    [
      siteMuted,
      toggleMute,
      videoQuality,
      setVideoQuality,
      registerParallaxPlayer,
      registerHeroPlayer,
      reinforcePlaybackQuality,
    ],
  );

  return (
    <PlaybackContext.Provider value={value}>{children}</PlaybackContext.Provider>
  );
}

export function useSitePlayback() {
  const ctx = useContext(PlaybackContext);
  if (!ctx) {
    throw new Error("useSitePlayback must be used within SitePlaybackProvider");
  }
  return ctx;
}

/** @deprecated Use useSitePlayback — alias for existing imports */
export function useSiteAudio() {
  return useSitePlayback();
}
