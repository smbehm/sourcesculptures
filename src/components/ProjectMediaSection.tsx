import { useEffect, useRef } from "react";
import { useSound } from "@/context/SoundContext";
import VideoSection from "@/components/VideoSection";
import type { ResolvedProjectMedia } from "@/lib/projectMedia";

interface ProjectMediaSectionProps {
  media: ResolvedProjectMedia;
  title: string;
  href?: string;
  poster?: string;
  showControls?: boolean;
  deferUntilScroll?: boolean;
}


/**
 * A file/URL-hosted preview. Autoplay alone is unreliable — a muted video that
 * scrolls into frame after a stall, or one the browser skipped while it was far
 * off-screen, needs to be told to play. Off-screen clips are paused so a page of
 * previews never decodes them all at once.
 */
const SelfHostedVideo = ({
  src,
  poster,
  muted,
  showControls,
}: {
  src: string;
  poster?: string;
  muted: boolean;
  showControls: boolean;
}) => {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    // With controls on screen the visitor drives playback; nudging it would
    // undo a deliberate pause.
    if (!el || showControls) return;

    let inView = false;
    const tryPlay = () => {
      if (!inView) return;
      // Rejects when the browser refuses autoplay; the next gesture retries.
      el.play().catch(() => { /* waiting on a gesture */ });
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          inView = e.intersectionRatio > 0.1;
          if (inView) tryPlay();
          else el.pause();
        }
      },
      { threshold: [0, 0.1, 0.25, 0.5] }
    );
    io.observe(el);

    el.addEventListener("canplay", tryPlay);
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("touchend", tryPlay);
    window.addEventListener("keydown", tryPlay);
    return () => {
      io.disconnect();
      el.removeEventListener("canplay", tryPlay);
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("touchend", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
  }, [src, showControls]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      loop={!showControls}
      muted={muted}
      playsInline
      controls={showControls}
      preload="metadata"
      className="video-cover"
    />
  );
};

const ProjectMediaSection = ({
  media,
  title,
  href,
  poster,
  showControls = false,
  deferUntilScroll = false,
}: ProjectMediaSectionProps) => {
  const { muted } = useSound();

  if (media.type === "video" && media.source === "youtube" && media.youtubeId) {
    return (
      <VideoSection
        youtubeId={media.youtubeId}
        title={title}
        href={href}
        poster={poster}
        showControls={showControls}
        deferUntilScroll={deferUntilScroll}
      />
    );
  }

  return (
    <section className="relative w-full h-screen-stable overflow-hidden bg-background">
      {media.type === "image" && media.url ? (
        <img
          src={media.url}
          alt={title}
          loading="lazy"
          decoding="async"
          className="video-cover"
        />
      ) : media.url ? (
        <SelfHostedVideo
          src={media.url}
          poster={poster}
          muted={showControls ? muted : true}
          showControls={showControls}
        />
      ) : (
        <div className="absolute inset-0 bg-secondary" aria-hidden="true" />
      )}

      {href ? (
        <a href={href} aria-label={title} className="absolute inset-0 z-10 block" />
      ) : null}
    </section>
  );
};

export default ProjectMediaSection;