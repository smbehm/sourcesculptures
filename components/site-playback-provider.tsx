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

/** Mobile/tablet: ask YouTube for HD; desktop: ask for 4K (best-effort per video + API). */
function preferredTierForViewport(): VideoQualityTier {
  if (typeof window === "undefined") return "hd1080";
  return window.matchMedia("(max-width: 1023px)").matches ? "hd1080" : "hd2160";
}

type PlaybackContextValue = {
  siteMuted: boolean;
  toggleMute: () => void;
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
      queueMicrotask(() => {
        if (m === "0") setSiteMuted(false);
        else if (m === "1") setSiteMuted(true);
        setPrefsHydrated(true);
      });
    } catch {
      queueMicrotask(() => setPrefsHydrated(true));
    }
  }, []);

  /** Preferred stream tier follows viewport (HD on mobile, 4K on desktop). */
  useEffect(() => {
    const sync = () => setVideoQualityState(preferredTierForViewport());
    sync();
    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Keep mute in sync across browser tabs. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_MUTE && (e.newValue === "0" || e.newValue === "1")) {
        setSiteMuted(e.newValue === "1");
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
      registerParallaxPlayer,
      registerHeroPlayer,
      setActiveParallaxSlug,
      reinforcePlaybackQuality,
    }),
    [
      siteMuted,
      toggleMute,
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
