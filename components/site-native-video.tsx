"use client";

import {
  type VideoHTMLAttributes,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import { registerSiteVideo } from "@/lib/native-video-registry";
import { usePlaybackMuteStore } from "@/lib/playback-mute-store";
import { safeVideoPlay } from "@/lib/safe-media-play";

export type SiteNativeVideoProps = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  "muted" | "autoPlay" | "playsInline" | "loop" | "preload"
> & {
  /** When true, call play() after mount (still wrapped in .catch() internally). */
  playOnMount?: boolean;
};

/**
 * Native &lt;video&gt; with autoplay policy defaults and sync to the global mute store.
 * Prefer this over raw &lt;video&gt; so attributes stay consistent site-wide.
 * `muted` follows `physicalSiteMuted` (stays true until audio unlock when unmuted).
 */
export const SiteNativeVideo = forwardRef<HTMLVideoElement, SiteNativeVideoProps>(
  function SiteNativeVideo({ playOnMount, className, ...rest }, ref) {
    const innerRef = useRef<HTMLVideoElement | null>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLVideoElement, []);

    const physicalSiteMuted = usePlaybackMuteStore((s) => s.physicalSiteMuted);

    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      return registerSiteVideo(el);
    }, []);

    useEffect(() => {
      if (!playOnMount) return;
      const el = innerRef.current;
      if (!el) return;
      safeVideoPlay(el);
    }, [playOnMount]);

    return (
      <video
        ref={innerRef}
        className={className}
        autoPlay
        muted={physicalSiteMuted}
        playsInline
        loop
        preload="auto"
        {...rest}
      />
    );
  },
);
