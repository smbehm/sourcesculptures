/**
 * optimize-images.mjs — one-shot asset optimizer (documentation / re-run helper)
 *
 * Converts the site's source imagery to WebP at sensible display resolutions.
 * The optimized files are committed, so this script does not run during the
 * Vercel build — it exists to document exactly how the assets were produced
 * and to let them be regenerated if a source image is ever replaced.
 *
 * Requires Python 3 with Pillow. Run from the repo root:
 *
 *   node scripts/optimize-images.mjs
 *
 * Targets and why:
 *   rey-sean          photo stored as PNG; PNG is the wrong codec for photos
 *   hero-home         above-the-fold LCP image
 *   thumbnails/*      full-bleed video posters, shipped at 4K but never
 *                     displayed above ~1080p on any real viewport
 *   SS-TOGETHER       background for the archived /landing-site/ splash only
 */

import { execFileSync } from "node:child_process";

const TARGETS = [
  { src: "src/assets/rey-sean.png", out: "src/assets/rey-sean.webp", maxWidth: 1600, quality: 82 },
  { src: "src/assets/hero-home.jpg", out: "src/assets/hero-home.webp", maxWidth: 1920, quality: 80 },
  { src: "public/thumbnails/isabelle-tn.jpg", out: "public/thumbnails/isabelle-tn.webp", maxWidth: 1920, quality: 78 },
  { src: "public/thumbnails/the-veil-tn.jpg", out: "public/thumbnails/the-veil-tn.webp", maxWidth: 1920, quality: 78 },
  { src: "public/thumbnails/inferna-tn.jpg", out: "public/thumbnails/inferna-tn.webp", maxWidth: 1920, quality: 78 },
  { src: "assets/SS-TOGETHER.jpg", out: "assets/SS-TOGETHER.webp", maxWidth: 1920, quality: 76 },
];

const PY = `
import sys, os, json
from PIL import Image

targets = json.loads(sys.argv[1])
total_before = total_after = 0

for t in targets:
    im = Image.open(t["src"])
    w, h = im.size
    if w > t["maxWidth"]:
        im = im.resize((t["maxWidth"], round(h * t["maxWidth"] / w)), Image.LANCZOS)
    im.save(t["out"], "WEBP", quality=t["quality"], method=6)

    before = os.path.getsize(t["src"])
    after = os.path.getsize(t["out"])
    total_before += before
    total_after += after
    print(f'{t["src"]:38} {before/1024:8.0f}K -> {after/1024:7.0f}K  '
          f'({100 - after * 100 / before:4.1f}% smaller)  {w}x{h} -> {im.size[0]}x{im.size[1]}')

print()
print(f'TOTAL {total_before/1024:.0f}K -> {total_after/1024:.0f}K  '
      f'({100 - total_after * 100 / total_before:.1f}% smaller, '
      f'{(total_before - total_after)/1024/1024:.2f} MB saved)')
`;

execFileSync("python3", ["-c", PY, JSON.stringify(TARGETS)], { stdio: "inherit" });
