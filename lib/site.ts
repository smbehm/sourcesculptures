export const siteConfig = {
  name: "SOURCEsculptures",
  legalName: "SOURCEsculptures",
  /** Short top-left mark — mirrors “AMBER” scale in the reference template */
  navWordmark: "SOURCE",
  /**
   * Hero stacks two condensed lines like “AMBER STUDIO” in the template.
   * Uses uppercase via CSS.
   */
  heroLines: ["SOURCE", "SCULPTURES"] as const,
  tagline: "Creative Production Studio",
  location: "Los Angeles, California",
  email: "reach@sourcesculptures.com",
  /** Full-bleed hero still — replace `public/hero.jpg` to swap the image */
  heroImageUrl: "/hero.jpg",
  social: {
    instagram: "https://www.instagram.com/sourcesculptures",
    linkedin:
      "https://www.linkedin.com/in/source-sculptures-726923407/",
    tiktok: "https://www.tiktok.com/@sourcesculptures",
  },
  /** Set in production to your real domain for Open Graph and canonical URLs */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sourcesculptures.com",
} as const;
