"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AmberMenu } from "@/components/amber-menu";
import { siteConfig } from "@/lib/site";

export function AmberHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  /** Match homepage: no bar under header on home and project detail routes. */
  const minimalHeaderChrome =
    pathname === "/" || pathname.startsWith("/projects/");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[60] flex items-center justify-between px-6 py-6 md:px-10 ${
          minimalHeaderChrome
            ? ""
            : "border-b border-white/10 bg-black/85 backdrop-blur-md"
        }`}
      >
        <Link
          href="/"
          title={siteConfig.name}
          className="font-display max-w-[58vw] truncate text-[11px] font-semibold tracking-[0.42em] text-white uppercase md:text-xs md:tracking-[0.45em]"
        >
          {siteConfig.navWordmark}
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="font-display text-[11px] tracking-[0.42em] text-white uppercase md:text-xs md:tracking-[0.45em]"
          aria-expanded={menuOpen}
          aria-controls="amber-site-menu"
        >
          Menu
        </button>
      </header>
      <div id="amber-site-menu">
        <AmberMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </>
  );
}
