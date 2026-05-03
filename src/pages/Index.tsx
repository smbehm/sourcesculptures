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
                  <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-10 md:p-16">
                    <div className="absolute inset-0 veil" aria-hidden="true" />
                    <div className="relative">
                      {p.categories?.[0] ? (
                        <span className="font-display tracking-cinema text-[10px] sm:text-[11px] uppercase text-white/70 mb-3 block">
                          {p.categories[0]}
                        </span>
                      ) : null}
                      <h2 className="font-display text-white uppercase font-bold leading-[0.95] text-[clamp(2.5rem,9vw,7rem)] drop-shadow-[0_6px_30px_rgba(0,0,0,0.55)]">
                        {p.title}
                      </h2>
                      {p.brief_description ? (
                        <p className="mt-4 max-w-xl text-white/80 text-sm sm:text-base leading-relaxed">
                          {p.brief_description}
                        </p>
                      ) : null}
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
