# Source Sculptures

Build a clean, high-performance rebuild of my website sourcesculptures.com using the same content and videos, but fixing all current issues.

🎯 Context:

 I originally built this site using Cursor (inspired by Framer Amber template)

 The current version has scrolling issues, especially on mobile

 I want a better, stable version, not a direct copy of broken behavior

📦 Content:

 Use ALL content from my site:

 All videos

 All section titles (e.g. “Obsidian”)

 All text and structure

 Keep the same storytelling and order

🎥 Core Concept (VERY IMPORTANT):

This is a video-first cinematic website

 Each section = fullscreen video

 Videos must:

 autoplay

 muted

 loop

 Text overlays appear on top of videos

⚙️ FIX CURRENT PROBLEMS:

The current site has these issues — FIX them:

 Glitches between video sections when scrolling

 Black/white gaps on mobile

 Unstable scroll behavior

 Video flickering or jumping

 Poor mobile responsiveness

🧱 Layout & Style:

 Inspired by Framer Amber template

 Minimal, luxury, artistic

 Clean typography and spacing

 Dark cinematic look

📱 Mobile (TOP PRIORITY):

 Perfect smooth scrolling on phone

 No gaps between sections

 Stable height (fix 100vh issue)

 No horizontal scroll

 Videos must scale perfectly (object-fit: cover)

🚀 Performance:

 Lazy load videos

 Optimize video size

 Only load videos when needed

 Fast initial load

⚠️ Technical Requirements:

 Use smooth scrolling (no snap if it causes issues)

 Use hardware-accelerated transforms

 Avoid layout shifts

 Ensure each section fills viewport correctly

❌ DO NOT:

 Reuse broken logic from the old version

 Replace videos with images

 Add heavy animations that break performance

💡 Final Goal:

Create a stable, smooth, premium version of my website that works perfectly on both desktop and mobile, especially fixing the scrolling experience between video sections.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sourcesculptures.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48432e5a-6cc9-42e8-8c26-eca72b3eafb6).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
