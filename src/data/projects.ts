export interface Project {
  slug: string;
  id: string;
  youtubeId: string;
  eyebrow: string;
  title: string;
  description: string;
  images?: string[];
}

export const projects: Project[] = [
  {
    slug: "source-spirits",
    id: "source-spirits",
    youtubeId: "aoD2vFN5wFw",
    eyebrow: "Brand Film",
    title: "Source Spirits — No Art",
    description:
      "A cinematic introduction to Source Spirits. A study in restraint — bottle, light, and movement composed as a single sculpted gesture.",
  },
  {
    slug: "the-veil",
    id: "the-veil",
    youtubeId: "lDyARVNEOAc",
    eyebrow: "Short Film",
    title: "The Veil",
    description:
      "An editorial study in light, fabric and silence. Slow, deliberate frames that let texture and breath carry the narrative.",
  },
  {
    slug: "infirna",
    id: "infirna",
    youtubeId: "XQzXnpOq_uY",
    eyebrow: "Brand Film",
    title: "Infirna",
    description:
      "A meditation on form — sculpted in motion. Crafted to feel both intimate and monumental, with a focus on material and atmosphere.",
  },
  {
    slug: "together",
    id: "together",
    youtubeId: "hEqjP3YHiCc",
    eyebrow: "Editorial",
    title: "Together",
    description:
      "Intimate frames from a day shared. A documentary-led approach that holds onto the small, unrepeatable moments between people.",
  },
  {
    slug: "isabelle",
    id: "isabelle",
    youtubeId: "OjU5UZ2_MfM",
    eyebrow: "Portrait",
    title: "Isabelle",
    description:
      "A portrait film built around presence and quiet attention. Composed with a single subject, natural light, and unhurried pacing.",
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
