import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import ProjectMediaSection from "@/components/ProjectMediaSection";
import SoundToggle from "@/components/SoundToggle";
import { ActiveVideoProvider } from "@/context/ActiveVideoContext";
import { SoundProvider } from "@/context/SoundContext";
import { useProject, useProjects } from "@/hooks/useProjects";
import { extractYoutubeId, getMediaPoster, getSlugThumbnail, resolveExtraVideo, resolveMainMedia, resolvePreviewMedia } from "@/lib/projectMedia";

const Project = () => {
  const { slug = "" } = useParams();
  const { data: project, isLoading } = useProject(slug);
  const { data: projects = [] } = useProjects();

  useEffect(() => {
    if (project) document.title = `${project.title} — SOURCEsculptures`;
    window.scrollTo(0, 0);
  }, [project]);

  if (isLoading) return <div className="min-h-screen bg-background" />;
  if (!project) return <Navigate to="/" replace />;

  const mainMedia = resolveMainMedia(project);
  const previewMedia = resolvePreviewMedia(project);
  const slugThumb = getSlugThumbnail(project.slug);

  type GalleryItem = { type: "image" | "video"; url: string; caption?: string };
  const galleryItems: GalleryItem[] = Array.isArray(project.gallery_items) && project.gallery_items.length > 0
    ? (project.gallery_items as unknown as GalleryItem[])
    : project.gallery.length > 0
      ? project.gallery.map((url) => ({ type: "image" as const, url }))
      : mainMedia.youtubeId
        ? [
            ...(slugThumb ? [{ type: "image" as const, url: slugThumb }] : []),
            { type: "image" as const, url: `https://i.ytimg.com/vi/${mainMedia.youtubeId}/maxresdefault.jpg` },
            { type: "image" as const, url: `https://i.ytimg.com/vi/${mainMedia.youtubeId}/hqdefault.jpg` },
            { type: "image" as const, url: `https://i.ytimg.com/vi/${mainMedia.youtubeId}/sddefault.jpg` },
          ]
        : [];

  const extraVideos = [2, 3]
    .map((slot) => ({ slot, media: resolveExtraVideo(project, slot as 2 | 3) }))
    .filter((item) => item.media && (item.media.url || item.media.youtubeId)) as { slot: number; media: NonNullable<ReturnType<typeof resolveExtraVideo>> }[];

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % Math.max(projects.length, 1)] ?? project;

  const creditsArr = Array.isArray(project.credits) ? (project.credits as unknown as { title: string; name: string }[]) : [];
  const legacyCredits = [1, 2, 3, 4, 5, 6]
    .map((n) => ({
      title: project[`credit_title_${n}` as keyof typeof project] as string | null,
      name: project[`credit_name_${n}` as keyof typeof project] as string | null,
    }))
    .filter((c) => c.title && c.name) as { title: string; name: string }[];
  const credits = creditsArr.length > 0 ? creditsArr : legacyCredits;

  const heroMedia = mainMedia.url || mainMedia.youtubeId ? mainMedia : previewMedia;

  return (
    <SoundProvider>
      <ActiveVideoProvider>
        <Header />
        <SoundToggle />
        <main className="relative w-full overflow-x-hidden bg-background text-foreground">
          {(heroMedia.url || heroMedia.youtubeId) && (
            <ProjectMediaSection
              media={heroMedia}
              title={project.title}
              poster={getMediaPoster(heroMedia, project.title, project.slug)}
              showControls={project.show_main_video_controls}
            />
          )}

          <section className="px-6 sm:px-10 py-24 sm:py-32 mx-auto max-w-6xl grid lg:grid-cols-[1.4fr_1fr] gap-16">
            <div>
              <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">Overview</span>
              <h1 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,5vw,3.5rem)]">
                {project.title}
              </h1>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {project.brief_description && <span>{project.brief_description}</span>}
                {project.client && <span>Client: {project.client}</span>}
                {project.year && <span>Year: {project.year}</span>}
                {project.categories.length > 0 && <span>{project.categories.join(" • ")}</span>}
              </div>
              {project.overview && (
                <p className="mt-8 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
                  {project.overview}
                </p>
              )}
            </div>
            {credits.length > 0 && (
              <aside>
                <div className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground border-b border-border pb-3 mb-4">
                  Credits
                </div>
                <dl className="space-y-3">
                  {credits.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm gap-4">
                      <dt className="text-muted-foreground">{c.title}</dt>
                      <dd className="text-foreground text-right">{c.name}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            )}
          </section>

          {extraVideos.map(({ slot, media }) => (
            <ProjectMediaSection
              key={slot}
              media={media}
              title={`${project.title} video ${slot}`}
              poster={getMediaPoster(media, `${project.title} video ${slot}`)}
              showControls={slot === 2 ? project.show_video_2_controls : project.show_video_3_controls}
            />
          ))}

          {galleryItems.length > 0 && (
            <section className="px-6 sm:px-10 py-20 sm:py-28">
              <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {galleryItems.map((item, i) => (
                  <figure key={i} className="relative aspect-[4/5] overflow-hidden bg-muted">
                    {item.type === "video" ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${extractYoutubeId(item.url) ?? item.url}?rel=0&modestbranding=1`}
                        title={item.caption || `${project.title} clip ${i + 1}`}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                        className="absolute inset-0 w-full h-full border-0"
                      />
                    ) : (
                      <img
                        src={item.url}
                        alt={item.caption || `${project.title} still ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                      />
                    )}
                    {item.caption && (
                      <figcaption className="absolute bottom-2 left-2 right-2 text-xs text-foreground/80 bg-background/60 backdrop-blur px-2 py-1 rounded">
                        {item.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          <section className="px-6 sm:px-10 pb-32 border-t border-border">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-12">
              <Link to="/" className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground hover:text-foreground transition-colors">
                ← Back to work
              </Link>
              {next && next.slug !== project.slug && (
                <Link to={`/projects/${next.slug}`} className="font-display uppercase text-foreground font-bold text-[clamp(1.25rem,3vw,2rem)] hover:text-accent transition-colors">
                  Next — {next.title} →
                </Link>
              )}
            </div>
          </section>
        </main>
      </ActiveVideoProvider>
    </SoundProvider>
  );
};

export default Project;
