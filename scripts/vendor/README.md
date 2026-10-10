# Vendored scripts

| File | What | Version | Source | Licence |
|---|---|---|---|---|
| `three.module.min.js` | three.js, official ES-module build | r160 (`three@0.160.0`) | `https://unpkg.com/three@0.160.0/build/three.module.min.js` (sha256 `3e690ac7…f69ba6`) | MIT, see `three.LICENSE` |
| `GLTFLoader.js` | three.js glTF loader (reads the Maker's plant models) | r160 (`three@0.160.0`) | `https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js` (sha256 of the original `d073b438…40e6a3`) | MIT, see `three.LICENSE` |
| `BufferGeometryUtils.js` | the one import GLTFLoader needs | r160 (`three@0.160.0`) | `https://unpkg.com/three@0.160.0/examples/jsm/utils/BufferGeometryUtils.js` (sha256 `9be041e9…92becb`) | MIT, see `three.LICENSE` |

Served from our own origin because the CSP (`vercel.json`) allows no script CDN.
Only `scripts/maker-3d.js` imports it, and maker.js loads that with `import()`
on `maker.html` only, so no other page downloads it. `GLTFLoader.js` is imported
by maker-3d.js only when a plant model is first needed. Don't edit the files,
except the import lines: in the two loader files `'three'` is rewritten to
`'./three.module.min.js'` and `'../utils/BufferGeometryUtils.js'` to
`'./BufferGeometryUtils.js'` (no bundler, no import map). To upgrade, replace
all three with the same release and update these rows.
