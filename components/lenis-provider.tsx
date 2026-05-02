"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";
import { type PropsWithChildren, useEffect, useState } from "react";

const options: LenisOptions = {
  lerp: 0.09,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  syncTouch: true,
  syncTouchLerp: 0.075,
  autoResize: true,
};

/**
 * Root Lenis instance — matches the “weighted” scroll Framer sites often ship.
 * Gated until mount so SSR markup matches the first paint (no hydration drift).
 */
export function LenisProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  /** Lenis uses transforms while syncing touch scroll — causes visible seams/gaps on phones. */
  const [nativeScrollOnly, setNativeScrollOnly] = useState(true);

  useEffect(() => {
    setMounted(true);
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const mq = window.matchMedia("(min-width: 1024px)");
    const syncScrollMode = () => setNativeScrollOnly(!mq.matches);
    syncScrollMode();
    mq.addEventListener("change", syncScrollMode);
    return () => mq.removeEventListener("change", syncScrollMode);
  }, []);

  if (!mounted || reduceMotion || nativeScrollOnly) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
