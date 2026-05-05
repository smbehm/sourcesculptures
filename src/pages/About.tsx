import { useEffect } from "react";
import Header from "@/components/Header";
import About from "@/components/About";
import CTA from "@/components/CTA";
import { SoundProvider } from "@/context/SoundContext";
import reySeanImage from "@/assets/rey-sean.png";

const AboutPage = () => {
  useEffect(() => {
    document.title = "About — SOURCEsculptures";
    window.scrollTo(0, 0);
  }, []);

  return (
    <SoundProvider>
      <Header />
      <main className="relative w-full overflow-x-hidden bg-background text-foreground pt-24">
        <section className="px-6 sm:px-10 lg:px-16 pt-12 sm:pt-20">
          <div className="mx-auto max-w-6xl">
            <img
              src={reySeanImage}
              alt="Rey Jaffet and Sean Behm in the studio"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </section>
        <About />
        <CTA />
      </main>
    </SoundProvider>
  );
};

export default AboutPage;
