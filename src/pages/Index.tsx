import { useCallback, useEffect, useRef, useState } from "react";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { SoundProvider } from "@/context/SoundContext";
import { ActiveVideoProvider } from "@/context/ActiveVideoContext";
import { useProjects, type ProjectRow } from "@/hooks/useProjects";
import About from "@/components/About";
import Clients from "@/components/Clients";
import CTA from "@/components/CTA";
import ProjectMediaSection from "@/components/ProjectMediaSection";
import { getMediaPoster, resolvePreviewMedia } from "@/lib/projectMedia";

const INITIAL_TITLE_FADE_MS = 1000;
const IDLE_TITLE_FADE_MS = 250;

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return reduce;
}

function getSubtitle(p: ProjectRow): string {
  if (p.homepage_subtitle) return p.homepage_subtitle;
  const cat = p.categories?.[0];
  if (p.year && cat) return `${p.year} · ${cat}`;
  if (p.year) return String(p.year);
  return cat ?? "";
}

function CaptionBody({ project }: { project: ProjectRow }) {
  const subtitle = getSubtitle(project);
  return (
    <div className="flex flex-col items-center">
      <h2 className="font-display text-balance text-[clamp(1.25rem,5.5vw,4.25rem)] font-bold leading-[0.9] tracking-[-0.02em] text-white uppercase drop-shadow-[0_8px_48px_rgba(0,0,0,0.55)]">
        {project.title}
      </h2>
      {subtitle && (
        <p className="mt-1 text-[15px] tracking-[0.34em] text-white/90 uppercase sm:text-[17px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function pickProjectForTextMidline(projects: ProjectRow[], midY: number): ProjectRow {
  for (const p of projects) {
    const el = document.getElementById(`panel-${p.slug}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (midY >= r.top && midY <= r.bottom) return p;
  }
  let nearest = projects[0];
  let best = Infinity;
  for (const p of projects) {
    const el = document.getElementById(`panel-${p.slug}`);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    const d = Math.abs((r.top + r.bottom) / 2 - midY);
    if (d < best) {
      best = d;
      nearest = p;
    }
  }
  return nearest;
}

const Index = () => {
  const { data: projects = [] } = useProjects();
  const featuredProjects = projects.filter((p) => p.featured);

  const reduceMotion = useReducedMotion();
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ProjectRow | null>(null);
  const [showCaption, setShowCaption] = useState(false);
  const [titleOpacity, setTitleOpacity] = useState(1);
  const [titleFadeInstant, setTitleFadeInstant] = useState(false);
  const initialHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.title = "SOURCEsculptures — Cinematic Storytelling Studio";
  }, []);

  useEffect(() => {
    if (!active && featuredProjects.length > 0) setActive(featuredProjects[0]);
  }, [featuredProjects, active]);

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

  useEffect(() => {
    if (!showCaption || reduceMotion) {
      clearTitleTimers();
      if (showCaption && reduceMotion) setTitleOpacity(1);
      if (!showCaption) {
        setTitleOpacity(1);
        setTitleFadeInstant(false);
      }
      return;
    }
    setTitleFadeInstant(false);
    setTitleOpacity(1);
    clearTitleTimers();
    initialHideTimerRef.current = setTimeout(() => setTitleOpacity(0), INITIAL_TITLE_FADE_MS);
    return () => clearTitleTimers();
  }, [active?.slug, showCaption, reduceMotion, clearTitleTimers]);

  const touchActiveRef = useRef(false);
  const showTitleNow = useCallback(() => {
    setTitleFadeInstant(true);
    setTitleOpacity(1);
    requestAnimationFrame(() => requestAnimationFrame(() => setTitleFadeInstant(false)));
    clearTitleTimers();
  }, [clearTitleTimers]);

  const scheduleIdleHide = useCallback(() => {
    clearTitleTimers();
    idleHideTimerRef.current = setTimeout(() => {
      setTitleFadeInstant(false);
      setTitleOpacity(0);
    }, IDLE_TITLE_FADE_MS);
  }, [clearTitleTimers]);

  const onTitlePointerActivity = useCallback(() => {
    if (reduceMotion) return;
    showTitleNow();
    if (!touchActiveRef.current) scheduleIdleHide();
  }, [reduceMotion, showTitleNow, scheduleIdleHide]);

  useEffect(() => {
    if (!showCaption || reduceMotion) return;
    const onMove = () => onTitlePointerActivity();
    const onScrollActivity = () => onTitlePointerActivity();
    const onTouchStart = () => {
      touchActiveRef.current = true;
      showTitleNow();
    };
    const onTouchEnd = () => {
      touchActiveRef.current = false;
      scheduleIdleHide();
    };
    window.addEventListener("pointermove", onMove, { passive: true, capture: true });
    window.addEventListener("scroll", onScrollActivity, { passive: true });
    window.addEventListener("wheel", onScrollActivity, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("scroll", onScrollActivity);
      window.removeEventListener("wheel", onScrollActivity);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [showCaption, reduceMotion, onTitlePointerActivity, showTitleNow, scheduleIdleHide]);

  useEffect(() => {
    if (featuredProjects.length === 0) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const intro = document.getElementById("intro");
      if (!intro) return;
      const ir = intro.getBoundingClientRect();
      const introPast = ir.bottom < window.innerHeight * 0.42;

      const first = document.getElementById(`panel-${featuredProjects[0].slug}`);
      const last = document.getElementById(
        `panel-${featuredProjects[featuredProjects.length - 1].slug}`
      );
      const inStack =
        !!first &&
        !!last &&
        first.getBoundingClientRect().top < window.innerHeight * 0.92 &&
        last.getBoundingClientRect().bottom > window.innerHeight * 0.12;

      setShowCaption(introPast && inStack);

      const tr = textMeasureRef.current?.getBoundingClientRect();
      if (tr && introPast && inStack) {
        const midY = (tr.top + tr.bottom) / 2;
        const next = pickProjectForTextMidline(featuredProjects, midY);
        setActive((prev) => (prev?.slug === next.slug ? prev : next));
      }
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [featuredProjects]);

  return (
    <SoundProvider>
      <ActiveVideoProvider>
        <Header />
        <SoundToggle />
        <main className="relative w-full overflow-x-hidden bg-background text-foreground">
          <Hero />

          {showCaption && active && (
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
                  style={{ opacity: reduceMotion ? 1 : titleOpacity }}
                >
                  <CaptionBody project={active} />
                </div>
              </div>
            </div>
          )}

          <div id="work" className="relative">
            {featuredProjects.map((p, i) => {
              const media = resolvePreviewMedia(p);
              if (!media.url && !media.youtubeId) return null;
              return (
                <section
                  key={p.id}
                  id={`panel-${p.slug}`}
                  className="relative w-full bg-background"
                >
                  <ProjectMediaSection
                    media={media}
                    title={p.title}
                    href={`/projects/${p.slug}`}
                    poster={getMediaPoster(media, p.title)}
                    deferUntilScroll={i === 0}
                  />
                </section>
              );
            })}
          </div>
          <About />
          <CTA />
        </main>
      </ActiveVideoProvider>
    </SoundProvider>
  );
};

export default Index;
