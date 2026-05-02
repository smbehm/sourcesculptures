import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RulerRule } from "@/components/ruler-rule";
import { YouTubeAutoplay } from "@/components/youtube-autoplay";
import { ProjectCard } from "@/components/project-card";
import {
  getOtherProjects,
  getProjectBySlug,
  projects,
} from "@/lib/projects";
import { siteConfig } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project" };
  const description = project.overview[0] ?? siteConfig.tagline;
  return {
    title: project.title,
    description,
    alternates: {
      canonical: `/projects/${project.slug}/`,
    },
    openGraph: {
      title: `${project.title} — ${siteConfig.name}`,
      description,
      type: "article",
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const more = getOtherProjects(project.slug, 4);
  const headline = project.overview[0] ?? project.title;
  const detailParas = project.overview.slice(1);

  return (
    <main className="w-full min-w-0 pt-20 max-md:pt-0">
      <article>
        <YouTubeAutoplay
          variant="hero"
          videoId={project.youtubeId}
          title={project.title}
        />

        <section className="border-t border-white/10 bg-black">
          <div className="mx-auto grid max-w-[1400px] gap-14 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-x-24 lg:gap-y-0 lg:px-12 lg:py-20">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.38em] text-white uppercase">
                Overview
              </p>
              <p className="mt-3 font-display text-xs tracking-[0.28em] text-white/55 uppercase sm:text-sm">
                {project.title} · {project.year}
              </p>
              <h1 className="mt-8 max-w-xl text-[clamp(1.35rem,2.6vw,2.05rem)] font-bold leading-snug tracking-tight text-white">
                {headline}
              </h1>
              {detailParas.length > 0 ? (
                <div className="mt-8 space-y-6 text-base leading-relaxed text-white/65">
                  {detailParas.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="lg:pt-0">
              <p className="text-[10px] font-semibold tracking-[0.38em] text-white uppercase lg:text-right">
                Credits
              </p>
              <div
                className="mt-4 border-b border-white/35 lg:ml-auto lg:max-w-md"
                aria-hidden
              />
              <dl className="mt-6 space-y-0 lg:ml-auto lg:max-w-md">
                {project.credits.map((c) => (
                  <div
                    key={c.role + c.name}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-white/10 py-3.5 text-sm text-white/90 last:border-b-0"
                  >
                    <dt className="text-white/55">{c.role}</dt>
                    <dd className="text-right font-normal text-white/90">
                      {c.name}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section className="bg-zinc-950/40">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="mb-10 flex items-end justify-between gap-6">
              <h2 className="font-display text-2xl tracking-wide text-white uppercase">
                More projects
              </h2>
              <Link
                href="/"
                className="text-[11px] tracking-[0.28em] text-white/45 uppercase transition hover:text-white"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {more.map((p) => (
                <ProjectCard key={p.slug} project={p} />
              ))}
            </div>
          </div>
          <RulerRule />
        </section>
      </article>
    </main>
  );
}
