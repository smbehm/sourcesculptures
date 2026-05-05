import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const sections = [
  {
    value: "about-us",
    label: "About Us",
    body: (
      <>
        Together, Rey Jaffet & Sean Behm create immersive and monumental works that act as portals, inviting people into moments of presence, connection, and awe. Their sculptures are not just objects, but living experiences: reflections of light, energy, and the infinite.
        <br /><br />
        Rooted in trust, passion, and a shared vision, their collaboration transforms ambitious ideas into tangible realities. Each piece is a testament to what becomes possible when creativity is guided by love, curiosity, and fearless execution. Their journey continues to unfold, driven by gratitude, exploration, and a deep commitment to inspiring others through art that resonates far beyond the physical form.
      </>
    ),
  },
  {
    value: "about-rey",
    label: "About Rey Jaffet",
    body: (
      <>
        Rey Jaffet is an artist whose life and work are devoted to creating portals into the infinite, a bridge between individual experience and collective consciousness. From a young age, his path has been guided by immersion in art, leading to the creation of powerful connections, vivid experiences, and large-scale works that resonate across cultures and communities.
        <br /><br />
        Working across stainless steel, fire, lighting systems, painting, and mixed media, Rey's creations explore the balance between movement and stillness, energy and form. His intention is clear: to inspire love over fear, to reveal the beauty of interconnectedness, and to spark the realization that we are all part of something greater.
        <br /><br />
        A staple of Art Basel Miami Beach since 2011, Rey has collaborated with globally recognized brands and institutions including Samsung, Netflix, Coca-Cola, the Miami Heat, Aston Martin, and Burning Man. His public works, murals, and installations have reached international audiences, including the iconic 14-story mural Declaration of Hope. Through both art and life, Rey continues to create experiences that evoke wonder and expand perception.
      </>
    ),
  },
  {
    value: "about-sean",
    label: "About Sean Behm",
    body: (
      <>
        Sean Behm is a visionary designer, fabricator, and entrepreneur known for bringing ambitious ideas into physical reality at scale. As a partner and senior designer at Miami Design Shop and co-founder of The Kazbah, Sean operates at the intersection of architecture, art, experiential design and fabrication, crafting environments that are as technically refined as they are emotionally impactful.
        <br /><br />
        His work spans collaborations with global leaders such as Tiffany & Co., Cartier, and Formula 1, where he has delivered with his team, immersive, high-precision installations that push the boundaries of fabrication and storytelling.
        <br /><br />
        Beyond the studio, Sean is deeply committed to giving back, supporting creative education and empowering the next generation through hands-on mentorship in design, music, and architecture. With a relentless drive for innovation and a passion for meaningful impact, he continues to shape not just spaces, but communities.
      </>
    ),
  },
];

const About = () => {
  return (
    <section
      id="about"
      className="relative w-full bg-background py-28 sm:py-40 px-6 sm:px-10"
    >
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-4">
          <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
            About
          </span>
          <h2 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,5vw,3.5rem)]">
            The story
            <br />
            behind.
          </h2>
        </div>
        <div className="lg:col-span-8">
          <Accordion
            type="single"
            collapsible
            defaultValue="about-us"
            className="w-full"
          >
            {sections.map((s) => (
              <AccordionItem key={s.value} value={s.value} className="border-border">
                <AccordionTrigger className="py-6 text-left text-foreground hover:no-underline font-display uppercase tracking-wider text-sm sm:text-base">
                  {s.label}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base max-w-2xl">
                  {s.body}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default About;
