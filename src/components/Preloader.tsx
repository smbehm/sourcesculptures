import { useEffect, useMemo, useRef, useState } from "react";

const ICON_PATH = "M561.59,0l3.66.26v1.05c-10.54,11.11-22.9,19.08-29.54,34.25-7.92,18.06-9.66,39.86-23.79,51.5-14.3,11.79-34.02,23.13-45.49,37.39-10.96,13.63-21.44,27.97-35.82,38.17-14.79,10.49-33.94,16.45-49.41,26.14-16.28,10.2-30.78,24.24-42.62,38.96-7.15,8.9-15.52,16.1-20.39,27.45-7.49,17.45-9.3,37.97-12.81,59.61-2.47,15.22.66,36.02,3.14,48.89,3.03,15.75,4.04,30.54,8.37,44.45,7.5,24.08,17.4,45.31,23.79,70.85,8.46,33.79,6.32,73.56,13.86,108.24,6.9,31.75,13.21,62.04,20.92,93.07,7.64,30.76,12.82,61.76,20.39,91.51,8.7,34.18,15.5,81.31,8.63,122.62-1.56,9.36-.9,32.96-6.27,37.39h-1.05c-8.4-11.69-10.98-28.26-15.16-44.45-2.82-10.9-5.61-22.37-8.1-33.99-1.31-9.93-2.61-19.87-3.92-29.8-1.66-21.09-3.31-42.18-4.97-63.27-9.89-58.49-24.26-111.27-40.52-163.4-7.54-24.16-14.22-47.73-23.01-70.07-1.46-3.7-7.16-21.37-10.72-19.35-6.27,3.19-7.51,14.58-9.41,22.22-5.86,23.59-7.36,49.88-12.55,73.73-9.32,42.83-12.93,88.6-20.13,133.34-3.22,20,.17,44.32-3.66,63.79-4.35,22.12-11.01,41.76-17.26,61.96-4.97,16.07-8.29,38.06-16.47,51.24h-1.83c-5.17-9.95-5.87-23.66-8.37-36.34-3.34-16.97-7.63-42.8-4.18-62.49,6.5-37.12,18.64-68.59,28.24-103.27,5.2-18.79,5.68-39.31,9.15-60.92.52-11.94,1.05-23.88,1.57-35.82,1.05-21.44,2.09-42.88,3.14-64.32.61-7.23,1.22-14.47,1.83-21.7,2.18-17.25,4.36-34.51,6.54-51.77,1.05-13.42,2.09-26.84,3.14-40.26,4.26-23.83,9.65-44.46,15.16-66.67,2.76-11.14,3.36-22.35,5.49-34.25,2.73-15.22,3.36-35.2.52-50.72l-3.4-21.96c-5.21-17.34-41.15-16.79-60.92-20.92-8.29-1.73-17.12-2.88-24.58-5.75-17.17-6.61-32.93-16.24-47.84-25.62-14.39-9.05-29.37-21.64-48.37-25.36-12.63-2.48-22.99,4.21-32.94,6.54-20.1,4.71-48.57-3.55-53.6-17.52,2.35-6.27,11.03-7.5,18.04-9.15,18.18-4.27,52.34-5.23,71.37-1.05,8.97,1.97,18.11,4.01,25.1,8.1,9.67,6.71,19.35,13.42,29.02,20.13,11.65,7.14,23.51,14.55,36.34,20.13,11.24,4.9,23.32,8.19,35.56,12.03,13.36,4.19,38.58,14.53,55.69,7.32,15.66-6.6,22.92-27.85,16.47-49.67-6.03-20.4-16.58-35.82-24.05-54.9-3.17-8.09-6.96-20.03-4.97-31.9,6.74-40.24,31.98-55.15,65.62-68.5,7.94-3.15,32.27-15.7,40.26-14.12,7.44,9.99,6.72,38.64,2.88,52.29-10.61,37.7-38.1,58.05-51.77,92.29-3.82,9.58-10.87,28.3-8.63,41.57,1.22,7.23,0,16.14,6.01,18.3,6.31,2.57,15.58-7.07,18.56-9.67,14.63-12.76,27.57-26.18,44.97-36.34,14.21-8.3,30.52-13.35,42.88-23.27,4.74-3.8,8.34-9.5,12.03-14.38,7.14-9.46,15.39-19.52,24.84-26.67,13.82-10.45,34.05-17.27,44.45-31.11,14-18.64-11.21-21.72-8.37-34.25,1.7-7.51,10.38-12.78,15.95-16.73,9.76-6.92,19.98-13.42,31.9-18.3,7.15-2.27,14.29-4.53,21.44-6.8Z";

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

  // ─── Mouse-reactive embers / sparks ─────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });
  const progressRef = useRef(0);
  progressRef.current = fillPct;

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };
    const onLeave = () => { mouseRef.current.active = false; };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; kind: 0 | 1; hue: number };
    const particles: P[] = [];

    const spawnEmber = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const x = cx + (Math.random() - 0.5) * 320;
      const y = cy + 20 + Math.random() * 240;
      particles.push({
        x: x * dpr,
        y: y * dpr,
        vx: (Math.random() - 0.5) * 0.18 * dpr,
        vy: -(0.15 + Math.random() * 0.45) * dpr,
        life: 0,
        max: 240 + Math.random() * 320,
        size: (0.18 + Math.random() * 0.45) * dpr,
        kind: 0,
        hue: 30 + Math.random() * 25,
      });
    };
    const spawnSpark = () => {
      const x = Math.random() * window.innerWidth;
      const y = window.innerHeight * (0.05 + Math.random() * 0.9);
      particles.push({
        x: x * dpr,
        y: y * dpr,
        vx: (Math.random() - 0.5) * 0.12 * dpr,
        vy: -(0.03 + Math.random() * 0.18) * dpr,
        life: 0,
        max: 320 + Math.random() * 360,
        size: (0.14 + Math.random() * 0.36) * dpr,
        kind: 1,
        hue: 38 + Math.random() * 18,
      });
    };

    // Pre-seed thousands of tiny particles so the field looks dense immediately
    for (let i = 0; i < 1800; i++) spawnSpark();
    for (let i = 0; i < 600; i++) spawnEmber();

    let raf = 0;
    const loop = () => {
      const intensity = 0.4 + progressRef.current / 100;
      const emberCount = Math.round(14 * intensity);
      const sparkCount = Math.round(28 * intensity);
      for (let i = 0; i < emberCount; i++) spawnEmber();
      for (let i = 0; i < sparkCount; i++) spawnSpark();

      // Soft trail fade
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";

      const mx = mouseRef.current.x * dpr;
      const my = mouseRef.current.y * dpr;
      const mActive = mouseRef.current.active;
      const influenceR = 180 * dpr;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        if (p.life > p.max) { particles.splice(i, 1); continue; }

        if (mActive) {
          const dx = p.x - mx;
          const dy = p.y - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < influenceR * influenceR && d2 > 1) {
            const d = Math.sqrt(d2);
            const f = (1 - d / influenceR) * 0.5;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f * 0.8;
            p.vx += (-dy / d) * f * 0.12;
            p.vy += (dx / d) * f * 0.12;
          }
        }

        p.vx += Math.sin((p.life + p.x) * 0.02) * 0.008 * dpr;
        p.vx *= 0.985;
        p.vy *= 0.992;

        p.x += p.vx;
        p.y += p.vy;

        const lifeT = p.life / p.max;
        const fade = Math.sin(lifeT * Math.PI);
        const alpha = (p.kind === 0 ? 0.85 : 0.6) * fade;
        const r = p.size;

        // Tiny soft halo (much smaller than before)
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.2);
        grad.addColorStop(0, `hsla(${p.hue}, 100%, 70%, ${alpha * 0.6})`);
        grad.addColorStop(1, `hsla(${p.hue}, 100%, 40%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Bright pin-point core
        ctx.fillStyle = `hsla(48, 100%, 88%, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

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

      {/* Mouse-reactive ember/spark canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ mixBlendMode: "screen" }}
        aria-hidden="true"
      />

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
