import { useSound } from "@/context/SoundContext";

const HERO_ID = "Bv-a_7zH88o";

const Hero = () => {
  const { muted } = useSound();
  const src = `https://www.youtube-nocookie.com/embed/${HERO_ID}?autoplay=1&mute=${
    muted ? 1 : 0
  }&controls=0&loop=1&playlist=${HERO_ID}&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&showinfo=0&enablejsapi=1`;

  return (
    <section
      id="intro"
      className="relative w-full h-screen-stable overflow-hidden bg-background"
    >
      {/* Poster fallback */}
      <img
        src={`https://i.ytimg.com/vi/${HERO_ID}/maxresdefault.jpg`}
        alt=""
        aria-hidden
        className="video-cover"
        fetchPriority="high"
        decoding="async"
      />

      {/* Video iframe scaled to cover */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -50%)",
            width: "max(100vw, calc(100svh * 16 / 9))",
            height: "max(100svh, calc(100vw * 9 / 16))",
          }}
        >
          <iframe
            key={muted ? "m" : "u"}
            src={src}
            title="SOURCEsculptures hero reel"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="block w-full h-full border-0 pointer-events-none"
          />
        </div>
      </div>

      {/* Veil for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60 pointer-events-none" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center px-5 text-center pointer-events-none">
        <h1 className="font-display flex flex-col items-center uppercase text-white drop-shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
          <span className="block font-bold leading-[0.86] tracking-[-0.02em] text-[clamp(2.75rem,14vw,7rem)]">
            SOURCE
          </span>
          <span className="mt-[0.1em] block font-bold leading-[1.05] tracking-[0.14em] text-[clamp(1.15rem,6vw,3rem)]">
            SCULPTURES
          </span>
        </h1>
        <p className="mt-8 font-display tracking-cinema text-[10px] sm:text-[11px] uppercase text-white/70">
          By Rey Jaffet & Sean Behm
        </p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 font-display tracking-cinema text-[10px] uppercase text-white/50">
        Scroll
      </div>
    </section>
  );
};

export default Hero;
