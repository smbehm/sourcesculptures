import { useState, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What types of projects do you specialize in?",
    a: "Cinematic brand films, fashion campaigns, music videos, and long-form storytelling for studios, labels, and houses.",
  },
  {
    q: "Where are you based, and do you travel for projects?",
    a: "We are based in Los Angeles and work globally. Travel is part of nearly every production we take on.",
  },
  {
    q: "How do we start a project?",
    a: "Send us a note with your timeline, references, and goals. We'll reply within 48 hours to set up an intro call.",
  },
  {
    q: "What is your typical turnaround time?",
    a: "Pre-production usually takes 2–4 weeks, with delivery 4–8 weeks after the shoot, depending on scope.",
  },
  {
    q: "Do you offer creative direction?",
    a: "Yes — creative direction, treatment writing, and art direction are core to how we work.",
  },
  {
    q: "Can we request a specific style?",
    a: "Absolutely. We tailor every project to the world we're building together, from grain and grade to pace and sound.",
  },
  {
    q: "What is your pricing structure?",
    a: "Each project is quoted individually based on scope, crew, locations, and post. We provide a detailed breakdown after the intro call.",
  },
  {
    q: "Do you work with brands and individuals?",
    a: "Both. We collaborate with global brands, independent labels, and private clients who care about craft.",
  },
];

const CTA = () => {
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const reveal = () => {
    setExpanded(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "");
    const email = String(data.get("email") || "");
    const phone = String(data.get("phone") || "");
    const message = String(data.get("message") || "");
    const body = encodeURIComponent(
      `${message}\n\n— ${name}\n${email}${phone ? "\n" + phone : ""}`
    );
    window.location.href = `mailto:reach@sourcesculptures.com?subject=${encodeURIComponent(
      "New inquiry from " + name
    )}&body=${body}`;
  };

  return (
    <section
      id="contact"
      className="relative w-full bg-background border-t border-border"
    >
      {/* HERO */}
      <div className="px-6 sm:px-10 lg:px-16 pt-32 sm:pt-48 pb-20 sm:pb-28">
        <div className="mx-auto max-w-6xl">
          <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
            Contact
          </span>
          <button
            onClick={reveal}
            aria-label="Start your story"
            className="group block text-left mt-8 w-full"
          >
            <h2 className="font-display uppercase text-foreground font-bold leading-[0.92] text-[clamp(2.75rem,10vw,7.5rem)] max-w-5xl transition-opacity group-hover:opacity-80">
              Let's create
              <br />
              something timeless.
            </h2>
            <span className="mt-10 inline-flex items-center gap-3 font-display tracking-cinema text-[12px] uppercase text-foreground border-b border-foreground pb-2 group-hover:text-accent group-hover:border-accent transition-colors">
              Start your story
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT */}
      <div
        className={`overflow-hidden transition-[max-height,opacity] duration-700 ease-out ${
          expanded ? "max-h-[6000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div
          ref={formRef}
          className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-border"
        >
          <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Info */}
            <div className="lg:col-span-5 space-y-12">
              <div>
                <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
                  Reach us
                </span>
                <div className="mt-5 space-y-3 text-foreground">
                  <a
                    href="mailto:reach@sourcesculptures.com"
                    className="block hover:text-accent transition-colors"
                  >
                    reach@sourcesculptures.com
                  </a>
                  <a
                    href="tel:+13105550199"
                    className="block text-muted-foreground hover:text-foreground transition-colors"
                  >
                    +1 (310) 555 0199
                  </a>
                </div>
              </div>

              <div>
                <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
                  Studio
                </span>
                <p className="mt-5 text-foreground leading-relaxed">
                  8427 Melrose Avenue, Suite 205
                  <br />
                  Los Angeles, CA 90069 USA
                </p>
              </div>

              <div>
                <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
                  Follow us
                </span>
                <div className="mt-5 flex gap-8">
                  {[
                    { label: "Instagram", href: "#" },
                    { label: "Vimeo", href: "#" },
                    { label: "YouTube", href: "#" },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-7 space-y-10"
              noValidate
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <Field name="name" label="Name *" required />
                <Field name="email" label="Email *" type="email" required />
              </div>
              <Field name="phone" label="Phone" type="tel" />
              <Field name="message" label="Message *" textarea required />

              <button
                type="submit"
                className="group inline-flex items-center gap-3 font-display tracking-cinema text-[12px] uppercase text-foreground border-b border-foreground pb-2 hover:text-accent hover:border-accent transition-colors"
              >
                Send message
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </button>
            </form>
          </div>

          {/* FAQ */}
          <div className="mx-auto max-w-6xl mt-32 sm:mt-44 grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
                FAQ
              </span>
              <h3 className="mt-6 font-display uppercase text-foreground font-bold leading-[0.95] text-[clamp(2rem,5vw,3.5rem)]">
                Questions,
                <br />
                answered.
              </h3>
            </div>
            <div className="lg:col-span-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem
                    key={i}
                    value={`item-${i}`}
                    className="border-border"
                  >
                    <AccordionTrigger className="py-6 text-left text-foreground hover:no-underline font-display uppercase tracking-wider text-sm sm:text-base">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed pb-6 text-base max-w-2xl">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      <footer className="px-6 py-16 text-center font-display tracking-cinema text-[10px] uppercase text-muted-foreground/70 border-t border-border">
        By Rey Jaffet & Sean Behm · © 2026 SOURCEsculptures
      </footer>
    </section>
  );
};

const Field = ({
  name,
  label,
  type = "text",
  required,
  textarea,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  textarea?: boolean;
}) => {
  return (
    <label className="block group">
      <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={4}
          maxLength={2000}
          className="mt-3 w-full bg-transparent border-0 border-b border-border focus:border-foreground focus:outline-none focus:ring-0 py-3 text-foreground placeholder:text-muted-foreground transition-colors resize-none"
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          maxLength={255}
          className="mt-3 w-full bg-transparent border-0 border-b border-border focus:border-foreground focus:outline-none focus:ring-0 py-3 text-foreground placeholder:text-muted-foreground transition-colors"
        />
      )}
    </label>
  );
};

export default CTA;
