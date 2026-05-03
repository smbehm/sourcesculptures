import { useSound } from "@/context/SoundContext";
import VideoSection from "@/components/VideoSection";
import type { ResolvedProjectMedia } from "@/lib/projectMedia";

interface ProjectMediaSectionProps {
  media: ResolvedProjectMedia;
  title: string;
  href?: string;
  poster?: string;
  showControls?: boolean;
}

const ProjectMediaSection = ({
  media,
  title,
  href,
  poster,
  showControls = false,
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
        <video
          src={media.url}
          poster={poster}
          autoPlay
          loop={!showControls}
          muted={showControls ? muted : true}
          playsInline
          controls={showControls}
          preload="metadata"
          className="video-cover"
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