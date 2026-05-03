import { useEffect, useMemo, useRef, useState } from "react";

const ICON_PATH = "M561.59,0l3.66.26v1.05c-10.54,11.11-22.9,19.08-29.54,34.25-7.92,18.06-9.66,39.86-23.79,51.5-14.3,11.79-34.02,23.13-45.49,37.39-10.96,13.63-21.44,27.97-35.82,38.17-14.79,10.49-33.94,16.45-49.41,26.14-16.28,10.2-30.78,24.24-42.62,38.96-7.15,8.9-15.52,16.1-20.39,27.45-7.49,17.45-9.3,37.97-12.81,59.61-2.47,15.22.66,36.02,3.14,48.89,3.03,15.75,4.04,30.54,8.37,44.45,7.5,24.08,17.4,45.31,23.79,70.85,8.46,33.79,6.32,73.56,13.86,108.24,6.9,31.75,13.21,62.04,20.92,93.07,7.64,30.76,12.82,61.76,20.39,91.51,8.7,34.18,15.5,81.31,8.63,122.62-1.56,9.36-.9,32.96-6.27,37.39h-1.05c-8.4-11.69-10.98-28.26-15.16-44.45-2.82-10.9-5.61-22.37-8.1-33.99-1.31-9.93-2.61-19.87-3.92-29.8-1.66-21.09-3.31-42.18-4.97-63.27-9.89-58.49-24.26-111.27-40.52-163.4-7.54-24.16-14.22-47.73-23.01-70.07-1.46-3.7-7.16-21.37-10.72-19.35-6.27,3.19-7.51,14.58-9.41,22.22-5.86,23.59-7.36,49.88-12.55,73.73-9.32,42.83-12.93,88.6-20.13,133.34-3.22,20,.17,44.32-3.66,63.79-4.35,22.12-11.01,41.76-17.26,61.96-4.97,16.07-8.29,38.06-16.47,51.24h-1.83c-5.17-9.95-5.87-23.66-8.37-36.34-3.34-16.97-7.63-42.8-4.18-62.49,6.5-37.12,18.64-68.59,28.24-103.27,5.2-18.79,5.68-39.31,9.15-60.92.52-11.94,1.05-23.88,1.57-35.82,1.05-21.44,2.09-42.88,3.14-64.32.61-7.23,1.22-14.47,1.83-21.7,2.18-17.25,4.36-34.51,6.54-51.77,1.05-13.42,2.09-26.84,3.14-40.26,4.26-23.83,9.65-44.46,15.16-66.67,2.76-11.14,3.36-22.35,5.49-34.25,2.73-15.22,3.36-35.2.52-50.72l-3.4-21.96c-5.21-17.34-41.15-16.79-60.92-20.92-8.29-1.73-17.12-2.88-24.58-5.75-17.17-6.61-32.93-16.24-47.84-25.62-14.39-9.05-29.37-21.64-48.37-25.36-12.63-2.48-22.99,4.21-32.94,6.54-20.1,4.71-48.57-3.55-53.6-17.52,2.35-6.27,11.03-7.5,18.04-9.15,18.18-4.27,52.34-5.23,71.37-1.05,8.97,1.97,18.11,4.01,25.1,8.1,9.67,6.71,19.35,13.42,29.02,20.13,11.65,7.14,23.51,14.55,36.34,20.13,11.24,4.9,23.32,8.19,35.56,12.03,13.36,4.19,38.58,14.53,55.69,7.32,15.66-6.6,22.92-27.85,16.47-49.67-6.03-20.4-16.58-35.82-24.05-54.9-3.17-8.09-6.96-20.03-4.97-31.9,6.74-40.24,31.98-55.15,65.62-68.5,7.94-3.15,32.27-15.7,40.26-14.12,7.44,9.99,6.72,38.64,2.88,52.29-10.61,37.7-38.1,58.05-51.77,92.29-3.82,9.58-10.87,28.3-8.63,41.57,1.22,7.23,0,16.14,6.01,18.3,6.31,2.57,15.58-7.07,18.56-9.67,14.63-12.76,27.57-26.18,44.97-36.34,14.21-8.3,30.52-13.35,42.88-23.27,4.74-3.8,8.34-9.5,12.03-14.38,7.14-9.46,15.39-19.52,24.84-26.67,13.82-10.45,34.05-17.27,44.45-31.11,14-18.64-11.21-21.72-8.37-34.25,1.7-7.51,10.38-12.78,15.95-16.73,9.76-6.92,19.98-13.42,31.9-18.3,7.15-2.27,14.29-4.53,21.44-6.8Z";

/**
 * Cinematic preloader: black foggy scene, golden light fills the icon
 * bottom-to-top as the site/videos buffer, then zooms into the light.
 */
const isIOS = () =>
  typeof navigator !== "undefined" &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1));

const Preloader = () => {
  const [progress, setProgress] = useState(0); // 0..100
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [needsTap, setNeedsTap] = useState(false); // iOS gesture gate
  const startedAt = useRef<number>(performance.now());
  const videoReadyRef = useRef(false);
  const ios = useRef(isIOS());

  // Listen for the first preview video signaling ready
  useEffect(() => {
    const onReady = () => {
      videoReadyRef.current = true;
    };
    window.addEventListener("preview-video-ready", onReady);
    return () => window.removeEventListener("preview-video-ready", onReady);
  }, []);

  // Drive progress
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - startedAt.current;
      const t = Math.min(1, elapsed / 7000);
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

  // When we hit 100: on iOS wait for a tap to satisfy autoplay gesture; otherwise auto-dismiss.
  useEffect(() => {
    if (progress >= 100 && !done && !needsTap) {
      if (ios.current) {
        setNeedsTap(true);
        return;
      }
      setDone(true);
      const t = setTimeout(() => setHidden(true), 1400);
      return () => clearTimeout(t);
    }
  }, [progress, done, needsTap]);

  const handleEnter = () => {
    if (!needsTap || done) return;
    // Synchronously dispatch a gesture event so video iframes can autoplay
    try {
      window.dispatchEvent(new Event("preloader-gesture"));
    } catch { /* noop */ }
    setDone(true);
    setTimeout(() => setHidden(true), 1400);
  };


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


  // ─── Sundial geometry ────────────────────────────────────────────────────
  const sundial = useMemo(() => {
    const r = 44;
    // Build SVG paths for tick marks
    const ticks = Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const inner = i % 6 === 0 ? r - 9 : r - 5;
      const outer = r - 1;
      return {
        x1: 50 + Math.cos(a) * inner,
        y1: 50 + Math.sin(a) * inner,
        x2: 50 + Math.cos(a) * outer,
        y2: 50 + Math.sin(a) * outer,
        major: i % 6 === 0,
      };
    });
    return { r, ticks };
  }, []);

  const dialAngle = (fillPct / 100) * 360 - 90; // start at top

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
              width: "140vmax",
              height: "140vmax",
              transform: "translate(-50%, -50%)",
              opacity: glow,
              transition: "opacity 500ms ease",
              mixBlendMode: "screen",
              willChange: "transform",
              background:
                "conic-gradient(from 0deg, rgba(255,200,90,0) 0deg, rgba(255,210,120,0.6) 3deg, rgba(255,200,90,0) 9deg, rgba(255,200,90,0) 26deg, rgba(255,210,120,0.5) 31deg, rgba(255,200,90,0) 38deg, rgba(255,200,90,0) 58deg, rgba(255,210,120,0.55) 64deg, rgba(255,200,90,0) 71deg, rgba(255,200,90,0) 92deg, rgba(255,210,120,0.45) 99deg, rgba(255,200,90,0) 106deg, rgba(255,200,90,0) 132deg, rgba(255,210,120,0.55) 139deg, rgba(255,200,90,0) 147deg, rgba(255,200,90,0) 172deg, rgba(255,210,120,0.5) 179deg, rgba(255,200,90,0) 187deg, rgba(255,200,90,0) 212deg, rgba(255,210,120,0.55) 219deg, rgba(255,200,90,0) 227deg, rgba(255,200,90,0) 252deg, rgba(255,210,120,0.5) 259deg, rgba(255,200,90,0) 267deg, rgba(255,200,90,0) 292deg, rgba(255,210,120,0.55) 299deg, rgba(255,200,90,0) 307deg, rgba(255,200,90,0) 332deg, rgba(255,210,120,0.6) 339deg, rgba(255,200,90,0) 347deg)",
              WebkitMaskImage:
                "radial-gradient(closest-side, black 0%, black 4%, rgba(0,0,0,0.6) 18%, transparent 70%)",
              maskImage:
                "radial-gradient(closest-side, black 0%, black 4%, rgba(0,0,0,0.6) 18%, transparent 70%)",
              animation: "raysSpin 90s linear infinite",
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

          {/* Inline SVG icon with rising golden fill (mobile-safe) */}
          <svg
            viewBox="0 0 565.25 931.8"
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
            style={{
              filter: `drop-shadow(0 0 ${8 + glow * 32}px rgba(255,180,80,${0.4 + glow * 0.5}))`,
            }}
          >
            <defs>
              <linearGradient id="goldFill" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#fff2c2" />
                <stop offset="30%" stopColor="#ffd06a" />
                <stop offset="70%" stopColor="#ff9a2a" />
                <stop offset="100%" stopColor="#ff6a00" />
              </linearGradient>
              <clipPath id="riseClip">
                <rect
                  x="0"
                  y={931.8 * (1 - fillPct / 100)}
                  width="565.25"
                  height={931.8 * (fillPct / 100)}
                  style={{ transition: "y 350ms ease-out, height 350ms ease-out" } as React.CSSProperties}
                />
              </clipPath>
            </defs>
            {/* Dark silhouette */}
            <path d={ICON_PATH} fill="#0b0b0b" fillRule="evenodd" />
            {/* Rising golden fill */}
            <g clipPath="url(#riseClip)">
              <path d={ICON_PATH} fill="url(#goldFill)" fillRule="evenodd" />
            </g>
            {/* Bright top edge wave */}
            {fillPct > 2 && fillPct < 100 && (
              <g
                clipPath="url(#riseClip)"
                style={{ mixBlendMode: "screen" } as React.CSSProperties}
              >
                <rect
                  x="0"
                  y={931.8 * (1 - fillPct / 100)}
                  width="565.25"
                  height="14"
                  fill="rgba(255,255,210,0.95)"
                  style={{ transition: "y 350ms ease-out" } as React.CSSProperties}
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Sundial percentage */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: "8vh",
          opacity: done ? 0 : 0.95,
          transition: "opacity 500ms ease",
        }}
      >
        <div className="relative" style={{ width: 120, height: 150 }}>
          <svg viewBox="0 0 100 100" width={120} height={120}>
            <defs>
              <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,200,100,0.35)" />
                <stop offset="70%" stopColor="rgba(255,200,100,0)" />
              </radialGradient>
              <linearGradient id="gnomon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff2c2" />
                <stop offset="100%" stopColor="#ff8a1a" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="48" fill="url(#dialGlow)" opacity={0.4 + glow * 0.6} />
            <circle cx="50" cy="50" r={sundial.r} fill="none" stroke="rgba(255,210,140,0.35)" strokeWidth="0.6" />
            <circle cx="50" cy="50" r={sundial.r - 0.5} fill="rgba(0,0,0,0.35)" />
            {sundial.ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                stroke={t.major ? "rgba(255,220,160,0.95)" : "rgba(255,220,160,0.5)"}
                strokeWidth={t.major ? 0.8 : 0.4}
                strokeLinecap="round"
              />
            ))}
            <circle
              cx="50" cy="50" r={sundial.r - 3}
              fill="none"
              stroke="rgba(255,180,80,0.9)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * (sundial.r - 3)}
              strokeDashoffset={2 * Math.PI * (sundial.r - 3) * (1 - fillPct / 100)}
              transform="rotate(-90 50 50)"
              style={{ filter: "drop-shadow(0 0 2px rgba(255,180,80,0.9))" }}
            />
            <g transform={`rotate(${dialAngle + 90} 50 50)`}>
              <line x1="50" y1="50" x2="50" y2={50 - sundial.r + 4}
                stroke="url(#gnomon)" strokeWidth="1.2" strokeLinecap="round"
                style={{ filter: "drop-shadow(0 0 3px rgba(255,180,80,0.9))" }} />
              <circle cx="50" cy={50 - sundial.r + 4} r="2.2" fill="#ffe9a8"
                style={{ filter: "drop-shadow(0 0 5px rgba(255,210,120,1))" }} />
            </g>
            <circle cx="50" cy="50" r="1.6" fill="#ffd58a" />
          </svg>
          <div
            className="absolute left-0 right-0 text-center font-display tracking-[0.32em] text-[11px]"
            style={{
              top: 124,
              color: "rgba(255,220,170,0.92)",
              textShadow: "0 0 10px rgba(255,180,80,0.5)",
            }}
          >
            {String(Math.round(fillPct)).padStart(3, "0")}%
          </div>
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
