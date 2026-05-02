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
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function SitePlaybackProvider({ children }: { children: React.ReactNode }) {
  const [siteMuted, setSiteMuted] = useState(true);
  const [videoQuality, setVideoQuality] = useState<VideoQualityTier>("hd1080");
  const [activeParallaxSlug, setActiveParallaxSlug] = useState<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);

  const registerParallaxPlayer = useCallback((slug: string, player: YouTubePlayer | null) => {
    const m = parallaxPlayersRef.current;
    if (player) m.set(slug, player);
    else m.delete(slug);
  }, []);

  const registerHeroPlayer = useCallback((player: YouTubePlayer | null) => {
    heroPlayerRef.current = player;
  }, []);

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
    }),
    [
      siteMuted,
      toggleMute,
      videoQuality,
      setVideoQuality,
      registerParallaxPlayer,
      registerHeroPlayer,
      syncPlaybackAfterToggle,
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
