# Vendored scripts

| File | What | Version | Source | Licence |
|---|---|---|---|---|
| `three.module.min.js` | three.js, official ES-module build | r160 (`three@0.160.0`) | `https://unpkg.com/three@0.160.0/build/three.module.min.js` (sha256 `3e690ac7…f69ba6`) | MIT, see `three.LICENSE` |

Served from our own origin because the CSP (`vercel.json`) allows no script CDN.
Only `scripts/maker-3d.js` imports it, and maker.js loads that with `import()`
on `maker.html` only, so no other page downloads it. Don't edit the file;
to upgrade, replace it with another official build and update this row.
