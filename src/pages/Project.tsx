import { useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import VideoSection from "@/components/VideoSection";
import { SoundProvider } from "@/context/SoundContext";
import { ActiveVideoProvider } from "@/context/ActiveVideoContext";
import { useProject, useProjects } from "@/hooks/useProjects";

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

  const mainYt = project.main_video_youtube_id || project.preview_video_youtube_id;

  const extractYtId = (s: string) => {
    const m = s?.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|shorts\/))([\w-]{11})/);
    return m ? m[1] : s;
  };

  type GalleryItem = { type: "image" | "video"; url: string; caption?: string };
  const galleryItems: GalleryItem[] = Array.isArray((project as any).gallery_items) && (project as any).gallery_items.length > 0
    ? ((project as any).gallery_items as GalleryItem[])
    : (project.gallery && project.gallery.length > 0
        ? project.gallery.map((url) => ({ type: "image" as const, url }))
        : mainYt
        ? [
            { type: "image" as const, url: `https://i.ytimg.com/vi/${mainYt}/maxresdefault.jpg` },
            { type: "image" as const, url: `https://i.ytimg.com/vi/${mainYt}/hqdefault.jpg` },
            { type: "image" as const, url: `https://i.ytimg.com/vi/${mainYt}/sddefault.jpg` },
          ]
        : []);

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % Math.max(projects.length, 1)] ?? project;

  const creditsArr = Array.isArray((project as any).credits) ? (project as any).credits as { title: string; name: string }[] : [];
  const legacyCredits = [1, 2, 3, 4, 5, 6]
    .map((n) => ({
      title: (project as any)[`credit_title_${n}`] as string | null,
      name: (project as any)[`credit_name_${n}`] as string | null,
    }))
    .filter((c) => c.title && c.name) as { title: string; name: string }[];
  const credits = creditsArr.length > 0 ? creditsArr : legacyCredits;

  return (
    <SoundProvider>
      <ActiveVideoProvider>
        <Header />
        <SoundToggle />
        <main className="relative w-full overflow-x-hidden bg-background text-foreground">
          {mainYt && (
            <VideoSection
              youtubeId={mainYt}
              eyebrow={project.categories[0] ?? project.brief_description ?? undefined}
              title={project.title}
            />
          )}

          <section className="px-6 sm:px-10 py-24 sm:py-32 mx-auto max-w-6xl grid lg:grid-cols-[1.4fr_1fr] gap-16">
            <div>
              <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">Overview</span>
              <h1 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,5vw,3.5rem)]">
                {project.brief_description || project.title}
              </h1>
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
                    <div key={i} className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">{c.title}</dt>
                      <dd className="text-foreground">{c.name}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
            )}
          </section>

          {gallery.length > 0 && (
            <section className="px-6 sm:px-10 pb-28 sm:pb-40">
              <div className="mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {gallery.map((src, i) => (
                  <div key={i} className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={src}
                      alt={`${project.title} still ${i + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  </div>
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
