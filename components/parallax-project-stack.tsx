"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import YouTube from "react-youtube";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSitePlayback } from "@/components/site-playback-provider";
import { buildYoutubePlayerVars } from "@/lib/youtube-player-vars";
import { useYoutubeEmbedReady } from "@/lib/use-youtube-embed-ready";
import type { Project } from "@/lib/projects";

type Props = {
  projects: Project[];
};

function CaptionBody({ project }: { project: Project }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="font-display text-balance text-[clamp(2.5rem,11vw,8.5rem)] font-bold leading-[0.9] tracking-[-0.02em] text-white uppercase drop-shadow-[0_8px_48px_rgba(0,0,0,0.55)]">
        {project.title}
      </h2>
      <p className="mt-5 text-[10px] tracking-[0.34em] text-white/88 uppercase sm:text-[11px]">
        {project.year} · {project.category}
      </p>
    </div>
  );
}

/**
 * Picks the parallax panel whose vertical span contains the **midline of the
 * caption text** (halfway through the title block). The label switches
 * instantly when that midline moves from one panel to the next.
 */
/**
 * Which parallax panel should own audio: strongest overlap with the viewport,
 * tie-broken by closeness to vertical center.
 */
function pickAudibleParallaxSlug(projects: Project[]): string | null {
  const vh = window.innerHeight;
  const midY = vh * 0.5;
  let bestSlug: string | null = null;
  let bestScore = 0;
  let bestDist = Infinity;

  for (const p of projects) {
    const el = document.getElementById(`panel-${p.slug}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const visTop = Math.max(r.top, 0);
    const visBottom = Math.min(r.bottom, vh);
    const vis = Math.max(0, visBottom - visTop);
    if (vis < 1) continue;

    const overlapRatio = vis / Math.min(r.height, vh);
    const center = (r.top + r.bottom) / 2;
    const dist = Math.abs(center - midY);

    if (
      overlapRatio > bestScore + 0.02 ||
      (overlapRatio >= bestScore - 0.02 && dist < bestDist)
    ) {
      bestScore = overlapRatio;
      bestDist = dist;
      bestSlug = p.slug;
    }
  }

  if (!bestSlug || bestScore < 0.1) return null;
  return bestSlug;
}

function pickProjectForTextMidline(
  projects: Project[],
  midY: number,
): Project {
  for (const p of projects) {
    const el = document.getElementById(`panel-${p.slug}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (midY >= r.top && midY <= r.bottom) {
      return p;
    }
  }

  let nearest: Project = projects[0];
  let best = Infinity;
  for (const p of projects) {
    const el = document.getElementById(`panel-${p.slug}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const center = (r.top + r.bottom) / 2;
    const d = Math.abs(midY - center);
    if (d < best) {
      best = d;
      nearest = p;
    }
  }
  return nearest;
}

const INITIAL_TITLE_FADE_MS = 1000;
const IDLE_TITLE_FADE_MS = 250;

export function ParallaxProjectStack({ projects }: Props) {
  const { setActiveParallaxSlug } = useSitePlayback();
  const reduceMotion = useReducedMotion();
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Project>(projects[0]);
  const [showCaption, setShowCaption] = useState(false);
  /** 1 = visible; fades to 0 after idle / initial delay (unless reduced motion). */
  const [titleOpacity, setTitleOpacity] = useState(1);
  const [titleFadeInstant, setTitleFadeInstant] = useState(false);
  const initialHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTitleTimers = useCallback(() => {
    if (initialHideTimerRef.current) {
      clearTimeout(initialHideTimerRef.current);
      initialHideTimerRef.current = null;
    }
    if (idleHideTimerRef.current) {
      clearTimeout(idleHideTimerRef.current);
      idleHideTimerRef.current = null;
    }
  }, []);

  const onTitlePointerActivity = useCallback(() => {
    if (reduceMotion) return;
    setTitleFadeInstant(true);
    setTitleOpacity(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setTitleFadeInstant(false));
    });
    clearTitleTimers();
    idleHideTimerRef.current = setTimeout(() => {
      setTitleFadeInstant(false);
      setTitleOpacity(0);
    }, IDLE_TITLE_FADE_MS);
  }, [clearTitleTimers, reduceMotion]);

  useEffect(() => {
    if (!showCaption || reduceMotion) {
      clearTitleTimers();
      if (showCaption && reduceMotion) {
        setTitleOpacity(1);
      }
      if (!showCaption) {
        setTitleOpacity(1);
        setTitleFadeInstant(false);
      }
      return;
    }

    setTitleFadeInstant(false);
    setTitleOpacity(1);
    clearTitleTimers();
    initialHideTimerRef.current = setTimeout(() => {
      setTitleOpacity(0);
    }, INITIAL_TITLE_FADE_MS);

    return () => {
      clearTitleTimers();
    };
  }, [active.slug, showCaption, reduceMotion, clearTitleTimers]);

  useEffect(() => {
    if (!showCaption || reduceMotion) return;

    const opts: AddEventListenerOptions = { passive: true, capture: true };
    const onMove = () => onTitlePointerActivity();
    window.addEventListener("pointermove", onMove, opts);
    return () => {
      window.removeEventListener("pointermove", onMove, opts);
    };
  }, [showCaption, reduceMotion, onTitlePointerActivity]);

  const updateScrollUi = useCallback(() => {
    const intro = document.getElementById("intro");
    if (!intro) return;

    const ir = intro.getBoundingClientRect();
    const introPast = ir.bottom < window.innerHeight * 0.42;

    const first = document.getElementById(`panel-${projects[0].slug}`);
    const last = document.getElementById(
      `panel-${projects[projects.length - 1].slug}`,
    );
    const inStack =
      !!first &&
      !!last &&
      first.getBoundingClientRect().top < window.innerHeight * 0.92 &&
      last.getBoundingClientRect().bottom > window.innerHeight * 0.12;

    setShowCaption(introPast && inStack);

    if (!inStack) {
      setActiveParallaxSlug(null);
    } else {
      setActiveParallaxSlug(pickAudibleParallaxSlug(projects));
    }

    const tr = textMeasureRef.current?.getBoundingClientRect();
    if (!tr || !introPast || !inStack) {
      return;
    }

    const midY = (tr.top + tr.bottom) / 2;
    setActive(pickProjectForTextMidline(projects, midY));
  }, [projects, setActiveParallaxSlug]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateScrollUi();
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [updateScrollUi]);

  useEffect(() => {
    if (!showCaption) return;
    const id = requestAnimationFrame(() => updateScrollUi());
    return () => cancelAnimationFrame(id);
  }, [showCaption, updateScrollUi]);

  return (
    <>
      {showCaption && (
        <div
          className="pointer-events-none fixed inset-x-0 top-[46%] z-[40] -translate-y-1/2 md:top-1/2"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="mx-auto flex min-h-[11rem] w-full max-w-[min(96vw,52rem)] flex-col items-center justify-center px-5 text-center">
            <div
              ref={textMeasureRef}
              className={
                titleFadeInstant
                  ? "transition-none"
                  : "transition-opacity duration-300 ease-out"
              }
              style={{
                opacity: reduceMotion ? 1 : titleOpacity,
              }}
            >
              <CaptionBody project={active} />
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-black">
        {projects.map((p, i) => (
          <ParallaxProjectSection key={p.slug} project={p} priority={i === 0} />
        ))}
      </div>
    </>
  );
}

function ParallaxProjectSection({ project, priority }: { project: Project; priority: boolean }) {
  const { registerParallaxPlayer, reinforcePlaybackQuality } = useSitePlayback();
  const { ready: embedReady, origin: embedOrigin } = useYoutubeEmbedReady();
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [play, setPlay] = useState(false);
  const [showYtPoster, setShowYtPoster] = useState(true);

  const ytPoster = `https://i.ytimg.com/vi/${project.youtubeId}/maxresdefault.jpg`;

  const ytOpts = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      playerVars: buildYoutubePlayerVars({ startMuted: true, origin: embedOrigin }),
    }),
    [embedOrigin],
  );

  useEffect(() => {
    setShowYtPoster(true);
  }, [project.youtubeId]);

  useEffect(() => {
    if (!play) setShowYtPoster(true);
  }, [play]);

  useEffect(() => {
    return () => registerParallaxPlayer(project.slug, null);
  }, [project.slug, registerParallaxPlayer]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [-90, 90],
  );

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let io: IntersectionObserver | null = null;

    const attach = () => {
      io?.disconnect();
      const mobile = window.matchMedia("(max-width: 767px)").matches;
      /** Mobile: start embed earlier while scrolling; desktop: previous tighter gate. */
      const minRatio = mobile ? 0.03 : 0.12;
      const thresholds = mobile
        ? [0, 0.02, 0.04, 0.06, 0.1, 0.14, 0.2, 0.3]
        : [0, 0.08, 0.15, 0.35];
      io = new IntersectionObserver(
        ([e]) => {
          const ratio = e.intersectionRatio;
          const ins = e.isIntersecting;
          if (mobile) {
            /** Avoid stop/start flicker when URL bar / caption causes tiny ratio swings. */
            setPlay((prev) => {
              if (!ins || ratio < 0.008) return false;
              if (ratio > minRatio) return true;
              return prev;
            });
          } else {
            setPlay(ins && ratio > minRatio);
          }
        },
        {
          threshold: thresholds,
          rootMargin: mobile ? "15% 0px 15% 0px" : "0px",
        },
      );
      io.observe(root);
    };

    attach();
    const mq = window.matchMedia("(max-width: 767px)");
    mq.addEventListener("change", attach);
    return () => {
      mq.removeEventListener("change", attach);
      io?.disconnect();
    };
  }, []);

  return (
    <div
      id={`panel-${project.slug}`}
      ref={ref}
      className="relative h-[135vh] min-h-[100dvh] w-full overflow-hidden bg-black"
    >
      <motion.div
        className="absolute -top-[11%] left-0 h-[122%] w-full will-change-transform"
        style={{ y }}
      >
        <Image
          src={project.coverImageUrl}
          alt=""
          fill
          priority={priority}
          className="object-cover opacity-50"
          sizes="100vw"
        />

        {play && (
          <div className="absolute left-1/2 top-1/2 z-0 h-[56.25vw] max-w-none min-h-[115vh] min-w-[177.78vh] w-[100vw] -translate-x-1/2 -translate-y-1/2 scale-[1.16]">
            <div className="absolute inset-0 z-0 overflow-hidden bg-black">
              {!embedReady ? (
                <Image
                  src={ytPoster}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                  priority={priority}
                />
              ) : (
                <>
                  <YouTube
                    videoId={project.youtubeId}
                    opts={ytOpts}
                    title=""
                    className="absolute inset-0 z-0 h-full w-full [&>div]:absolute [&>div]:inset-0 [&>div]:h-full [&>div]:w-full"
                    iframeClassName="pointer-events-none absolute inset-0 h-full w-full border-0"
                    loading={priority ? "eager" : "lazy"}
                    onReady={(e) => {
                      registerParallaxPlayer(project.slug, e.target);
                      reinforcePlaybackQuality(e.target);
                    }}
                    onStateChange={(e) => {
                      if (e.data === YouTube.PlayerState.PLAYING) {
                        reinforcePlaybackQuality(e.target);
                        setShowYtPoster(false);
                      }
                    }}
                    onEnd={(e) => {
                      try {
                        e.target.seekTo(0, true);
                        e.target.playVideo();
                      } catch {
                        /* noop */
                      }
                    }}
                  />
                  {showYtPoster ? (
                    <Image
                      src={ytPoster}
                      alt=""
                      fill
                      className="pointer-events-none absolute inset-0 z-[1] object-cover transition-opacity duration-500 ease-out"
                      sizes="100vw"
                      priority={priority}
                    />
                  ) : null}
                  <div
                    className="pointer-events-auto absolute inset-0 z-[2] bg-transparent"
                    aria-hidden
                  />
                </>
              )}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-[3] bg-transparent md:bg-black/28" />
      </motion.div>

      <PanelProjectLink slug={project.slug} title={project.title} />
    </div>
  );
}

function PanelProjectLink({ slug, title }: { slug: string; title: string }) {
  const [hint, setHint] = useState({ x: 0, y: 0, on: false });

  return (
    <Link
      href={`/projects/${slug}/`}
      className="absolute inset-0 z-[25] cursor-pointer"
      aria-label={`View project: ${title}`}
      onMouseMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect();
        setHint({
          x: e.clientX - b.left,
          y: e.clientY - b.top,
          on: true,
        });
      }}
      onMouseLeave={() => setHint((s) => ({ ...s, on: false }))}
    >
      {hint.on && (
        <span
          className="pointer-events-none absolute z-10 max-md:hidden border border-white/30 bg-black/75 px-2 py-1 font-sans text-[9px] tracking-[0.42em] text-white shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
          style={{ left: hint.x + 16, top: hint.y + 16 }}
        >
          VIEW
        </span>
      )}
    </Link>
  );
}
