import { useEffect } from "react";
import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
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

  useEffect(() => {
    document.title = "SOURCEsculptures — Cinematic Storytelling Studio";
  }, []);

  return (
    <SoundProvider>
      <ActiveVideoProvider>
        <Header />
        <SoundToggle />
        <main className="relative w-full overflow-x-hidden bg-background text-foreground">
          <Hero />
          <div id="work">
            {featuredProjects.map((p, i) => {
              const media = resolvePreviewMedia(p);
              if (!media.url && !media.youtubeId) return null;

              return (
                <section key={p.id} id={p.slug} className="relative w-full bg-background">
                  <ProjectMediaSection
                    media={media}
                    title={p.title}
                    href={`/projects/${p.slug}`}
                    poster={getMediaPoster(media, p.title)}
                    deferUntilScroll={i === 0}
                  />
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
                    <div className="relative">
                      <h2 className="font-display text-white uppercase font-bold leading-[0.95] text-[clamp(2.5rem,7vw,5.5rem)] drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
                        {p.title}
                      </h2>
                      <div className="mt-4 font-display tracking-[0.2em] text-[11px] sm:text-xs uppercase text-white/80 flex items-center justify-center gap-2">
                        {p.year ? <span>{p.year}</span> : null}
                        {p.year && p.categories?.[0] ? <span aria-hidden="true">·</span> : null}
                        {p.categories?.[0] ? <span>{p.categories[0]}</span> : null}
                      </div>
                    </div>
                  </div>
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
