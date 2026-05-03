import type { Metadata } from "next";
import "./globals.css";
import { LenisProvider } from "@/components/lenis-provider";
import { AmberHeader } from "@/components/amber-header";
import { SiteAudioShell } from "@/components/site-audio-shell";
import { SiteFooter } from "@/components/site-footer";
import { SitePreloader } from "@/components/site-preloader";
import { DeployVersionBadge } from "@/components/deploy-version-badge";
import { siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description:
    "SOURCEsculptures is a creative production studio specializing in cinematic storytelling — brand films, commercials, weddings, and editorial work.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description:
      "Creative production studio for brand films, commercials, weddings, and editorial cinematography.",
    images: [
      {
        url: siteConfig.heroImageUrl,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description:
      "Creative production studio for cinematic storytelling and intentional filmmaking.",
    images: [siteConfig.heroImageUrl],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-full antialiased">
      <body className="min-h-full bg-black text-zinc-100">
        {/* Preloader must be first — renders above everything at z-9999 */}
        <SitePreloader />
        <LenisProvider>
          <SiteAudioShell>
            <JsonLd />
            <div className="flex min-h-full flex-col">
              <AmberHeader />
              <div className="flex-1">{children}</div>
              <SiteFooter />
            </div>
          </SiteAudioShell>
          <DeployVersionBadge />
        </LenisProvider>
      </body>
    </html>
  );
}
