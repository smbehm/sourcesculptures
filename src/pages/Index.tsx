import { useEffect, useRef, useState } from "react";
import Hero from "@/components/Hero";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { SoundProvider } from "@/context/SoundContext";
import { ActiveVideoProvider } from "@/context/ActiveVideoContext";
import { useProjects } from "@/hooks/useProjects";
import About from "@/components/About";
import Clients from "@/components/Clients";
import CTA from "@/components/CTA";
import ProjectMediaSection from "@/components/ProjectMediaSection";
import { getMediaPoster, resolvePreviewMedia } from "@/lib/projectMedia";

const Index = () => {
  const { data: projects = [] } = useProjects();
  const featuredProjects = projects.filter((project) => project.featured);

  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    document.title = "SOURCEsculptures — Cinematic Storytelling Studio";
  }, []);

  useEffect(() => {
    if (featuredProjects.length === 0) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const viewportCenter = window.innerHeight / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      sectionRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const dist = Math.abs(center - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      setActiveIndex(bestIdx);
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
  }, [featuredProjects.length]);

  const active = featuredProjects[activeIndex];

  return (
    <SoundProvider>
      <ActiveVideoProvider>
        <Header />
        <SoundToggle />
        <main className="relative w-full overflow-x-hidden bg-background text-foreground">
          <Hero />
          <div id="work" className="relative">
            {/* Sticky overlay — pinned to viewport center while #work is in view, content swaps on scroll */}
            {featuredProjects.length > 0 && (
              <div className="sticky top-0 h-screen-stable w-full pointer-events-none z-30 -mb-[100svh] flex flex-col items-center justify-center text-center px-6">
                {active && (
                  <>
                    <h2
                      key={`t-${active.id}`}
                      className="font-display text-white uppercase font-bold leading-[0.95] text-[clamp(2.5rem,7vw,5.5rem)] drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)] animate-fade-in"
                    >
                      {active.title}
                    </h2>
                    {active.homepage_subtitle ? (
                      <div
                        key={`s-${active.id}`}
                        className="mt-4 font-display tracking-[0.2em] text-[11px] sm:text-xs uppercase text-white/85 animate-fade-in"
                      >
                        {active.homepage_subtitle}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}

            {featuredProjects.map((p, i) => {
              const media = resolvePreviewMedia(p);
              if (!media.url && !media.youtubeId) return null;

              return (
                <section
                  key={p.id}
                  id={p.slug}
                  ref={(el) => (sectionRefs.current[i] = el)}
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
          <Clients />
          <CTA />
        </main>
      </ActiveVideoProvider>
    </SoundProvider>
  );
};

export default Index;
