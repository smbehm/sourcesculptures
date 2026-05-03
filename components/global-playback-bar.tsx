"use client";

import { useCallback, useRef } from "react";
import { useSitePlayback } from "@/components/site-playback-provider";

export function GlobalPlaybackBar() {
  const { siteMuted, toggleMute } = useSitePlayback();
  /** Touch devices emit touchend then a synthetic click — only toggle once */
  const touchHandledRef = useRef(false);

  const runToggle = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] md:bottom-8 md:right-8"
      role="region"
      aria-label="Site video playback"
    >
      <div className="flex flex-row items-stretch rounded-full border border-white/25 bg-black/70 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <button
          type="button"
          onTouchStart={() => {
            touchHandledRef.current = true;
          }}
          onTouchCancel={() => {
            touchHandledRef.current = false;
          }}
          onTouchEnd={() => {
            runToggle();
          }}
          onClick={() => {
            if (touchHandledRef.current) {
              touchHandledRef.current = false;
              return;
            }
            runToggle();
          }}
          aria-pressed={!siteMuted}
          title={siteMuted ? "Unmute video audio" : "Mute video audio"}
          style={{
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
            cursor: "pointer",
          }}
          className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition hover:bg-white/10"
        >
          <span className="sr-only">
            {siteMuted ? "Unmute video audio" : "Mute video audio"}
          </span>
          {siteMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
        </button>
      </div>
    </div>
  );
}

function SpeakerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M17.66 6.34a8 8 0 0 1 0 11.32" />
    </svg>
  );
}

function SpeakerMutedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M3 3l18 18" />
    </svg>
  );
}
