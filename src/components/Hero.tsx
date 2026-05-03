const Hero = () => {
  return (
    <section
      id="intro"
      className="relative w-full h-screen-stable overflow-hidden bg-background"
    >
      {/* Hero image background */}
      <img
        src="https://sourcesculptures.com/hero.jpg"
        alt="SOURCEsculptures cinematic hero"
        className="video-cover"
        fetchPriority="high"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/75" aria-hidden />
      <div className="absolute inset-0 bg-[hsl(12_60%_25%_/_0.12)] mix-blend-overlay" aria-hidden />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center">
        <h1 className="font-display flex flex-col items-center uppercase text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <span className="block font-bold leading-[0.86] tracking-[-0.02em] text-[clamp(2.75rem,14vw,7rem)]">
            SOURCE
          </span>
          <span className="mt-[0.1em] block font-bold leading-[1.05] tracking-[0.14em] text-[clamp(1.15rem,6vw,3rem)]">
            SCULPTURES
          </span>
        </h1>
        <p className="mt-8 font-display tracking-cinema text-[10px] sm:text-[11px] uppercase text-white/60">
          Cinematic Storytelling · Est. 2026
        </p>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 font-display tracking-cinema text-[10px] uppercase text-white/50">
        Scroll
      </div>
    </section>
  );
};

export default Hero;
