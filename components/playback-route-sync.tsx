"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSitePlayback } from "@/components/site-playback-provider";

/** Parallax “active strip” only exists on the home stack — clear it on project routes so policy targets the hero. */
export function PlaybackRouteSync() {
  const pathname = usePathname();
  const { setActiveParallaxSlug } = useSitePlayback();

  useEffect(() => {
    if (pathname?.startsWith("/projects/")) {
      setActiveParallaxSlug(null);
    }
  }, [pathname, setActiveParallaxSlug]);

  return null;
}
