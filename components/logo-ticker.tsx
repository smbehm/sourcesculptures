import { RulerRule } from "@/components/ruler-rule";

/** Static placeholders — swap for SVG/wordmarks (reference strip shows logo grid + dots). */
const stripMarks = ["Terrae", "Northlane", "Harbor Co.", "Glass & Grain", "Field Day"];

export function LogoTicker() {
  return (
    <section
      id="clients"
      className="scroll-mt-0 border-y border-white/10 bg-[#060606]"
    >
      <RulerRule className="border-t-0" />
      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-16">
        <div className="flex flex-wrap items-center justify-center gap-x-14 gap-y-10 md:gap-x-20">
          {stripMarks.map((label) => (
            <div
              key={label}
              className="font-display text-[13px] tracking-[0.42em] text-white/[0.22] uppercase"
            >
              {label}
            </div>
          ))}
        </div>
        <div
          className="mt-10 flex justify-center gap-2.5"
          aria-hidden
        >
          {stripMarks.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === 0 ? "bg-white/55" : "bg-white/15"
              }`}
            />
          ))}
        </div>
      </div>
      <RulerRule className="border-b-0" />
    </section>
  );
}
