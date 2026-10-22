# Vendored scripts

| File | What | Version | Source | Licence |
|---|---|---|---|---|
| `lenis.js` | Lenis smooth scroll (desktop mouse/trackpad; `motion-scroll.js`) | `lenis@1.3.26` | `https://unpkg.com/lenis@1.3.26/dist/lenis.mjs`, saved as `.js` (dist/ serves `.js` only) without its source-map line (original sha256 `b7a2f689…`) | MIT (darkroom.engineering) |

Served from our own origin because the CSP (`vercel.json`) allows no script CDN. Don't edit the file; to upgrade, replace it with the new release and update this row.

**Types:** `lenis.d.ts` beside it points to the published types for the same release (`lenis@1.3.26`, a dev dependency only). That way `npm run typecheck` checks how we *use* the library without checking its minified code. dist copies `.js` only, so the `.d.ts` file never ships.
