import Link from "next/link";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-black text-white/55">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 px-6 py-20 text-center md:px-10">
        <div className="space-y-4">
          <p className="text-[10px] tracking-[0.45em] text-white/35 uppercase">
            Site
          </p>
          <Link
            href="/"
            className="font-display block text-xs tracking-[0.38em] text-white/90 uppercase transition hover:text-white"
          >
            {siteConfig.name}
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-x-12 gap-y-5 text-[11px] tracking-[0.42em] uppercase">
          <a
            href={siteConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/45 transition hover:text-white"
          >
            Instagram
          </a>
          <a
            href={siteConfig.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/45 transition hover:text-white"
          >
            LinkedIn
          </a>
          <a
            href={siteConfig.social.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/45 transition hover:text-white"
          >
            TikTok
          </a>
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-white/45 transition hover:text-white"
          >
            Email
          </a>
        </div>

        <p className="text-[10px] tracking-[0.35em] text-white/30 uppercase">
          © {year} {siteConfig.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
