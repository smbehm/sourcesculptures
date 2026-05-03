import { useEffect, useMemo, useRef, useState } from "react";
import iconUrl from "@/assets/preloader-icon.svg";

/**
 * Cinematic preloader: black foggy scene, golden light fills the icon
 * bottom-to-top as the site/videos buffer, then zooms into the light.
 */
const Preloader = () => {
  const [progress, setProgress] = useState(0); // 0..100
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);
  const startedAt = useRef<number>(performance.now());
  const videoReadyRef = useRef(false);

  // Listen for the first preview video signaling ready
  useEffect(() => {
    const onReady = () => {
      videoReadyRef.current = true;
    };
    window.addEventListener("preview-video-ready", onReady);
    return () => window.removeEventListener("preview-video-ready", onReady);
  }, []);

  // Drive progress: gradual ramp from 0 → ~92% over ~7s with an ease curve
  // that lingers in the middle so the fill feels deliberate, not snappy.
  // Snaps to 100% only after the first video is ready (or 11s hard cap).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startedAt.current;
      const t = Math.min(1, elapsed / 7000);
      // ease-in-out cubic — slower start, slow middle plateau, gentle finish
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      let target = eased * 92;

      if (videoReadyRef.current && elapsed > 1500) target = 100;
      if (elapsed > 11000) target = 100;

      setProgress((p) => Math.max(p, target));

      if (target >= 100) return;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // When we hit 100, trigger zoom and unmount after the animation
  useEffect(() => {
    if (progress >= 100 && !done) {
      setDone(true);
      const t = setTimeout(() => setHidden(true), 1400);
      return () => clearTimeout(t);
    }
  }, [progress, done]);

  // Lock body scroll while showing
  useEffect(() => {
    if (hidden) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hidden]);

  if (hidden) return null;

  // Fill height, bottom-anchored
  const fillPct = Math.min(100, Math.max(0, progress));
  // Glow intensity ramps with progress
  const glow = fillPct / 100;

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden bg-black"
      style={{
        opacity: done ? 0 : 1,
        transition: "opacity 900ms ease 500ms",
        pointerEvents: done ? "none" : "auto",
      }}
      aria-label="Loading"
      role="status"
    >
      {/* Ground fog layers */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-[-20%] bottom-[-10%] h-[70%] animate-[fogDriftA_22s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(60% 50% at 30% 80%, rgba(255,255,255,0.10), transparent 70%), radial-gradient(70% 55% at 75% 90%, rgba(255,255,255,0.08), transparent 72%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute inset-x-[-30%] bottom-[-15%] h-[65%] animate-[fogDriftB_28s_ease-in-out_infinite]"
          style={{
            background:
              "radial-gradient(50% 45% at 50% 95%, rgba(255,220,160,0.10), transparent 70%), radial-gradient(40% 40% at 20% 85%, rgba(255,255,255,0.06), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Subtle grain via gradient noise stand-in */}
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            background:
              "radial-gradient(1200px 800px at 50% 60%, rgba(255,255,255,0.05), transparent 60%)",
          }}
        />
      </div>

      {/* God rays are rendered inside the icon container below */}

      {/* Center stage: zooms into the light when done */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: done ? "scale(14)" : "scale(1)",
          transformOrigin: "50% 50%",
          transition: "transform 1400ms cubic-bezier(0.7, 0, 0.84, 0)",
        }}
      >
        <div
          className="relative"
          style={{
            width: "min(38vmin, 320px)",
            aspectRatio: "565.25 / 931.8",
          }}
        >
          {/* God rays emitting from WITHIN the icon — strength follows fill */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2"
            style={{
              width: "260vmax",
              height: "260vmax",
              transform: "translate(-50%, -50%)",
              opacity: glow,
              transition: "opacity 500ms ease",
              mixBlendMode: "screen",
              background:
                "conic-gradient(from 0deg, rgba(255,200,90,0) 0deg, rgba(255,210,120,0.6) 3deg, rgba(255,200,90,0) 9deg, rgba(255,200,90,0) 26deg, rgba(255,210,120,0.5) 31deg, rgba(255,200,90,0) 38deg, rgba(255,200,90,0) 58deg, rgba(255,210,120,0.55) 64deg, rgba(255,200,90,0) 71deg, rgba(255,200,90,0) 92deg, rgba(255,210,120,0.45) 99deg, rgba(255,200,90,0) 106deg, rgba(255,200,90,0) 132deg, rgba(255,210,120,0.55) 139deg, rgba(255,200,90,0) 147deg, rgba(255,200,90,0) 172deg, rgba(255,210,120,0.5) 179deg, rgba(255,200,90,0) 187deg, rgba(255,200,90,0) 212deg, rgba(255,210,120,0.55) 219deg, rgba(255,200,90,0) 227deg, rgba(255,200,90,0) 252deg, rgba(255,210,120,0.5) 259deg, rgba(255,200,90,0) 267deg, rgba(255,200,90,0) 292deg, rgba(255,210,120,0.55) 299deg, rgba(255,200,90,0) 307deg, rgba(255,200,90,0) 332deg, rgba(255,210,120,0.6) 339deg, rgba(255,200,90,0) 347deg)",
              WebkitMaskImage:
                "radial-gradient(closest-side, black 0%, black 4%, rgba(0,0,0,0.6) 18%, transparent 70%)",
              maskImage:
                "radial-gradient(closest-side, black 0%, black 4%, rgba(0,0,0,0.6) 18%, transparent 70%)",
              animation: "raysSpin 60s linear infinite",
              filter: "blur(2px)",
            }}
          />

          {/* Soft golden halo behind icon — grows with fill */}
          <div
            className="pointer-events-none absolute inset-[-120%]"
            style={{
              background:
                "radial-gradient(50% 55% at 50% 50%, rgba(255,196,90,0.7), rgba(255,170,60,0.22) 30%, transparent 65%)",
              filter: "blur(24px)",
              opacity: 0.15 + glow * 0.85,
              transition: "opacity 400ms ease",
              mixBlendMode: "screen",
            }}
          />

          {/* Dark silhouette of the icon */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: `url(${iconUrl})`,
              maskImage: `url(${iconUrl})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              background: "#0b0b0b",
            }}
          />

          {/* Golden fill that rises from the bottom */}
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: `url(${iconUrl})`,
              maskImage: `url(${iconUrl})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              background:
                "linear-gradient(to top, #fff2c2 0%, #ffd06a 30%, #ff9a2a 70%, #ff6a00 100%)",
              clipPath: `inset(${100 - fillPct}% 0 0 0)`,
              transition: "clip-path 350ms ease-out",
              filter: `drop-shadow(0 0 ${8 + glow * 32}px rgba(255,180,80,${0.4 + glow * 0.5}))`,
            }}
          />

          {/* Bright top edge "wave" of the fill */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              WebkitMaskImage: `url(${iconUrl})`,
              maskImage: `url(${iconUrl})`,
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              background:
                "linear-gradient(to top, transparent 0%, transparent 60%, rgba(255,255,210,0.95) 78%, transparent 82%)",
              clipPath: `inset(${Math.max(0, 100 - fillPct - 4)}% 0 ${Math.max(0, fillPct - 2)}% 0)`,
              mixBlendMode: "screen",
              opacity: fillPct > 2 ? 1 : 0,
            }}
          />
        </div>
      </div>

      {/* Final flash on completion */}
      <div
        className="pointer-events-none absolute inset-0 bg-white"
        style={{
          opacity: done ? 0.85 : 0,
          transition: "opacity 700ms ease 700ms",
          mixBlendMode: "screen",
        }}
      />

      {/* Progress (a11y, hidden visually) */}
      <span className="sr-only">Loading {Math.round(fillPct)}%</span>

      <style>{`
        @keyframes fogDriftA {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(3%, -1%, 0); }
        }
        @keyframes fogDriftB {
          0%, 100% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(-3%, 1%, 0); }
        }
        @keyframes raysSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;
