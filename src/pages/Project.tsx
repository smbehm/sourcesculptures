import { useEffect } from "react";
import { Navigate, useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import VideoSection from "@/components/VideoSection";
import { SoundProvider } from "@/context/SoundContext";
import { ActiveVideoProvider } from "@/context/ActiveVideoContext";
import { getProject, projects } from "@/data/projects";

const Project = () => {
  const { slug = "" } = useParams();
  const project = getProject(slug);

  useEffect(() => {
    if (project) document.title = `${project.title} — SOURCEsculptures`;
    window.scrollTo(0, 0);
  }, [project]);

  if (!project) return <Navigate to="/" replace />;

  const gallery =
    project.images && project.images.length > 0
      ? project.images
      : [
          `https://i.ytimg.com/vi/${project.youtubeId}/maxresdefault.jpg`,
          `https://i.ytimg.com/vi/${project.youtubeId}/hqdefault.jpg`,
          `https://i.ytimg.com/vi/${project.youtubeId}/sddefault.jpg`,
        ];

  const idx = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(idx + 1) % projects.length];

  return (
    <SoundProvider>
      <Header />
      <SoundToggle />
      <main className="relative w-full overflow-x-hidden bg-background text-foreground">
        <VideoSection
          youtubeId={project.youtubeId}
          eyebrow={project.eyebrow}
          title={project.title}
        />

        <section className="px-6 sm:px-10 py-24 sm:py-32 mx-auto max-w-4xl">
          <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
            {project.eyebrow}
          </span>
          <h1 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,6vw,4rem)]">
            {project.title}
          </h1>
          <p className="mt-8 text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl">
            {project.description}
          </p>
        </section>

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

        <section className="px-6 sm:px-10 pb-32 border-t border-border">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-12">
            <Link
              to="/"
              className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to work
            </Link>
            <Link
              to={`/projects/${next.slug}`}
              className="font-display uppercase text-foreground font-bold text-[clamp(1.25rem,3vw,2rem)] hover:text-accent transition-colors"
            >
              Next — {next.title} →
            </Link>
          </div>
        </section>
      </main>
    </SoundProvider>
  );
};

export default Project;
