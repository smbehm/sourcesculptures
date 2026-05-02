import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";

type ProjectCardProps = {
  project: Project;
  priority?: boolean;
};

export function ProjectCard({ project, priority }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.slug}/`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
    >
      <article className="overflow-hidden border border-white/10 bg-zinc-950/40 transition group-hover:border-white/25">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={project.coverImageUrl}
            alt=""
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="text-xs tracking-widest text-white/60 uppercase">
              {project.label} · {project.year}
            </p>
            <h3 className="font-display mt-2 text-2xl tracking-wide text-white uppercase sm:text-3xl">
              {project.title}
            </h3>
          </div>
        </div>
      </article>
    </Link>
  );
}
