"use client";

import { useLenis } from "lenis/react";
import { useEffect, useState } from "react";

type SectionDotsProps = {
  sectionIds: string[];
};

export function SectionDots({ sectionIds }: SectionDotsProps) {
  const lenis = useLenis();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = els.indexOf(entry.target as HTMLElement);
          if (idx >= 0) setActive(idx);
        });
      },
      { root: null, threshold: 0.42, rootMargin: "-12% 0px -42% 0px" },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sectionIds]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, {
        duration: 1.35,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      className="pointer-events-auto fixed right-5 top-1/2 z-[55] hidden -translate-y-1/2 flex-col gap-4 md:flex"
      aria-hidden
    >
      {sectionIds.map((id, i) => (
        <button
          key={id}
          type="button"
          onClick={() => scrollToSection(id)}
          className={`flex h-7 w-7 items-center justify-center rounded-full border transition ${
            active === i
              ? "border-white/90 bg-white"
              : "border-white/35 bg-transparent hover:border-white/55"
          }`}
          aria-label={`Scroll to section ${i + 1}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              active === i ? "bg-black" : "bg-white/35"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
