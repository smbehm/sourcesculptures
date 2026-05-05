import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface SoundContextValue {
  muted: boolean;
  toggle: () => void;
}

const SoundContext = createContext<SoundContextValue>({ muted: true, toggle: () => {} });

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [muted, setMuted] = useState(true);
  const toggle = useCallback(() => setMuted((m) => !m), []);
  return <SoundContext.Provider value={{ muted, toggle }}>{children}</SoundContext.Provider>;
};

export const useSound = () => useContext(SoundContext);
