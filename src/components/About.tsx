const services = [
  "CAD / CAM Design",
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
        <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground text-left font-bold">
          ABOUT US
        </span>
        <h2 className="mt-6 font-display text-foreground leading-[1.2] font-medium w-full text-xl text-justify py-0 my-[2px]">
          Together, Rey Jaffet & Sean Behm create immersive works that act as portals, inviting people into moments of presence, connection, and awe. Their sculptures are not just objects, but living experiences: reflections of light, energy, and the infinite.
          <br /><br />
          Rooted in trust, passion, and a shared vision, their collaboration transforms ambitious ideas into tangible realities. Each piece is a testament to what becomes possible when creativity is guided by love, curiosity, and fearless execution. Their journey continues to unfold, driven by gratitude, exploration, and a deep commitment to inspiring others through art that resonates far beyond the physical form.
        </h2>

        <div className="mt-20">
          <h3 className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground mb-8">
            PASSION'S 
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
