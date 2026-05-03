export type Credit = { role: string; name: string };

export type Project = {
  slug: string;
  title: string;
  year: string;
  category: string;
  client: string;
  label: string;
  /** Poster / fallback image (YouTube thumb or GitHub asset) */
  coverImageUrl: string;
  youtubeId: string;
  overview: string[];
  credits: Credit[];
};

export const projects: Project[] = [
  {
    slug: "source-spirits-no-art",
    title: "Source Spirits - No Art",
    year: "2025",
    category: "Commercial",
    client: "SOURCEsculptures",
    label: "Commercial",
    coverImageUrl:
      "https://i.ytimg.com/vi/Bv-a_7zH88o/maxresdefault.jpg",
    youtubeId: "Bv-a_7zH88o",
    overview: [
      "Source Spirits — campaign visual built around atmosphere, restraint, and texture.",
      "Full write-up and credits can be edited when you wire the CMS.",
    ],
    credits: [
      { role: "Director", name: "SOURCEsculptures" },
      { role: "Producer", name: "SOURCEsculptures" },
    ],
  },
  {
    slug: "the-veil",
    title: "The Veil",
    year: "2025",
    category: "Short Film",
    client: "SOURCEsculptures",
    label: "Short Film",
    coverImageUrl:
      "https://i.ytimg.com/vi/lDyARVNEOAc/maxresdefault.jpg",
    youtubeId: "lDyARVNEOAc",
    overview: [
      "The Veil — narrative piece; synopsis and festival notes go here.",
    ],
    credits: [
      { role: "Director", name: "SOURCEsculptures" },
      { role: "Producer", name: "SOURCEsculptures" },
    ],
  },
  {
    slug: "infirna",
    title: "Infirna",
    year: "2025",
    category: "Brand Film",
    client: "SOURCEsculptures",
    label: "Brand Film",
    coverImageUrl:
      "https://i.ytimg.com/vi/XQzXnpOq_uY/maxresdefault.jpg",
    youtubeId: "XQzXnpOq_uY",
    overview: [
      "Infirna — brand film overview and outcomes placeholder.",
    ],
    credits: [
      { role: "Director", name: "SOURCEsculptures" },
      { role: "Producer", name: "SOURCEsculptures" },
    ],
  },
  {
    slug: "together",
    title: "Together",
    year: "2025",
    category: "Commercial",
    client: "SOURCEsculptures",
    label: "Commercial",
    coverImageUrl:
      "https://i.ytimg.com/vi/hEqjP3YHiCc/maxresdefault.jpg",
    youtubeId: "hEqjP3YHiCc",
    overview: [
      "Together — campaign placeholder copy.",
    ],
    credits: [
      { role: "Director", name: "SOURCEsculptures" },
      { role: "Producer", name: "SOURCEsculptures" },
    ],
  },
  {
    slug: "isabelle",
    title: "Isabelle",
    year: "2025",
    category: "Commercial",
    client: "SOURCEsculptures",
    label: "Commercial",
    coverImageUrl:
      "https://i.ytimg.com/vi/OjU5UZ2_MfM/maxresdefault.jpg",
    youtubeId: "OjU5UZ2_MfM",
    overview: [
      "Isabelle — campaign visual placeholder; edit copy when ready.",
    ],
    credits: [
      { role: "Director", name: "SOURCEsculptures" },
      { role: "Producer", name: "SOURCEsculptures" },
    ],
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getOtherProjects(currentSlug: string, limit = 4): Project[] {
  return projects.filter((p) => p.slug !== currentSlug).slice(0, limit);
}
