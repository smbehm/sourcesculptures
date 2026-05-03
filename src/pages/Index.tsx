import { useEffect } from "react";
import Hero from "@/components/Hero";
import VideoSection from "@/components/VideoSection";
import About from "@/components/About";
import Clients from "@/components/Clients";
import CTA from "@/components/CTA";

const projects = [
  {
    youtubeId: "Bv-a_7zH88o",
    eyebrow: "Documentary",
    title: "Source Spirits",
    subtitle: "A long-form portrait of place, ritual, and craft — distilled into moving image.",
    href: "https://sourcesculptures.com/projects/source-spirits-no-art/",
  },
  {
    youtubeId: "lDyARVNEOAc",
    eyebrow: "Short Film",
    title: "The Veil",
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
    const meta =
      document.querySelector('meta[name="description"]') ||
      Object.assign(document.createElement("meta"), { name: "description" });
    meta.setAttribute(
      "content",
      "SOURCEsculptures — a cinematic videography studio crafting brand films, documentaries, editorial and wedding films."
    );
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);

  return (
    <main className="relative w-full overflow-x-hidden bg-background text-foreground">
      <Hero />
      {projects.map((p) => (
        <VideoSection key={p.youtubeId} {...p} />
      ))}
      <About />
      <Clients />
      <CTA />
    </main>
  );
};

export default Index;
