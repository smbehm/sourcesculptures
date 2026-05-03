import { create } from "zustand";

/**
 * Global mute preference for all site media (YouTube embeds + native &lt;video&gt;).
 * `physicalSiteMuted` is the actual element mute state: stays true until the user
 * unlocks audio (gesture or mute control) while `siteMuted` is false — required for
 * mobile autoplay.
 *
 * Persisted manually in SitePlaybackProvider to keep `localStorage` values `"1"`/`"0"`
 * for cross-tab `storage` events.
 */
export type PlaybackMuteState = {
  siteMuted: boolean;
  /** Effective mute on native &lt;video&gt; (and mirrors autoplay policy). */
  physicalSiteMuted: boolean;
  setSiteMuted: (muted: boolean) => void;
  toggleSiteMuted: () => void;
  setPhysicalSiteMuted: (muted: boolean) => void;
};

export const usePlaybackMuteStore = create<PlaybackMuteState>()((set, get) => ({
  siteMuted: false,
  physicalSiteMuted: true,
  setSiteMuted: (muted) => set({ siteMuted: muted }),
  toggleSiteMuted: () => set({ siteMuted: !get().siteMuted }),
  setPhysicalSiteMuted: (muted) => set({ physicalSiteMuted: muted }),
}));
