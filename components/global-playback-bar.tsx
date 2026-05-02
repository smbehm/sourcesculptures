"use client";

import { useSitePlayback } from "@/components/site-playback-provider";

/**
 * Site-wide playback: preferred stream tier (best-effort via YouTube API) and one mute control
 * for every embedded player (home parallax stack + project heroes).
 */
export function GlobalPlaybackBar() {
  const { siteMuted, toggleMute, videoQuality, setVideoQuality } =
    useSitePlayback();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex justify-center px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2 md:px-6 md:pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="region"
      aria-label="Site video playback"
    >
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-2xl border border-white/20 bg-black/90 px-3 py-3 shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md sm:max-w-none sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 md:bottom-auto md:right-auto md:w-auto md:min-w-[min(100vw-2rem,22rem)]">
        <div className="flex flex-col gap-1.5 sm:flex-1">
          <span
            id="playback-quality-label"
            className="font-display text-[9px] tracking-[0.35em] text-white/45 uppercase"
          >
            Preferred quality
          </span>
          <div
            role="radiogroup"
            aria-labelledby="playback-quality-label"
            className="flex rounded-full border border-white/15 bg-white/[0.04] p-1"
          >
            <QualityRadio
              label="HD"
              description="Up to 1080p when the upload supports it"
              checked={videoQuality === "hd1080"}
              onSelect={() => setVideoQuality("hd1080")}
            />
            <QualityRadio
              label="4K"
              description="Up to 4K when the upload supports it"
              checked={videoQuality === "hd2160"}
              onSelect={() => setVideoQuality("hd2160")}
            />
          </div>
          <p className="font-[family-name:var(--font-inter)] text-[10px] leading-snug text-white/35 sm:max-w-[14rem]">
            YouTube chooses the actual bitrate (especially on phones). We request
            the closest match.
          </p>
        </div>

        <div className="flex flex-col gap-1 sm:shrink-0">
          <span className="font-display text-[9px] tracking-[0.35em] text-white/45 uppercase sm:text-right">
            All videos
          </span>
          <button
            type="button"
            data-testid="global-mute"
            onClick={toggleMute}
            aria-pressed={!siteMuted}
            title={
              siteMuted
                ? "Turn sound on for the active video"
                : "Mute all videos on this site"
            }
            className="flex min-h-12 w-full touch-manipulation items-center justify-center gap-2.5 rounded-xl border-2 border-white/35 bg-white/[0.08] px-4 py-3 font-[family-name:var(--font-inter)] text-sm font-medium text-white transition hover:border-white/55 hover:bg-white/[0.12] active:scale-[0.98] sm:min-w-[10.5rem]"
          >
            {siteMuted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
            <span>{siteMuted ? "Sound off — tap to unmute" : "Sound on"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function QualityRadio({
  label,
  description,
  checked,
  onSelect,
}: {
  label: string;
  description: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      title={description}
      onClick={onSelect}
      className={`min-h-11 min-w-[4.5rem] flex-1 rounded-full px-3 py-2 font-display text-[10px] tracking-[0.22em] uppercase transition ${
        checked
          ? "bg-white text-black shadow-sm"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      }`}
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
      className="h-5 w-5 shrink-0"
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
      className="h-5 w-5 shrink-0"
      aria-hidden
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M3 3l18 18" />
    </svg>
  );
}
