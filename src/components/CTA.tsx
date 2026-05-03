const CTA = () => {
  return (
    <section
      id="cta"
      className="relative w-full bg-background py-32 sm:py-48 px-6 text-center border-t border-border"
    >
      <div className="mx-auto max-w-3xl">
        <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
          Let's collaborate
        </span>
        <h2 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2.5rem,9vw,5.5rem)]">
          Start your story
        </h2>
        <p className="mt-8 text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Share your timeline, references, and goals — we'll reply by email at{" "}
          <a
            href="mailto:reach@sourcesculptures.com"
            className="text-foreground underline underline-offset-4 hover:text-accent transition-colors"
          >
            reach@sourcesculptures.com
          </a>
          .
        </p>
        <a
          href="mailto:reach@sourcesculptures.com"
          className="mt-12 inline-flex items-center gap-3 font-display tracking-cinema text-[12px] uppercase text-background bg-foreground px-8 py-4 hover:bg-foreground/90 transition-colors"
        >
          Start your story →
        </a>
      </div>
      <footer className="mt-32 font-display tracking-cinema text-[10px] uppercase text-muted-foreground/70">
        By Rey Jaffet & Sean Behm · © 2026 SOURCEsculptures
      </footer>
    </section>
  );
};

export default CTA;
