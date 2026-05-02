"use client";

import type { LenisOptions } from "lenis";
import { ReactLenis } from "lenis/react";
import { type PropsWithChildren, useEffect, useState } from "react";

/**
 * Up to Tailwind `lg` — phones and tablets use native scroll.
 * Lenis `syncTouch` fights touch momentum (especially iOS); desktop keeps smooth wheel.
 */
const TOUCH_VIEWPORT_MAX_PX = 1023;

const options: LenisOptions = {
  lerp: 0.09,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  /** Only used on wide desktop viewports where Lenis is enabled. */
  syncTouch: true,
  syncTouchLerp: 0.075,
  autoResize: true,
};

/**
 * Root Lenis instance — matches the “weighted” scroll Framer sites often ship.
 * Gated until mount so SSR markup matches the first paint (no hydration drift).
 *
 * On narrow viewports we skip Lenis entirely so touch scrolling stays native
 * (rubber-banding, URL bar collapse, and scroll chaining work as users expect).
 */
export function LenisProvider({ children }: PropsWithChildren) {
  const [mounted, setMounted] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [useNativeScroll, setUseNativeScroll] = useState(true);

  useEffect(() => {
    setMounted(true);
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    const mq = window.matchMedia(`(max-width: ${TOUCH_VIEWPORT_MAX_PX}px)`);
    const sync = () => setUseNativeScroll(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  if (!mounted || reduceMotion || useNativeScroll) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={options}>
      {children}
    </ReactLenis>
  );
}
