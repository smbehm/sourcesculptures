"use client";

import { useEffect, useState } from "react";

/**
 * Defer mounting the YT.Player until the client so `playerVars.origin` matches
 * `window.location.origin`. A mismatch (e.g. localhost vs NEXT_PUBLIC_SITE_URL)
 * breaks mute, quality, and other IFrame API calls.
 */
export function useYoutubeEmbedReady() {
  const [state, setState] = useState<{ ready: boolean; origin: string }>({
    ready: false,
    origin: "",
  });

  useEffect(() => {
    setState({ ready: true, origin: window.location.origin });
  }, []);

  return state;
}
