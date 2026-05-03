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
];

const About = () => {
  return (
    <section
      id="about"
      className="relative w-full bg-background py-28 sm:py-40 px-6 sm:px-10"
    >
      <div className="mx-auto max-w-5xl">
        <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
          Studio
        </span>
        <h2 className="mt-6 font-display text-foreground text-[clamp(1.6rem,4vw,2.75rem)] leading-[1.2] font-medium max-w-3xl">
          We're a videography studio driven by a love for cinematic storytelling and intentional
          filmmaking. From brand films and commercials to weddings and editorial pieces, we bring a
          crafted, artful approach to every frame.
        </h2>

        <div className="mt-20">
          <h3 className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground mb-8">
            Services
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
            {services.map((s) => (
              <li
                key={s}
                className="border-t border-border pt-3 font-display text-foreground text-base sm:text-lg"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default About;
