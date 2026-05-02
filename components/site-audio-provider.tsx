"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type SiteAudioContextValue = {
  /** When true, embeds use `mute=1`. Toggle via the fixed mute control (counts as user gesture to allow sound). */
  siteMuted: boolean;
  toggleMute: () => void;
};

const SiteAudioContext = createContext<SiteAudioContextValue | null>(null);

export function SiteAudioProvider({ children }: { children: React.ReactNode }) {
  const [siteMuted, setSiteMuted] = useState(true);

  const toggleMute = useCallback(() => {
    setSiteMuted((m) => !m);
  }, []);

  const value = useMemo(
    () => ({ siteMuted, toggleMute }),
    [siteMuted, toggleMute],
  );

  return (
    <SiteAudioContext.Provider value={value}>
      {children}
    </SiteAudioContext.Provider>
  );
}

export function useSiteAudio() {
  const ctx = useContext(SiteAudioContext);
  if (!ctx) {
    throw new Error("useSiteAudio must be used within SiteAudioProvider");
  }
  return ctx;
}
