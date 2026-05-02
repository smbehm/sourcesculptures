"use client";

import { GlobalPlaybackBar } from "@/components/global-playback-bar";
import { SitePlaybackProvider } from "@/components/site-playback-provider";

export function SiteAudioShell({ children }: { children: React.ReactNode }) {
  return (
    <SitePlaybackProvider>
      {children}
      <GlobalPlaybackBar />
    </SitePlaybackProvider>
  );
}
