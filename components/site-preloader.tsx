"use client";

import { useEffect, useState } from "react";

/*
  Preloader hides when BOTH conditions are true:
  1. Minimum display time has elapsed (so it doesn't flash on fast connections).
  2. The first YouTube player has fired onReady — meaning the YT IFrame API is
     loaded and the player is initialised. We signal this via a custom event
     dispatched from parallax-project-stack's first panel onReady handler.

  If the YT-ready event never fires (ad blocker, network error, etc.) we fall
  back to the window `load` event so the preloader doesn't hang forever.
*/

const MIN_MS = 1800;
const FALLBACK_MS = 6000; // give up waiting for YT after this long

export function SitePreloader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (prefersReduced) {
        setPhase("gone");
      } else {
        setPhase("fading");
      }
    };

    const minDelay = new Promise<void>((res) => setTimeout(res, MIN_MS));

    // Signal 1: first YT player ready (dispatched by parallax panel's onReady)
    const ytReady = new Promise<void>((res) => {
      window.addEventListener("yt-player-ready", () => res(), { once: true });
    });

    // Signal 2: window load (fallback)
    const pageLoad = new Promise<void>((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
    });

    // Hard fallback — don't block the user if YT never fires
    const hardFallback = new Promise<void>((res) =>
      setTimeout(res, FALLBACK_MS)
    );

    // Resolve on whichever content signal fires first, but always wait for minDelay
    Promise.all([
      minDelay,
      Promise.race([ytReady, pageLoad, hardFallback]),
    ]).then(finish);
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      onTransitionEnd={() => setPhase("gone")}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        opacity: phase === "fading" ? 0 : 1,
        transition: phase === "fading" ? "opacity 700ms ease-out" : "none",
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-antonio), sans-serif",
          fontSize: "11px",
          letterSpacing: "0.45em",
          color: "rgba(255, 255, 255, 0.9)",
          textTransform: "uppercase",
        }}
      >
        SOURCE
      </span>

      <div style={{ display: "flex", gap: "8px" }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.35)",
              animation: `__preloader_pulse 1.3s ease-in-out ${i * 0.22}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes __preloader_pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.75); }
          40%            { opacity: 0.9; transform: scale(1);    }
        }
      `}</style>
    </div>
  );
}
