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

function setPlayerMuted(player: YouTubePlayer, muted: boolean) {
  const p = player as unknown as {
    mute?: () => void;
    unMute?: () => void;
    playVideo?: () => void;
    setVolume?: (n: number) => void;
  };
  try {
    if (muted) {
      p.mute?.();
      return;
    }
    p.unMute?.();
    p.setVolume?.(100);
    p.playVideo?.();
  } catch {
    /* iframe may be unavailable */
  }
}

const STORAGE_MUTE = "sourcesculptures:playback:mute";

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
  reinforcePlaybackQuality: (player: YouTubePlayer) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function SitePlaybackProvider({ children }: { children: React.ReactNode }) {
  const [siteMuted, setSiteMuted] = useState(false);
  const [videoQuality, setVideoQualityState] = useState<VideoQualityTier>("hd1080");
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [activeParallaxSlug, setActiveParallaxSlug] = useState<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);
  const videoQualityRef = useRef(videoQuality);
  const siteMutedRef = useRef(siteMuted);
  /** Tracks prior `siteMuted` so we can nudge playback only when leaving muted → unmuted. */
  const prevSiteMutedRef = useRef(siteMuted);

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

  useEffect(() => {
    const sync = () => setVideoQualityState(preferredTierForViewport());
    sync();
    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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

      parallaxPlayersRef.current.forEach((player, slug) => {
        applyPreferredQuality(player, q);
        if (muted) {
          setPlayerMuted(player, true);
        } else {
          setPlayerMuted(player, slug !== activeParallaxSlug);
        }
      });

      const hero = heroPlayerRef.current;
      if (hero) {
        applyPreferredQuality(hero, q);
        setPlayerMuted(hero, muted);
      }
    },
    [activeParallaxSlug],
  );

  const toggleMute = useCallback(() => {
    setSiteMuted((prev) => !prev);
  }, []);

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

  /** Mobile Safari often needs an explicit playVideo after unmute via user gesture chain (handled upstream). */
  useEffect(() => {
    const prev = prevSiteMutedRef.current;
    prevSiteMutedRef.current = siteMuted;
    if (prev !== true || siteMuted !== false) return;

    try {
      const hero = heroPlayerRef.current;
      if (hero) {
        hero.playVideo?.();
        return;
      }
      const slug = activeParallaxSlug;
      if (slug) {
        parallaxPlayersRef.current.get(slug)?.playVideo?.();
      }
    } catch {
      /* noop */
    }
  }, [siteMuted, activeParallaxSlug]);

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
