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
            {featuredProjects.map((p) => {
              const media = resolvePreviewMedia(p);
              if (!media.url && !media.youtubeId) return null;

              return (
                <ProjectMediaSection
                  key={p.id}
                  media={media}
                  title={p.title}
                  href={`/projects/${p.slug}`}
                  poster={getMediaPoster(media, p.title)}
                />
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
