import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { projects } from "@/data/projects";

const Header = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { label: "Home", to: "/" },
    ...projects.map((p) => ({ label: p.title, to: `/projects/${p.slug}` })),
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 py-5 mix-blend-difference">
        <Link
          to="/"
          className="font-display tracking-cinema text-[11px] sm:text-[12px] uppercase text-white font-bold"
        >
          SOURCE
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="font-display tracking-cinema text-[11px] sm:text-[12px] uppercase text-white font-bold"
          aria-label="Toggle menu"
        >
          {open ? "CLOSE" : "MENU"}
        </button>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-background transition-opacity duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <nav className="flex h-full w-full flex-col items-center justify-center gap-5 sm:gap-7 px-6 overflow-y-auto py-24">
          {links.map((l, i) => (
            <Link
              key={l.label}
              to={l.to}
              onClick={() => setOpen(false)}
              className="font-display uppercase text-foreground hover:text-accent transition-colors text-[clamp(1.5rem,5vw,3.5rem)] font-bold leading-none text-center"
              style={{
                transform: open ? "translateY(0)" : "translateY(20px)",
                opacity: open ? 1 : 0,
                transition: `transform 600ms ease ${i * 60}ms, opacity 600ms ease ${i * 60}ms`,
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Header;
