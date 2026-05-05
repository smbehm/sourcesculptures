import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import SoundToggle from "@/components/SoundToggle";
import { SoundProvider } from "@/context/SoundContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What scale of projects do you take on?",
    a: "We primarily take on medium to large-scale projects, ranging from statement pieces for private spaces to monumental public installations. Most of our work is designed to live as a focal point within an environment, both visually and experientially.",
  },
  {
    q: "Do you handle everything from concept to installation?",
    a: "Yes. We manage the entire process from initial concept through design, renderings & AR models, engineering, fabrication, logistics, and final installation.",
  },
  {
    q: "Can you fabricate and engineer complex custom sculptures?",
    a: "Absolutely. Our work often involves advanced engineering, custom fabrication, and integrated systems such as lighting, lasers, haze, motion, and structural and mechanical components. We specialize in turning ambitious ideas into fully realized physical forms.",
  },
  {
    q: "What materials do you typically work with?",
    a: "We work across a wide range of materials including stainless steel, aluminum, glass, acrylic, advanced lighting systems, and mixed media. Material selection is always driven by the concept, environment, and use cases for the sculptures.",
  },
  {
    q: "Do you create permanent installations or temporary experiences?",
    a: "Both. We design permanent installations for long-term environments as well as touring works for festivals, events, and brand activations. Each project is built with its intended lifespan and setting in mind.",
  },
  {
    q: "Can you design something completely original for our space or brand?",
    a: "Yes. Every project we take on is custom. We design from a blank slate, shaping the concept around the space, audience, and intention to create something truly one of one.",
  },
  {
    q: "What is the investment range for a project like this?",
    a: "Projects typically range from high five figures into seven figures depending on scale, materials, complexity, and installation requirements. We provide a clear proposal after an initial discussion to align scope and budget.",
  },
  {
    q: "Do you collaborate with architects, developers, or creative teams?",
    a: "Yes. We frequently collaborate with architects, developers, designers, and brand teams. We integrate seamlessly into larger projects and can work as both lead creative or a specialized partner.",
  },
  {
    q: "How are your sculptures transported and installed?",
    a: "We handle all logistics including crating, sea or air freight, and on-site installation. Projects are engineered with transport in mind, whether local or international, and installed by our team or trusted partners to ensure precision and safety.",
  },
  {
    q: "What makes your work different from other sculpture studios?",
    a: "Our work sits at the intersection of art, engineering, and decades of experience. We combine cutting edge fabrication technologies, with the most advanced modeling and CAD software and a strong artistic vision, allowing us to create pieces that are not only visually striking but will raise the bar on what is possible in the sculptural and experiential design world.",
  },
];

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
}) => (
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

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  message: z.string().trim().min(1, "Message is required").max(2000),
});

const ContactPage = () => {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Contact — SOURCEsculptures";
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    const parsed = contactSchema.safeParse({
      name: data.get("name"),
      email: data.get("email"),
      phone: data.get("phone") || "",
      message: data.get("message"),
    });

    if (!parsed.success) {
      const first = parsed.error.errors[0]?.message ?? "Please check your inputs.";
      toast({ title: "Please fix the form", description: first, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-form-notification",
          recipientEmail: "reach@sourcesculptures.com",
          idempotencyKey: `contact-${crypto.randomUUID()}`,
          templateData: parsed.data,
        },
      });
      if (error) throw error;
      toast({
        title: "Message sent",
        description: "Thanks — we'll be in touch shortly.",
      });
      formEl.reset();
    } catch (err: any) {
      toast({
        title: "Could not send",
        description: err?.message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <SoundProvider>
      <Header />
      <SoundToggle />
      <main className="relative w-full overflow-x-hidden bg-background text-foreground">
        {/* HERO */}
        <section className="px-6 sm:px-10 lg:px-16 pt-40 sm:pt-56 pb-20 sm:pb-28">
          <div className="mx-auto max-w-6xl">
            <span className="font-display tracking-cinema text-[11px] uppercase text-muted-foreground">
              Contact
            </span>
            <h1 className="font-display uppercase text-foreground font-bold leading-[0.92] text-[clamp(1.375rem,5vw,3.75rem)] max-w-5xl mt-8">
              Let's create
            </h1>
          </div>
        </section>

        {/* INFO + FORM */}
        <section className="px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-border">
          <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-16">
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
                </div>
              </div>

              <div>
                <span className="font-display tracking-cinema text-[10px] uppercase text-muted-foreground">
                  Connect
                </span>
                <p className="mt-5 text-muted-foreground leading-relaxed max-w-md">
                  Open the portal to creativity through collaboration.
                </p>
                <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
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
                disabled={submitting}
                className="group inline-flex items-center gap-3 font-display tracking-cinema text-[12px] uppercase text-foreground border-b border-foreground pb-2 hover:text-accent hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Send message"}
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
        </section>

        <footer className="px-6 py-16 text-center font-display tracking-cinema text-[10px] uppercase text-muted-foreground/70 border-t border-border">
          By Rey Jaffet & Sean Behm · © 2026 SOURCEsculptures
        </footer>
      </main>
    </SoundProvider>
  );
};

export default ContactPage;
