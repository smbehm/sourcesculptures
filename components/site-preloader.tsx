"use client";

import { useEffect, useState } from "react";

export function SitePreloader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "gone">("visible");

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const minDelay = new Promise<void>((res) => setTimeout(res, 1400));
    /** If `load` never fires (blocked subresource, extension, etc.), don't block the whole site. */
    const pageLoad = new Promise<void>((res) => {
      if (document.readyState === "complete") {
        res();
        return;
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        res();
      };
      window.addEventListener("load", finish, { once: true });
      window.setTimeout(finish, 12_000);
    });

    Promise.all([minDelay, pageLoad]).then(() => {
      if (prefersReduced) {
        setPhase("gone");
      } else {
        setPhase("fading");
      }
    });
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
