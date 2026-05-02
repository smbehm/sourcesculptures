"use client";

import { flushSync } from "react-dom";
import { useSitePlayback } from "@/components/site-playback-provider";

export function GlobalPlaybackBar() {
  const {
    siteMuted,
    toggleMute,
    videoQuality,
    setVideoQuality,
    syncPlaybackAfterToggle,
  } = useSitePlayback();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-row items-stretch gap-1 rounded-full border border-white/25 bg-black/70 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md md:bottom-8 md:right-8">
      <div className="flex rounded-full p-0.5">
        <QualityPill
          label="HD"
          selected={videoQuality === "hd1080"}
          onSelect={() => {
            flushSync(() => {
              setVideoQuality("hd1080");
            });
            syncPlaybackAfterToggle(siteMuted);
          }}
        />
        <QualityPill
          label="4K"
          selected={videoQuality === "hd2160"}
          onSelect={() => {
            flushSync(() => {
              setVideoQuality("hd2160");
            });
            syncPlaybackAfterToggle(siteMuted);
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          const nextMuted = !siteMuted;
          flushSync(() => {
            toggleMute();
          });
          syncPlaybackAfterToggle(nextMuted);
        }}
        aria-pressed={!siteMuted}
        title={siteMuted ? "Unmute video audio" : "Mute video audio"}
        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full transition hover:bg-white/10"
      >
        <span className="sr-only">
          {siteMuted ? "Unmute video audio" : "Mute video audio"}
        </span>
        {siteMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
      </button>
    </div>
  );
}

function QualityPill({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`min-w-[2.75rem] rounded-full px-2.5 py-2 font-display text-[10px] tracking-[0.18em] uppercase transition ${
        selected
          ? "bg-white text-black"
          : "text-white/65 hover:bg-white/10 hover:text-white"
      }`}
      aria-pressed={selected}
    >
      {label}
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
