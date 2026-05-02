import { siteConfig } from "@/lib/site";

/** Origin sent to YouTube `origin=` (must match the live site for embed + audio policies). */
export function getYoutubeEmbedOrigin(): string {
  try {
    return new URL(siteConfig.url).origin;
  } catch {
    return "";
  }
}
