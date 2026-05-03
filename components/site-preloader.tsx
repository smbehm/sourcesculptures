"use client";

import { useCallback, useEffect, useState } from "react";

type Phase = "loading" | "fadeOut" | "gone";

export function SitePreloader() {
  const [phase, setPhase] = useState<Phase>("loading");

  useEffect(() => {
    const loadPromise = new Promise<void>((resolve) => {
      if (typeof document === "undefined") {
        resolve();
        return;
      }
      if (document.readyState === "complete") {
        resolve();
        return;
      }
      window.addEventListener("load", () => resolve(), { once: true });
    });

    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 1200));

    let cancelled = false;
    Promise.all([loadPromise, minDelay]).then(() => {
      if (cancelled) return;
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setPhase("gone");
      } else {
        setPhase("fadeOut");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const onTransitionEnd = useCallback((e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "opacity") return;
    setPhase((p) => (p === "fadeOut" ? "gone" : p));
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      suppressHydrationWarning
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black transition-opacity duration-[600ms] ease-out ${
        phase === "fadeOut" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onTransitionEnd={onTransitionEnd}
      aria-hidden
    >
      <p className="font-display text-xs uppercase tracking-widest text-white">
        SOURCE
      </p>
      <div className="mt-6 flex gap-2" aria-hidden>
        <span className="site-preloader-dot inline-block h-1.5 w-1.5 rounded-full bg-white/75" />
        <span className="site-preloader-dot inline-block h-1.5 w-1.5 rounded-full bg-white/75" />
        <span className="site-preloader-dot inline-block h-1.5 w-1.5 rounded-full bg-white/75" />
      </div>
    </div>
  );
}
