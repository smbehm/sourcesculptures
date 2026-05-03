import { useEffect } from "react";
import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import About from "@/components/About";
import Clients from "@/components/Clients";
import CTA from "@/components/CTA";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { SoundProvider } from "@/context/SoundContext";

const projects = [
  {
    youtubeId: "lDyARVNEOAc",
    eyebrow: "Short Film",
    title: "Obsidian",
    subtitle: "An editorial study in light, fabric and silence.",
    href: "https://sourcesculptures.com/projects/the-veil/",
  },
  {
    youtubeId: "XQzXnpOq_uY",
    eyebrow: "Brand Film",
    title: "Infirna",
    subtitle: "A meditation on form — sculpted in motion.",
    href: "https://sourcesculptures.com/projects/infirna/",
  },
  {
    youtubeId: "hEqjP3YHiCc",
    eyebrow: "Editorial",
    title: "Together",
    subtitle: "Intimate frames from a day shared.",
    href: "https://sourcesculptures.com/projects/together/",
  },
];

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
            <VideoSection key={p.youtubeId} {...p} />
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
