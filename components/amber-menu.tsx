"use client";

import Link from "next/link";
import { useLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import { useEffect, type MouseEvent } from "react";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

type AmberMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function AmberMenu({ open, onClose }: AmberMenuProps) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const lenis = useLenis();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const goHash = (id: string, e: MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      e.preventDefault();
      const el = document.getElementById(id);
      if (el && lenis) {
        lenis.scrollTo(el, {
          duration: 1.35,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/96 backdrop-blur-md"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <div className="flex items-center justify-between px-6 py-6 md:px-10">
        <span className="font-display text-xs tracking-[0.4em] text-white/40 uppercase">
          {siteConfig.navWordmark}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="font-display text-xs tracking-[0.35em] text-white uppercase transition hover:text-white/70"
        >
          Close
        </button>
      </div>
      <nav className="flex flex-1 flex-col justify-center gap-8 px-8 pb-24 md:px-16">
        <Link
          href="/#intro"
          className="font-display text-left text-3xl tracking-wide text-white uppercase transition hover:text-white/70 md:text-4xl"
          onClick={(e) => goHash("intro", e)}
        >
          Home
        </Link>
        {projects.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}/`}
            className="font-display text-left text-3xl tracking-wide text-white uppercase transition hover:text-white/70 md:text-4xl"
            onClick={onClose}
          >
            {p.title}
          </Link>
        ))}
        <Link
          href="/#about"
          className="font-display text-left text-3xl tracking-wide text-white uppercase transition hover:text-white/70 md:text-4xl"
          onClick={(e) => goHash("about", e)}
        >
          About
        </Link>
        <Link
          href="/#cta"
          className="font-display text-left text-3xl tracking-wide text-white uppercase transition hover:text-white/70 md:text-4xl"
          onClick={(e) => goHash("cta", e)}
        >
          Contact
        </Link>
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/10 pt-10 text-xs tracking-[0.35em] text-white/55 uppercase">
          <a
            href={`mailto:${siteConfig.email}`}
            className="transition hover:text-white"
          >
            Email
          </a>
          <Link href="/" className="transition hover:text-white" onClick={onClose}>
            Work index
          </Link>
        </div>
      </nav>
    </div>
  );
}
