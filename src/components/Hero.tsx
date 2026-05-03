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

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center pointer-events-none">
        <h1 className="font-display flex flex-col items-center uppercase text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          <span className="block font-bold leading-[0.86] tracking-[-0.02em] text-[clamp(3rem,15vw,9rem)]">
            SOURCE
          </span>
          <span className="mt-[0.1em] block font-bold leading-[1.05] tracking-[0.14em] text-[clamp(1.25rem,6vw,3.25rem)]">
            SCULPTURES
          </span>
        </h1>
      </div>

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
