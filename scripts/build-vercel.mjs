/**
 * build-vercel.mjs — SOURCEsculptures multi-target production build
 *
 * Produces the Vercel `dist/` output tree:
 *
 *   dist/                  main portfolio app (root src/), base "/"   → sourcesculptures.com/
 *   dist/landing-site/     static "Coming Soon" splash (archived)     → /landing-site/
 *
 * Build order matters: the main app is built first because Vite empties
 * `dist/` on build; the splash is written into it afterwards.
 *
 * The legacy /SITE/ and /SITE2/ routes are no longer built — vercel.json
 * 301-redirects both to / so existing links, QR codes and press mentions
 * keep working.
 */

import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";

const LANDING_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SOURCEsculptures — Coming Soon</title>
    <meta
      name="description"
      content="SOURCEsculptures — cinematic storytelling studio. New site coming soon."
    />
    <meta name="robots" content="noindex, nofollow" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="SOURCEsculptures — Coming Soon" />
    <meta
      property="og:description"
      content="SOURCEsculptures — cinematic storytelling studio. New site coming soon."
    />
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100svh;
        display: grid;
        place-items: center;
        background-image:
          linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.26) 45%, rgba(0,0,0,0.62) 100%),
          url("/landing-site/landing-hero.jpg");
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        color: #fff;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      }
      main { text-align: center; padding: 2rem; }
      .brand {
        font-size: clamp(1.1rem, 5.5vw, 3rem);
        line-height: 0.9;
        font-weight: 700;
        letter-spacing: 0.03em;
        margin: 0;
        text-transform: uppercase;
      }
      .tag {
        margin-top: 1.1rem;
        font-size: 0.75rem;
        letter-spacing: 0.45em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.72);
      }
      .cta {
        margin-top: 2.2rem;
        display: inline-block;
        border: 1px solid rgba(255,255,255,0.35);
        padding: 0.8rem 1.5rem;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.28em;
        font-size: 0.73rem;
        color: #fff;
      }
    </style>
  </head>
  <body>
    <main>
      <h1 class="brand">SOURCE<br/>SCULPTURES</h1>
      <p class="tag">Coming Soon</p>
      <a class="cta" href="mailto:reach@sourcesculptures.com">Get in touch</a>
    </main>
  </body>
</html>
`;

async function build() {
  await rm("dist", { recursive: true, force: true });

  // 1. Main portfolio app at the domain root.
  execSync("npx vite build", { stdio: "inherit" });

  // 2. Archived splash page, parked at /landing-site/ for maintenance windows.
  await mkdir("dist/landing-site", { recursive: true });
  await copyFile("assets/SS-TOGETHER.jpg", "dist/landing-site/landing-hero.jpg");
  await writeFile("dist/landing-site/index.html", LANDING_HTML, "utf8");
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
