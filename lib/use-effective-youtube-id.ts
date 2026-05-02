"use client";

import { useLayoutEffect, useState } from "react";

const MOBILE_MQ = "(max-width: 767px)";

/**
 * Picks `youtubeIdMobile` when the viewport matches mobile; otherwise `youtubeId`.
 * Used so the first project can swap its embed on phones without affecting desktop.
 */
export function useEffectiveYoutubeId(
  youtubeId: string,
  youtubeIdMobile?: string,
): string {
  const [id, setId] = useState(youtubeId);

  useLayoutEffect(() => {
    if (!youtubeIdMobile) {
      setId(youtubeId);
      return;
    }
    const mq = window.matchMedia(MOBILE_MQ);
    const pick = () => (mq.matches ? youtubeIdMobile : youtubeId);
    setId(pick());
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, [youtubeId, youtubeIdMobile]);

  return youtubeIdMobile ? id : youtubeId;
}
