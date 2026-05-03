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
                <div key={p.id} className="relative">
                  <ProjectMediaSection
                    media={media}
                    title={p.title}
                    href={`/projects/${p.slug}`}
                    poster={getMediaPoster(media, p.title)}
                    deferUntilScroll={i === 0}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 sm:px-10 pb-10 sm:pb-14 bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                    <h2 className="font-display uppercase text-white font-bold leading-[0.95] text-[clamp(1.75rem,5vw,3.5rem)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
                      {p.title}
                    </h2>
                    {p.brief_description ? (
                      <p className="mt-3 max-w-2xl text-white/85 text-sm sm:text-base leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                        {p.brief_description}
                      </p>
                    ) : null}
                  </div>
                </div>
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
