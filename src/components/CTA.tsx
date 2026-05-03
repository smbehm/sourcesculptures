import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section
      id="contact"
      className="relative w-full bg-background border-t border-border"
    >
      <div className="px-6 sm:px-10 lg:px-16 pt-32 sm:pt-48 pb-32 sm:pb-48">
        <div className="mx-auto max-w-6xl flex flex-col items-center text-center">
          <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
            Contact
          </span>
          <h2 className="font-display uppercase text-foreground font-bold leading-[0.92] text-[clamp(2.75rem,10vw,7.5rem)] max-w-5xl mt-8">
            Let's create
            <br />
            something timeless.
          </h2>
          <Link
            to="/contact"
            aria-label="Start your story"
            className="group mt-12 inline-flex items-center gap-3 font-display tracking-cinema text-[12px] uppercase text-foreground border-b border-foreground pb-2 hover:text-accent hover:border-accent transition-colors"
          >
            Start your story
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>

      <footer className="px-6 py-16 text-center font-display tracking-cinema text-[10px] uppercase text-muted-foreground/70 border-t border-border">
        By Rey Jaffet & Sean Behm · © 2026 SOURCEsculptures
      </footer>
    </section>
  );
};

export default CTA;
