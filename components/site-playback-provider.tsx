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
 * Mute or unmute a player (synchronous — preserves mobile gesture chains).
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
      p.playVideo?.();
      p.unMute?.();
      p.setVolume?.(100);
      window.setTimeout(() => {
        try {
          p.unMute?.();
          p.setVolume?.(100);
        } catch {
          /* noop */
        }
      }, 140);
    }
  } catch {
    /* noop — iframe may be mid-teardown */
  }
}

function setPlayerPlaybackActive(player: YouTubePlayer, active: boolean) {
  const p = player as unknown as {
    playVideo?: () => unknown;
    pauseVideo?: () => unknown;
  };
  try {
    if (active) {
      p.playVideo?.();
    } else {
      p.pauseVideo?.();
    }
  } catch {
    /* noop */
  }
}

/** Call after player ready — mobile Safari/WKWebKit often needs mute before playVideo for autoplay. */
export function kickMutedYoutubeAutoplay(player: YouTubePlayer) {
  const p = player as unknown as { mute?: () => void; playVideo?: () => void };
  try {
    p.mute?.();
    p.playVideo?.();
  } catch {
    /* noop */
  }
}

function preferredTierForViewport(): VideoQualityTier {
  if (typeof window === "undefined") return "hd1080";
  return window.matchMedia("(max-width: 1023px)").matches ? "hd1080" : "hd2160";
}

type PlaybackContextValue = {
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

  const videoQualityRef = useRef<VideoQualityTier>("hd1080");
  const activeParallaxSlugRef = useRef<string | null>(null);
  const parallaxPlayersRef = useRef<Map<string, YouTubePlayer>>(new Map());
  const heroPlayerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    videoQualityRef.current = videoQuality;
  }, [videoQuality]);

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
   * Route audio to the active parallax strip only, or unmuted hero on project pages.
   * No site-wide mute control — only spatial routing.
   */
  const applyPolicySync = useCallback(() => {
    const q = videoQualityRef.current;
    const hero = heroPlayerRef.current;
    const audibleSlug = hero ? null : activeParallaxSlugRef.current;

    parallaxPlayersRef.current.forEach((player, slug) => {
      applyPreferredQuality(player, q);
      if (audibleSlug === null) {
        setPlayerPlaybackActive(player, false);
        return;
      }
      setPlayerMuted(player, slug !== audibleSlug);
      setPlayerPlaybackActive(player, slug === audibleSlug);
    });

    if (hero) {
      applyPreferredQuality(hero, q);
      setPlayerMuted(hero, false);
    }
  }, []);

  const setActiveParallaxSlug = useCallback(
    (slug: string | null) => {
      activeParallaxSlugRef.current = slug;
      applyPolicySync();
    },
    [applyPolicySync],
  );

  const registerParallaxPlayer = useCallback(
    (slug: string, player: YouTubePlayer | null) => {
      const m = parallaxPlayersRef.current;
      if (player) {
        m.set(slug, player);
        applyPolicySync();
      } else {
        m.delete(slug);
      }
    },
    [applyPolicySync],
  );

  const registerHeroPlayer = useCallback(
    (player: YouTubePlayer | null) => {
      heroPlayerRef.current = player;
      if (player) {
        applyPolicySync();
      }
    },
    [applyPolicySync],
  );

  const reinforcePlaybackQuality = useCallback((player: YouTubePlayer) => {
    reinforcePreferredQuality(player, videoQualityRef.current);
  }, []);

  useEffect(() => {
    applyPolicySync();
  }, [videoQuality, applyPolicySync]);

  const value = useMemo(
    () => ({
      registerParallaxPlayer,
      registerHeroPlayer,
      setActiveParallaxSlug,
      reinforcePlaybackQuality,
    }),
    [
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

/** @deprecated Use useSitePlayback */
export function useSiteAudio() {
  return useSitePlayback();
}
