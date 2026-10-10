# Engineering audit · 10 Oct 2026

**TL;DR:** ***The site is small and mostly sound. The pure rules (Maker, plant search, cart, enquiry form) are tested and kept apart from the UI. The risk sits at the edges. Every page loads every script (413 KB, 33 files). Header, nav and footer are copy-pasted into 29 pages. The article renderer exists twice. Nothing runs the unit tests or checks asset paths before a deploy, and that gap is how two live bugs shipped unnoticed (broken Journal images, now fixed; product page blanks on the reviews link, still open). Fix order: a check that runs on every deploy first, then the two coupling hot-spots, then deletion.***

Method: read the source, config and tests. Live and local Playwright runs for behaviour, a crude script for unused CSS, and the `contrast-check.py` script from paulunemoon/ux-audit-skill for colour contrast. No code was changed for this audit.

---

## 1 · Findings (most severe first)

Effort: S < 1 h · M ≈ half a day · L ≈ 1–2 days.

| # | Sev | Finding | Evidence | Files | Effort | Fix |
|---|---|---|---|---|---|---|
| E1 | **critical** | **Product page blanks itself** when the visitor clicks the star-rating badge. The `#` is the product id, so `#reviews` re-renders "product: reviews" and the placeholders were already deleted, so nothing shows. Live on earthbox.in. | Playwright: `product.html#V1-PLT-005` → click `.pd-rating-badge` → no `<h1>` after 30 s. `href="#reviews"` in `renderPrinted`; `renderProduct` removes `#pdLoading`/`#pdNotFound` on first render | `scripts/render-product-detail.js` | S | In-page links scroll with JS (no hash change), or route on `?id=` and keep `#` for anchors (the code already reads `?id=` as a fallback). Keep "not found" markup re-creatable |
| E2 | **high** | **No quality gate on deploy.** `npm test` = `check-prerender` only. The 4 unit test files never run in Vercel's build; there's no lint, no link/asset check, no CI | `package.json` scripts; no `.github/`; Vercel build = `npm run build` | `package.json` | S | `npm test` runs all `*.test.mjs` + an asset/link checker (see E7); `build` runs `test` so a failing check blocks the deploy |
| E3 | **high** | **Every page loads every module**: 33 JS files / 413 KB (uncompressed) on an article page, including all 5 article-body files (~160 KB) and the Maker (49 KB). One module throwing at import kills all JS on every page | Playwright network log on `/blog/designing-drainage.html`; `scripts/main.js` imports 19 initialisers statically | `scripts/main.js`, `render-article.js`, `render-blog.js`, `cart.js` → `maker.js` | M | Keep `main.js` for shared bits (theme, header, menu, cart, motion); `import()` page modules only when their root element exists (`#maker`, `#productDetail`, `#articleBody`…). No bundler needed |
| E4 | **high** | **Article renderer exists twice.** `prerender.mjs` "runs the SAME logic as render-article.js", but as a second copy. The `logo.png` bug lived in both, and blog HTML is generated **and** committed, so fixes go in two places | `scripts/prerender.mjs` header comment + duplicated JSON-LD (`logo` line in both) | `scripts/prerender.mjs`, `scripts/render-article.js`, `blog/*.html` | M | Export the pure `articleHTML(a)` / `articleJsonLd(a)` from one module; prerender and client both import it |
| E5 | **high** | **Header, nav and footer copy-pasted into 29 pages**, plus a 4th copy of the nav in `menu.js NAV_LINKS`. Adding "Maker" took 30 edits and the mobile menu was missed. Blog pages need `../` paths, which broke the menu | `grep -l runhead-nav` = 29; `menu.js` NAV_LINKS | all `*.html`, `scripts/menu.js` | M | One `data/site.js` (nav, footer columns, contact) used by `menu.js` and by a tiny build-time `include` step in `prerender.mjs` that rewrites marked regions (`<!-- @nav -->`). Static HTML stays crawlable |
| E6 | medium | **Constants duplicated**: WhatsApp number in 3 files, site URL in 4, HTML-escape in 4 (two different rules: `enquiry-form` doesn't escape `'`), price formatting twice (`formatPrice`, `rupees`), `gtag` guard in 7 files | grep results | `render-product-detail.js`, `render-products.js`, `cart.js`, `maker.js`, `enquiry-form.js`, `prerender.mjs` | S | `scripts/site.js`: `SITE`, `PHONE`, `esc`, `rupees`, `track()`. Import everywhere |
| E7 | medium | **Data ↔ asset drift isn't checked.** Bird Feeder photo never existed, `logo.png` was deleted while 23 pages used it, and 36 diagram paths were wrong for months | live 404s found in the 10 Oct UX audit | `data/*.js`, `blog/*.html` | S | `scripts/check-assets.mjs`: every `photo`, `src`, `href` in data + HTML resolves to a file. Part of `npm test` |
| E8 | medium | **Hash routing is fragile in general**: the skip link needed a special handler; any future `#anchor` on product.html breaks the page (E1); the Maker share link also lives in the hash | `render-product-detail.js` `getProductId`, skip-link handler | product.html, maker.html | S–M | Same fix as E1; document "no in-page hash links on product.html" until then |
| E9 | medium | **Inline `onerror=` handlers in templates**, which force `'unsafe-inline'` in the CSP `script-src` | `render-product-detail.js`, `render-products.js` | + `vercel.json` | S | One delegated `error` listener (capture phase) adds the placeholder class; then drop `'unsafe-inline'` if GA's inline snippet moves to a file |
| E10 | medium | **Circular import cart.js ⇄ maker.js** (works because neither uses the other at load time; one top-level call would break both) | import lines | `cart.js`, `maker.js` | S | Move the build codec (`encode/decodeBuild`, `chamberOf`, `plantOf`) into `scripts/build-codec.js`; both import it |
| E11 | medium | **Oversized files**: `products.css` 1,255 lines (≈48 of 124 classes unreferenced), `maker.js` 869 (rules + SVG + panels + controller), `render-product-detail.js` 650 (3 layouts + routing + tracking + 3 debug `console.log`s) | `wc -l`, unused-class scan | those files | M | Split only along existing seams: `maker.js` → rules / preview / panels / controller (already sectioned); remove dead CSS after the asset/visual check; delete debug logs |
| E12 | medium | **Dead code and files** (verify each before deleting): `utilities.css` 85/86 classes unused (only `u-sr-only`), `atmosphere.css` 6/6 unused but loaded on 3 pages, `category.css` + `catalogue/*.html` + `data/products.js` (excluded from deploy and 301-redirected), `scripts/optimize-images.js` + `.cjs` twins, `debug.html`, stale comments ("fills from data/products.js" in index.html) | unused-class scan; `.vercelignore`; `vercel.json` redirects | listed | S | Delete in one commit with a before/after screenshot diff of every page |
| E13 | medium | **`sharp` is a runtime dependency** but only gitignored dev scripts use it; Vercel installs it on every build | `package.json` | `package.json` | S | Move to `devDependencies` (or drop) |
| E14 | medium | **Text contrast**: `--accent` #B8A99A as text on paper = **2.14:1** (needs 4.5:1), e.g. related-card "Volume I" caption, header scroll counter, Journal card hover title, catalogue CTA caption. `--accent-text` on `--bg-tint` = 4.46:1 (just under) | contrast-check.py; `grep color:var(--accent)` | `product-detail.css:529`, `runhead.css:39`, `blog.css:94`, `products.css:727` + icons | S | Use `--accent-text` for text; keep `--accent` for rules, borders and decorative icons |
| E15 | low | **Node warns on every test run** ("module type not specified"): `package.json` lacks `"type": "module"` | test output | `package.json` | S | Add it; rename the two `.cjs` scripts if needed (they already are `.cjs`) |
| E16 | low | **Globals as module glue**: `window.__earthboxCreateThemeToggle` (theme → menu) | `theme.js:90`, `menu.js:68` | | S | Export `createToggle` and import it |
| E17 | low | **No types / schema** for data files (SKU shape, `pricing` table, plant rows) | — | `data/*.js` | S | JSDoc typedefs + a data-shape test (unique SKUs, pricing keys ⊂ materials, every photo exists). Not TypeScript |
| E18 | low | **Docs drift**: README last touched 8 May (no Maker, cart, discovery, tests); docs are spread over 5 markdown files with no index | `git log -- README.md` | `README.md` | S | README = how to run/test/deploy + an architecture map linking MAKER/CART/MOTION/QA |

**What's good and should stay:** pure rule modules with assert tests (`plant-search`, `maker` rules, `cart`, `enquiry-form`); untrusted input validated at the edges (share link, localStorage, cart storage); prerender for crawlers; reduced-motion handled per module; a strict CSP and security headers already set.

---

## 2 · Remediation plan (waiting for approval)

Each phase is a few small commits, keeps current behaviour and visuals, and is verified the same way: all tests, a Playwright walk of every page at 1440/375 plus dark mode, and before/after screenshots.

| Phase | Goal | Work | Effort |
|---|---|---|---|
| **1 · Stop regressions** | Make a broken deploy impossible to miss | E1 (blank product page), E2 (`npm test` runs every test, `build` runs `test`), E7 (asset/link checker), E15 (`"type":"module"`), E13 | ~½ day |
| **2 · Critical structure** | Remove the two places where one change breaks another | E3 (page-scoped `import()`), E4 (one article renderer), E10 (codec module), E8 | ~1 day |
| **3 · Remove duplication** | One source per fact | E5 (nav/footer from `data/site.js`), E6 (`site.js` constants/helpers), E12 dead code, E11 dead CSS + debug logs, E16, E9 | ~1–1.5 days |
| **4 · Regression tests & checks** | Behaviour is guarded, not just rules | Commit a small Playwright smoke suite (`tests/smoke.spec.mjs`: every page loads with no console error or 4xx; product → add to cart; Maker → cart; guided search; review badge); ESLint (flat config, `no-unused-vars`, `no-console`) + knip for unused files/exports; contrast check for token pairs (E14 fix lands here) | ~1 day |
| **5 · Document & enforce** | Next contributor can't drift | README architecture map + "how to add a page / product / plant"; JSDoc typedefs + data-shape test (E17); a pre-push hook running `npm test` | ~½ day |

Not proposed: a framework, a bundler, TypeScript, or a component system. The site doesn't need them.

---

## 3 · The tool repos you listed: what adds value here

| Repo | Verdict | Why |
|---|---|---|
| **microsoft/playwright** | **Use (Phase 4)** | Already used ad hoc for every check in this audit; commit it as a smoke suite so checks rerun on demand |
| **eslint/eslint** | **Use (Phase 4)** | Flat config, no plugins: catches unused vars, stray `console.log` (E11), undefined globals |
| **webpro-nl/knip** | **Use (Phase 4)** | Finds unused files/exports/deps (E12, E13). Needs explicit entries since there's no bundler (`scripts/main.js`, `scripts/prerender.mjs`, `*.test.mjs`) |
| **paulunemoon/ux-audit-skill** | **Take one piece** | Its `scripts/contrast-check.py` (stdlib, no network) gave E14's numbers. Wire it to the token pairs in Phase 4. Its 16-dimension audit overlaps super-ux |
| ssheleg/super-ux | Already used | Ran it on 10 Oct (`_audits/2026-10-10_super-ux-audit.md`). Keep for UX passes, not engineering |
| obra/superpowers | Already installed | Its TDD / verification / systematic-debugging skills fit Phase 1–4 work as-is |
| vercel-labs/agent-skills | **Optional** | `web-design-guidelines` is a decent extra UI checklist. The rest is React/Next/deploy, which doesn't apply |
| EliaAlberti/ux-audit-skill | Skip | Annotated screenshot audits; useful for client-facing decks, duplicates what we have |
| narenkatakam/ux-audit | Skip | Guidance for generating UI; overlaps frontend-design + super-ux |
| matthiasroder/UXAgent | Skip for now | Simulated-user panels need an OpenAI key; heavier than a site this size needs. Revisit if Aayush wants "would a buyer find X" tests |
| wshobson/agents | Skip | 92-plugin marketplace; overlaps installed skills, adds noise |
| github/spec-kit | Skip | Spec-driven process for larger teams/apps; our beads + MD docs cover it |

All clones were shallow and read-only, outside the repo. Only `contrast-check.py` was run (standard library only, read before running).
