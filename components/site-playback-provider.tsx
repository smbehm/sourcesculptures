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

/**
 * @param unlockAudio - True only inside a real user gesture (mute toggle, or first
 *   pointer/touch after hydration when the site is not muted). Calling unMute outside
 *   that breaks muted autoplay on iOS/Android (playback can stop).
 */
function setPlayerMuted(
  player: YouTubePlayer,
  muted: boolean,
  unlockAudio = false,
) {
  const p = player as unknown as {
    mute?: () => unknown;
    unMute?: () => unknown;
    playVideo?: () => unknown;
    setVolume?: (n: number) => unknown;
  };
  if (muted) {
    try {
      p.mute?.();
    } catch {
      /* noop */
    }
    return;
  }
  if (!unlockAudio) {
    try {
      p.playVideo?.();
    } catch {
      /* noop */
    }
    return;
  }
  try {
    p.unMute?.();
  } catch {
    /* noop */
  }
  try {
    p.setVolume?.(100);
  } catch {
    /* noop */
  }
  try {
    p.playVideo?.();
  } catch {
    /* noop */
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

  const activeParallaxSlugRef = useRef<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);
  const videoQualityRef = useRef(videoQuality);
  const siteMutedRef = useRef(siteMuted);
  /** After this runs once, passive policy handles mute routing without needing another gesture unlock. */
  const initialGestureAudioUnlockRef = useRef(false);

  useLayoutEffect(() => {
    videoQualityRef.current = videoQuality;
    siteMutedRef.current = siteMuted;
  }, [videoQuality, siteMuted]);

  const applyPolicySync = useCallback(
    (muted: boolean, options?: { allowAudioUnlock?: boolean }) => {
      const q = videoQualityRef.current;
      const activeSlug = activeParallaxSlugRef.current;
      const unlock = options?.allowAudioUnlock ?? false;

      parallaxPlayersRef.current.forEach((player, slug) => {
        applyPreferredQuality(player, q);
        if (muted) {
          setPlayerMuted(player, true);
        } else {
          const silent = slug !== activeSlug;
          setPlayerMuted(player, silent, !silent && unlock);
        }
      });

      const hero = heroPlayerRef.current;
      if (hero) {
        applyPreferredQuality(hero, q);
        setPlayerMuted(hero, muted, !muted && unlock);
      }
    },
    [],
  );

  const setActiveParallaxSlug = useCallback((slug: string | null) => {
    activeParallaxSlugRef.current = slug;
    applyPolicySync(siteMutedRef.current);
  }, [applyPolicySync]);

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

  /**
   * First pointer or touch after prefs load — if the user wants sound (!siteMuted),
   * unlock iframe audio in the same gesture so mobile users don’t need the mute control only for that.
   */
  useEffect(() => {
    if (!prefsHydrated) return;

    const unlockFromGesture = () => {
      if (initialGestureAudioUnlockRef.current) return;
      initialGestureAudioUnlockRef.current = true;
      if (siteMutedRef.current) return;
      applyPolicySync(false, { allowAudioUnlock: true });
    };

    window.addEventListener("pointerdown", unlockFromGesture, true);
    window.addEventListener("touchstart", unlockFromGesture, {
      capture: true,
      passive: true,
    });
    return () => {
      window.removeEventListener("pointerdown", unlockFromGesture, true);
      window.removeEventListener("touchstart", unlockFromGesture, {
        capture: true,
      });
    };
  }, [applyPolicySync, prefsHydrated]);

  const toggleMute = useCallback(() => {
    setSiteMuted((prev) => {
      const next = !prev;
      siteMutedRef.current = next;
      applyPolicySync(next, { allowAudioUnlock: true });
      return next;
    });
  }, [applyPolicySync]);

  const registerParallaxPlayer = useCallback(
    (slug: string, player: YouTubePlayer | null) => {
      const m = parallaxPlayersRef.current;
      if (player) m.set(slug, player);
      else m.delete(slug);
      if (player) {
        applyPolicySync(siteMutedRef.current);
      }
    },
    [applyPolicySync],
  );

  const registerHeroPlayer = useCallback(
    (player: YouTubePlayer | null) => {
      heroPlayerRef.current = player;
      if (player) {
        applyPolicySync(siteMutedRef.current);
      }
    },
    [applyPolicySync],
  );

  const reinforcePlaybackQuality = useCallback((player: YouTubePlayer) => {
    reinforcePreferredQuality(player, videoQualityRef.current);
  }, []);

  /** Hydration, tab sync, and quality tier changes (outside the mute button gesture chain). */
  useEffect(() => {
    applyPolicySync(siteMuted);
  }, [siteMuted, videoQuality, applyPolicySync]);

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
      setActiveParallaxSlug,
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
