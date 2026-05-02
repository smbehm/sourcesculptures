"use client";

import { SiteAudioProvider } from "@/components/site-audio-provider";
import { GlobalMuteButton } from "@/components/global-mute-button";

export function SiteAudioShell({ children }: { children: React.ReactNode }) {
  return (
    <SiteAudioProvider>
      {children}
      <GlobalMuteButton />
    </SiteAudioProvider>
  );
}
