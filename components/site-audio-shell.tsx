"use client";

import { PlaybackRouteSync } from "@/components/playback-route-sync";
import { SitePlaybackProvider } from "@/components/site-playback-provider";

export function SiteAudioShell({ children }: { children: React.ReactNode }) {
  return (
    <SitePlaybackProvider>
      {children}
      <PlaybackRouteSync />
    </SitePlaybackProvider>
  );
}
