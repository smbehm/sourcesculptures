import { useEffect } from "react";
import Header from "@/components/Header";
import About from "@/components/About";
import CTA from "@/components/CTA";
import { SoundProvider } from "@/context/SoundContext";

const AboutPage = () => {
  useEffect(() => {
    document.title = "About — SOURCEsculptures";
    window.scrollTo(0, 0);
  }, []);

  return (
    <SoundProvider>
      <Header />
      <main className="relative w-full overflow-x-hidden bg-background text-foreground pt-24">
        <About />
        <CTA />
      </main>
    </SoundProvider>
  );
};

export default AboutPage;
