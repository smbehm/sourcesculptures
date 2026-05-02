"use client";

import { useSiteAudio } from "@/components/site-audio-provider";

export function GlobalMuteButton() {
  const { siteMuted, toggleMute } = useSiteAudio();

  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-pressed={!siteMuted}
      title={siteMuted ? "Unmute video audio" : "Mute video audio"}
      className="fixed bottom-6 right-6 z-[100] flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/70 text-white shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-white/45 hover:bg-black/85 md:bottom-8 md:right-8"
    >
      <span className="sr-only">
        {siteMuted ? "Unmute video audio" : "Mute video audio"}
      </span>
      {siteMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
    </button>
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
