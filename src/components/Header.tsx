import { useState, useEffect } from "react";

const links = [
  { label: "Work", href: "#work" },
  { label: "Artists", href: "#about" },
  { label: "Concept", href: "#about" },
  { label: "Contact", href: "#cta" },
];

const Header = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5 mix-blend-difference">
        <a
          href="#intro"
          className="font-display tracking-cinema text-[11px] sm:text-[12px] uppercase text-white font-bold"
        >
          SOURCE
        </a>
        <button
          onClick={() => setOpen((v) => !v)}
          className="font-display tracking-cinema text-[11px] sm:text-[12px] uppercase text-white font-bold"
          aria-label="Toggle menu"
        >
          {open ? "CLOSE" : "MENU"}
        </button>
      </header>

      {/* Overlay menu */}
      <div
        className={`fixed inset-0 z-40 bg-background transition-opacity duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex h-full w-full flex-col items-center justify-center gap-8 px-6">
          {links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display uppercase text-foreground hover:text-accent transition-colors text-[clamp(2.5rem,8vw,5rem)] font-bold leading-none"
              style={{
                transform: open ? "translateY(0)" : "translateY(20px)",
                opacity: open ? 1 : 0,
                transition: `transform 600ms ease ${i * 70}ms, opacity 600ms ease ${i * 70}ms`,
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Header;
