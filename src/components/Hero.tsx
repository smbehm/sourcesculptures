import heroImage from "@/assets/hero-home.jpg";

const Hero = () => {
  return (
    <section
      id="intro"
      className="relative w-full h-screen-stable overflow-hidden bg-background"
    >
      <img
        src={heroImage}
        alt="SOURCEsculptures — illuminated sculptures at a festival"
        className="video-cover"
        fetchPriority="high"
        decoding="async"
      />

      {/* Subtle veil for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

      {/* Hidden H1 for SEO/a11y */}
      <h1 className="sr-only">SOURCEsculptures</h1>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-center">
        <p className="font-display tracking-[0.1em] text-[10px] sm:text-[11px] uppercase text-white/80">
          By: Rey Jaffet & Sean Behm
        </p>
        <p className="mt-1 font-display tracking-[0.1em] text-[10px] uppercase text-white/60">
          © 2026 SOURCEsculptures
        </p>
      </div>
    </section>
  );
};

export default Hero;
