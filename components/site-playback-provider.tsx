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
 * Mute or unmute a player.
 * ALL calls are synchronous — no .then() chains.
 * Promise-based YT API wrappers break the iOS user-gesture chain.
 */
function setPlayerMuted(player: YouTubePlayer, muted: boolean) {
  const p = player as unknown as {
    mute?: () => unknown;
    unMute?: () => unknown;
    setVolume?: (n: number) => unknown;
    playVideo?: () => unknown;
  };
  try {
    if (muted) {
      p.mute?.();
    } else {
      p.unMute?.();
      p.setVolume?.(100);
      p.playVideo?.();
    }
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
  siteMuted: boolean;
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
  const [siteMuted, setSiteMuted] = useState(false);
  const [videoQuality, setVideoQuality] = useState<VideoQualityTier>("hd1080");

  // Refs for synchronous access inside callbacks (no stale closures)
  const siteMutedRef = useRef(false);
  const videoQualityRef = useRef<VideoQualityTier>("hd1080");
  const activeParallaxSlugRef = useRef<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    siteMutedRef.current = siteMuted;
  }, [siteMuted]);

  useEffect(() => {
    videoQualityRef.current = videoQuality;
  }, [videoQuality]);

  // Hydrate mute preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MUTE);
      if (stored === "1") {
        siteMutedRef.current = true;
        setSiteMuted(true);
      } else if (stored === "0") {
        siteMutedRef.current = false;
        setSiteMuted(false);
      }
    } catch {
      /* noop */
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_MUTE, siteMuted ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [siteMuted]);

  // Sync mute across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_MUTE) return;
      if (e.newValue === "1") {
        siteMutedRef.current = true;
        setSiteMuted(true);
      } else if (e.newValue === "0") {
        siteMutedRef.current = false;
        setSiteMuted(false);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

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
   * Safe to call from within a user-gesture event handler on mobile.
   */
  const applyPolicySync = useCallback((muted: boolean) => {
    const q = videoQualityRef.current;
    const hero = heroPlayerRef.current;
    const audibleSlug = hero ? null : activeParallaxSlugRef.current;

    parallaxPlayersRef.current.forEach((player, slug) => {
      applyPreferredQuality(player, q);
      setPlayerMuted(player, muted || slug !== audibleSlug);
    });

    if (hero) {
      applyPreferredQuality(hero, q);
      setPlayerMuted(hero, muted);
    }
  }, []);

  /**
   * Toggle mute.
   * applyPolicySync is called SYNCHRONOUSLY before any async work —
   * this preserves the iOS/Android user-gesture activation window.
   */
  const toggleMute = useCallback(() => {
    const next = !siteMutedRef.current;
    siteMutedRef.current = next;
    // Apply policy synchronously while still in the gesture handler
    applyPolicySync(next);
    // Then schedule the React state update (just for re-render)
    setSiteMuted(next);
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
    ]
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

/** @deprecated Use useSitePlayback */
export function useSiteAudio() {
  return useSitePlayback();
}
