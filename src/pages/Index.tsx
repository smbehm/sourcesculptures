import { useEffect } from "react";
import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { SoundProvider } from "@/context/SoundContext";
import { projects } from "@/data/projects";
import About from "@/components/About";
import Clients from "@/components/Clients";
import CTA from "@/components/CTA";

const Index = () => {
  useEffect(() => {
    document.title = "SOURCEsculptures — Cinematic Storytelling Studio";
  }, []);

  return (
    <SoundProvider>
      <Header />
      <SoundToggle />
      <main className="relative w-full overflow-x-hidden bg-background text-foreground">
        <Hero />
        <div id="work">
          {projects.map((p) => (
            <VideoSection
              key={p.id}
              youtubeId={p.youtubeId}
              eyebrow={p.eyebrow}
              title={p.title}
              href={`/projects/${p.slug}`}
            />
          ))}
        </div>
        <About />
        <Clients />
        <CTA />
      </main>
    </SoundProvider>
  );
};

export default Index;
