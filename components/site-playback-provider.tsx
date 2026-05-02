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

export type VideoQualityTier = "hd1080" | "hd2160";

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
  /** Pass the muted state *after* toggle (same tick as the mute button click). */
  syncPlaybackAfterToggle: (muted: boolean) => void;
  /** Call when the player enters PLAYING — YouTube often applies `setPlaybackQuality` only after playback starts. */
  reinforcePlaybackQuality: (player: YouTubePlayer) => void;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function SitePlaybackProvider({ children }: { children: React.ReactNode }) {
  const [siteMuted, setSiteMuted] = useState(true);
  const [videoQuality, setVideoQuality] = useState<VideoQualityTier>("hd1080");
  const [prefsHydrated, setPrefsHydrated] = useState(false);
  const [activeParallaxSlug, setActiveParallaxSlug] = useState<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    try {
      const m = localStorage.getItem(STORAGE_MUTE);
      if (m === "0") setSiteMuted(false);
      else if (m === "1") setSiteMuted(true);
      const q = localStorage.getItem(STORAGE_QUALITY);
      if (q === "hd1080" || q === "hd2160") setVideoQuality(q);
    } catch {
      /* private mode / quota */
    }
    setPrefsHydrated(true);
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
        setVideoQuality(e.newValue);
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

  const toggleMute = useCallback(() => {
    setSiteMuted((m) => !m);
  }, []);

  const applyPolicy = useCallback(
    (muted: boolean) => {
      const q = videoQuality;
      parallaxPlayersRef.current.forEach((player, slug) => {
        try {
          const audible = !muted && slug === activeParallaxSlug;
          player.setPlaybackQuality(q);
          if (audible) {
            player.unMute();
            player.playVideo();
          } else {
            player.mute();
          }
        } catch {
          /* player may be tearing down */
        }
      });
      const hero = heroPlayerRef.current;
      try {
        if (hero) {
          hero.setPlaybackQuality(q);
          if (muted) {
            hero.mute();
          } else {
            hero.unMute();
            hero.playVideo();
          }
        }
      } catch {
        /* noop */
      }
    },
    [activeParallaxSlug, videoQuality],
  );

  const registerParallaxPlayer = useCallback(
    (slug: string, player: YouTubePlayer | null) => {
      const m = parallaxPlayersRef.current;
      if (player) m.set(slug, player);
      else m.delete(slug);
      if (player) {
        queueMicrotask(() => {
          applyPolicy(siteMuted);
        });
      }
    },
    [applyPolicy, siteMuted],
  );

  const registerHeroPlayer = useCallback(
    (player: YouTubePlayer | null) => {
      heroPlayerRef.current = player;
      if (player) {
        queueMicrotask(() => {
          applyPolicy(siteMuted);
        });
      }
    },
    [applyPolicy, siteMuted],
  );

  const reinforcePlaybackQuality = useCallback(
    (player: YouTubePlayer) => {
      try {
        player.setPlaybackQuality(videoQuality);
      } catch {
        /* noop */
      }
    },
    [videoQuality],
  );

  useEffect(() => {
    applyPolicy(siteMuted);
  }, [siteMuted, activeParallaxSlug, videoQuality, applyPolicy]);

  const syncPlaybackAfterToggle = useCallback(
    (muted: boolean) => {
      applyPolicy(muted);
    },
    [applyPolicy],
  );

  const value = useMemo(
    () => ({
      siteMuted,
      toggleMute,
      videoQuality,
      setVideoQuality,
      registerParallaxPlayer,
      registerHeroPlayer,
      setActiveParallaxSlug,
      syncPlaybackAfterToggle,
      reinforcePlaybackQuality,
    }),
    [
      siteMuted,
      toggleMute,
      videoQuality,
      setVideoQuality,
      registerParallaxPlayer,
      registerHeroPlayer,
      syncPlaybackAfterToggle,
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
