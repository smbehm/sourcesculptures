import { useEffect } from "react";
import Hero from "@/components/Hero";
import ProjectBlock from "@/components/ProjectBlock";
import About from "@/components/About";
import Clients from "@/components/Clients";
import CTA from "@/components/CTA";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { SoundProvider } from "@/context/SoundContext";

const projects = [
  {
    id: "source-spirits",
    youtubeId: "aoD2vFN5wFw",
    eyebrow: "Brand Film",
    title: "Source Spirits — No Art",
    description:
      "A cinematic introduction to Source Spirits. A study in restraint — bottle, light, and movement composed as a single sculpted gesture.",
    href: "https://sourcesculptures.com/projects/source-spirits/",
  },
  {
    id: "the-veil",
    youtubeId: "lDyARVNEOAc",
    eyebrow: "Short Film",
    title: "The Veil",
    description:
      "An editorial study in light, fabric and silence. Slow, deliberate frames that let texture and breath carry the narrative.",
    href: "https://sourcesculptures.com/projects/the-veil/",
  },
  {
    id: "infirna",
    youtubeId: "XQzXnpOq_uY",
    eyebrow: "Brand Film",
    title: "Infirna",
    description:
      "A meditation on form — sculpted in motion. Crafted to feel both intimate and monumental, with a focus on material and atmosphere.",
    href: "https://sourcesculptures.com/projects/infirna/",
  },
  {
    id: "together",
    youtubeId: "hEqjP3YHiCc",
    eyebrow: "Editorial",
    title: "Together",
    description:
      "Intimate frames from a day shared. A documentary-led approach that holds onto the small, unrepeatable moments between people.",
    href: "https://sourcesculptures.com/projects/together/",
  },
  {
    id: "isabelle",
    youtubeId: "OjU5UZ2_MfM",
    eyebrow: "Portrait",
    title: "Isabelle",
    description:
      "A portrait film built around presence and quiet attention. Composed with a single subject, natural light, and unhurried pacing.",
    href: "https://sourcesculptures.com/projects/isabelle/",
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
            <ProjectBlock key={p.id} {...p} />
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
