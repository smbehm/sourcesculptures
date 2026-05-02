"use client";

import { GlobalPlaybackBar } from "@/components/global-playback-bar";
import { PlaybackRouteSync } from "@/components/playback-route-sync";
import { SitePlaybackProvider } from "@/components/site-playback-provider";

/** Playback bar stays outside Lenis so `position:fixed` and hit-testing are not broken by scroll transforms. */
export function SiteAudioShell({ children }: { children: React.ReactNode }) {
  return (
    <SitePlaybackProvider>
      {children}
      <PlaybackRouteSync />
      <GlobalPlaybackBar />
    </SitePlaybackProvider>
  );
}
