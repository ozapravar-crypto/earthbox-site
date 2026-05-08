# EarthBox · Site

Editorial archival site for EarthBox. Three pages, four passes, no build step.

## Architecture

Designed under "simple vs easy" — each file owns one concern. Harder to scaffold, much cheaper to change across passes.

```
site/
├── index.html · products.html · about.html  ← composition only
│
├── styles/
│   ├── tokens.css       — palette, fonts, spacing, motion vars (vars only)
│   ├── reset.css        — sensible defaults
│   ├── typography.css   — h1-h4, eyebrow, caption, lede
│   ├── primitives.css   — .page, .section, rules, stack, row
│   ├── atmosphere.css   — grain overlay, watcher specimen frame
│   ├── runhead.css      — fixed top bar with nav + scroll counter
│   ├── motion.css       — .reveal base classes only
│   └── home.css | products.css | about.css   ← page-specific layout overrides
│
├── scripts/
│   ├── main.js          — entry: imports + boots primitives
│   ├── reveal.js        — IntersectionObserver scroll reveals
│   ├── runhead.js       — scroll-percentage counter
│   └── (passes 2-4 add: cursor, magnetic, scramble, lenis,
│        parallax, pin, thread, marquee, counters, loader)
│
├── data/
│   ├── products.js      — Volume I product list (ES export, not JSON —
│   │                      avoids runtime fetch for static content)
│   ├── upcoming.js      — Volume II + III "coming soon" placeholders
│   └── about.js         — about-page sections, founders, colophon
│
└── assets/
    ├── logo.svg         — animated EarthBox logo
    ├── watcher.svg      — fixed watcher specimen frame
    └── illustrations/   — product line drawings
```

## Conventions

- **One concern per file.** No "utilities.css" growing into a god file.
- **No JS framework.** Plain ES modules. The motion primitives are stand-alone.
- **No CSS framework.** CSS custom properties + small files compose into pages.
- **Data is data.** `data/products.js` exports an array; pages import and render. Adding a product = editing one file.

## Shared HTML chunks

The `<head>`, `.runhead`, and `.watcher` markup is **copy-pasted** across the three HTML files. With 3 pages this is acceptable — but you must keep them in sync manually. When updating any of the three:

1. Update the chunk in `index.html` first.
2. Diff against `products.html` and `about.html`.
3. Apply identically.

If we ever grow past 3 pages, replace this with a `<template>`-based runtime include in a new `scripts/include.js`. Don't reach for a static site generator — that's a different kind of complecting.

## Build sequence

Tracked in beads. Do **not** advance until the prior pass is verified in browser.

| Pass | Issue       | Scope                                                        |
|------|-------------|--------------------------------------------------------------|
| 1    | Admin-3ct   | Static layout · 3 pages · shared system · reveal animations |
| 2    | Admin-glp   | Custom cursor (germinating sprig) · magnetic buttons · scramble |
| 3    | Admin-iyd   | Lenis smooth scroll · multi-layer parallax · sticky pins     |
| 4    | Admin-5i2   | SVG draw thread · marquee band · number counters · intro loader |

## Verification per pass

- Renders cleanly at 1440 / 1024 / 375 widths
- Nav links work between all three pages
- `prefers-reduced-motion` disables motion (test in DevTools rendering panel)
- Lighthouse: target 95+ performance, 100 accessibility
- Manual Safari + iPhone smoke test (custom cursor + Lenis sometimes break there)

## Running locally

Plain static files — any HTTP server works. From `site/`:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

ES modules require a server context — opening `file://` won't work for the imports.
