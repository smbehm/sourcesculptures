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

  const audioLabel = siteMuted ? "Unmute audio" : "Mute audio";

  return (
    <div
      className="pointer-events-none fixed bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[100] md:bottom-[max(2rem,env(safe-area-inset-bottom,0px))] md:right-[max(1.75rem,env(safe-area-inset-right,0px))]"
      role="region"
      aria-label="Site audio"
    >
      <div className="pointer-events-auto rounded-full bg-black/55 p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.12)] ring-1 ring-white/10 backdrop-blur-md md:p-3">
        <div className="flex flex-row items-stretch rounded-full border border-white/20 bg-black/40 p-0.5 shadow-inner">
          <button
            type="button"
            data-site-mute-control
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
            aria-label={audioLabel}
            aria-pressed={!siteMuted}
            title={audioLabel}
            style={{
              touchAction: "manipulation",
              WebkitTapHighlightColor: "transparent",
              cursor: "pointer",
            }}
            className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full text-white transition hover:bg-white/10"
          >
            {siteMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
          </button>
        </div>
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
