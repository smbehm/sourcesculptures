import Image from "next/image";
import Link from "next/link";
import { ParallaxProjectStack } from "@/components/parallax-project-stack";
import { LogoTicker } from "@/components/logo-ticker";
import { RulerRule } from "@/components/ruler-rule";
import { projects } from "@/lib/projects";
import { siteConfig } from "@/lib/site";

const aboutCopy =
  "We're a videography studio driven by a love for cinematic storytelling and intentional filmmaking. From brand films and commercials to weddings and editorial pieces, we bring a crafted, artful approach to every frame.";

const services = [
  "Brand Films",
  "Commercials & Ad Spots",
  "Event Cinematography",
  "Editorial & Fashion Films",
  "Wedding Films",
  "Product Films",
  "Music Videos",
  "Documentary Shorts",
  "Social Media Visuals",
  "Creative Direction",
] as const;

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <>
      <main className="bg-black">
        <section
          id="intro"
          className="relative max-lg:-mb-[14px] min-h-[100svh] overflow-hidden md:min-h-[100dvh]"
        >
          <Image
            src={siteConfig.heroImageUrl}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Legibility + depth over hero still (warm/neutral; swap `public/hero.jpg` freely) */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/70"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-red-950/10 mix-blend-overlay"
            aria-hidden
          />

          <div className="relative flex min-h-[100svh] flex-col items-center justify-center px-5 pb-40 pt-32 text-center sm:px-8 md:min-h-[100dvh]">
            <h1 className="font-display max-w-[min(100%,56rem)] text-balance text-[clamp(2.6rem,12.5vw,9.5rem)] font-bold leading-[0.86] tracking-[-0.02em] text-white uppercase drop-shadow-[0_6px_40px_rgba(0,0,0,0.45)]">
              {siteConfig.heroLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
          </div>

          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1.5 px-6 text-center text-[10px] leading-relaxed tracking-[0.2em] text-white/90 uppercase sm:bottom-10 sm:text-[11px] sm:tracking-[0.24em]">
            <span className="text-white/90">{siteConfig.tagline}</span>
            <span className="text-white/60">{siteConfig.location}</span>
            <span className="text-white/45">
              © {year} {siteConfig.legalName}
            </span>
          </div>
        </section>

        <ParallaxProjectStack projects={projects} />

        <section
          id="about"
          className="border-y border-white/10 bg-[#040404] px-6 py-24 md:px-14 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <h2 className="text-pretty font-[family-name:var(--font-inter)] text-2xl font-light leading-[1.35] tracking-[-0.01em] text-white/90 sm:text-3xl md:text-4xl md:leading-[1.25] lg:text-[2.65rem] lg:leading-[1.2]">
              {aboutCopy}
            </h2>

            <div className="mt-20 border-t border-white/10 pt-16">
              <h3 className="font-display text-[11px] tracking-[0.45em] text-white/40 uppercase">
                Services
              </h3>
              <div className="mt-10 grid grid-cols-1 gap-px bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <div
                    key={s}
                    className="bg-[#040404] px-5 py-4 text-[13px] text-white/65 md:px-6 md:py-5"
                  >
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <LogoTicker />

        <section
          id="cta"
          className="border-t border-white/10 bg-black px-6 py-28 text-center md:py-36"
        >
          <RulerRule className="mx-auto mb-14 max-w-lg opacity-70" />
          <p className="text-[10px] tracking-[0.45em] text-white/40 uppercase">
            Let&apos;s collaborate
          </p>
          <h2 className="font-display mt-6 text-4xl tracking-[0.06em] text-white uppercase sm:text-5xl md:text-[3.25rem] md:tracking-[0.08em]">
            Start your story
          </h2>
          <p className="mx-auto mt-8 max-w-lg font-[family-name:var(--font-inter)] text-sm leading-relaxed text-white/50">
            Share your timeline, references, and goals — we&apos;ll reply by
            email at{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-white/85 underline decoration-white/20 underline-offset-4 transition hover:decoration-white/50"
            >
              {siteConfig.email}
            </a>
            .
          </p>
          <Link
            href={`mailto:${siteConfig.email}`}
            className="font-display mt-12 inline-flex border border-white/35 bg-white/[0.06] px-10 py-4 text-[11px] tracking-[0.52em] text-white uppercase transition hover:border-white/55 hover:bg-white/10"
          >
            Start your story
          </Link>
          <RulerRule className="mx-auto mt-16 max-w-lg opacity-70" />
        </section>
      </main>
    </>
  );
}
