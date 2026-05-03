import VideoSection from "./VideoSection";

export interface ProjectBlockProps {
  id: string;
  youtubeId: string;
  eyebrow?: string;
  title: string;
  description: string;
  images?: string[];
  href?: string;
}

const ProjectBlock = ({ id, youtubeId, eyebrow, title, description, images, href }: ProjectBlockProps) => {
  const gallery =
    images && images.length > 0
      ? images
      : [
          `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg`,
        ];

  return (
    <section id={id} className="relative w-full bg-background">
      <VideoSection
        youtubeId={youtubeId}
        eyebrow={eyebrow}
        title={title}
        href={href}
      />

      {/* Description */}
      <div className="px-6 sm:px-10 py-24 sm:py-32 mx-auto max-w-4xl">
        <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
          {eyebrow ?? "Project"}
        </span>
        <h3 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,6vw,4rem)]">
          {title}
        </h3>
        <p className="mt-8 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      {/* Gallery */}
      <div className="px-6 sm:px-10 pb-28 sm:pb-40">
        <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {gallery.map((src, i) => (
            <div
              key={i}
              className="relative aspect-[4/5] overflow-hidden bg-muted"
            >
              <img
                src={src}
                alt={`${title} still ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProjectBlock;
