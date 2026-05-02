"use client";

import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useLenis } from "lenis/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSiteAudio } from "@/components/site-audio-provider";
import { chromelessYoutubeEmbedUrl } from "@/lib/youtube";
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

export function ParallaxProjectStack({ projects }: Props) {
  const { siteMuted } = useSiteAudio();
  const lenis = useLenis();
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Project>(projects[0]);
  const [showCaption, setShowCaption] = useState(false);
  /** Matches Tailwind `md` (freeze scroll only below 768px). */
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

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

    const tr = textMeasureRef.current?.getBoundingClientRect();
    if (!tr || !introPast || !inStack) {
      return;
    }

    const midY = (tr.top + tr.bottom) / 2;
    setActive(pickProjectForTextMidline(projects, midY));
  }, [projects]);

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

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsNarrowViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Mobile-only: keep view fixed on the active parallax panel while the caption strip is shown. */
  useEffect(() => {
    const lock = showCaption && isNarrowViewport;
    if (!lock) return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouch = body.style.touchAction;
    const prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "none";

    lenis?.stop();

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouch;
      body.style.overscrollBehavior = prevBodyOverscroll;
      lenis?.start();
    };
  }, [showCaption, isNarrowViewport, lenis]);

  return (
    <>
      {showCaption && (
        <div
          className="pointer-events-none fixed inset-x-0 top-[46%] z-[40] -translate-y-1/2 md:top-1/2"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="mx-auto flex min-h-[11rem] w-full max-w-[min(96vw,52rem)] flex-col items-center justify-center px-5 text-center">
            <div ref={textMeasureRef}>
              <CaptionBody project={active} />
            </div>
          </div>
        </div>
      )}

      <div className="relative bg-black">
        {projects.map((p, i) => (
          <ParallaxProjectSection
            key={p.slug}
            project={p}
            priority={i === 0}
            activeSlug={active.slug}
            siteMuted={siteMuted}
          />
        ))}
      </div>
    </>
  );
}

function ParallaxProjectSection({
  project,
  priority,
  activeSlug,
  siteMuted,
}: {
  project: Project;
  priority: boolean;
  activeSlug: string;
  siteMuted: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [play, setPlay] = useState(false);

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
    const io = new IntersectionObserver(
      ([e]) => {
        setPlay(e.isIntersecting && e.intersectionRatio > 0.12);
      },
      { threshold: [0, 0.08, 0.15, 0.35] },
    );
    io.observe(root);
    return () => io.disconnect();
  }, []);

  /** Only the caption-aligned panel may play sound when the user has unmuted the site. */
  const embedMuted = siteMuted || activeSlug !== project.slug;

  const embedSrc = useMemo(
    () =>
      chromelessYoutubeEmbedUrl(project.youtubeId, { muted: embedMuted }),
    [project.youtubeId, embedMuted],
  );

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
            <iframe
              key={`${project.slug}-${embedMuted}`}
              title=""
              src={embedSrc}
              className="pointer-events-none absolute inset-0 h-full w-full select-none border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              loading={priority ? "eager" : "lazy"}
              tabIndex={-1}
            />
            {/* Blocks tap/hover from reaching the player so built-in overlays stay hidden */}
            <div
              className="pointer-events-auto absolute inset-0 z-[2] bg-transparent"
              aria-hidden
            />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 z-[3] bg-black/28" />
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
          className="pointer-events-none absolute z-10 border border-white/30 bg-black/75 px-2 py-1 font-sans text-[9px] tracking-[0.42em] text-white shadow-[0_4px_24px_rgba(0,0,0,0.45)]"
          style={{ left: hint.x + 16, top: hint.y + 16 }}
        >
          VIEW
        </span>
      )}
    </Link>
  );
}
