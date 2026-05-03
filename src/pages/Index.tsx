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

const Index = () => {
  const { data: projects = [] } = useProjects();

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
            {projects.map((p) => {
              const yt = p.preview_video_youtube_id || p.main_video_youtube_id;
              if (!yt) return null;
              return (
                <VideoSection
                  key={p.id}
                  youtubeId={yt}
                  eyebrow={p.categories[0] ?? p.brief_description ?? undefined}
                  title={p.title}
                  href={`/projects/${p.slug}`}
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
