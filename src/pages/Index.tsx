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
                  <div className="px-6 sm:px-10 py-24 sm:py-32 mx-auto max-w-4xl">
                    {p.categories?.[0] ? (
                      <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
                        {p.categories[0]}
                      </span>
                    ) : null}
                    <h3 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,6vw,4rem)]">
                      {p.title}
                    </h3>
                    {p.brief_description ? (
                      <p className="mt-8 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
                        {p.brief_description}
                      </p>
                    ) : null}
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
