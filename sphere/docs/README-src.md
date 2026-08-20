# Source layout

- `index.html` — the deliverable. three.js r128 is inlined so the file works offline
  and from `file://`. This is what Vercel and GitHub Pages serve.
- `src-pattern-bench.html` — the same page with three.js referenced from cdnjs instead
  of inlined. Edit this one, then rebuild.

Rebuild `index.html` from source:

```bash
npm i three@0.128.0
node -e "
const fs=require('fs');
const t=fs.readFileSync('src-pattern-bench.html','utf8');
const l=fs.readFileSync('node_modules/three/build/three.min.js','utf8');
fs.writeFileSync('index.html',
  t.replace(/<script src=\"https:\/\/cdnjs[^\"]*\"><\/script>/,
            '<script>'+l+'</script>'));
"
```

## Where things live in the source

| Concern | Marker |
|---|---|
| Pattern fields | `const PATTERN_GLSL` — one `patternField()` with a `uMode` switch |
| Pattern registry | `const PATTERNS` — id, mode, slider ranges, help text |
| Measurement | `function measure()` and the `mMat` shader |
| Shell material | `shellMat.onBeforeCompile` — discard + backface dimming injected into three's PBR |
| Axis orientation | `function updateRot()` → `uRot` |
| Framing / centring | `measureFree()` and `frameCamera()` |

## Adding a pattern

1. Add an `else if(uMode==N)` branch in `patternField` returning a signed field
   (`f < 0` = void).
2. Append an entry to `PATTERNS` with slider ranges and a `use` mask for which of the
   four sliders apply.

Nothing else needs touching — the gallery, measurement, flat map and HUD are all driven
off the registry. Because every family shares one field implementation, the GPU
measurement works on a new pattern with no extra code.
