# QA run report · 11 October 2026

**TL;DR:** ***Everything below was actually executed. The final local suite passed apart from 3 load-related timeouts, all fixed and re-run green. Lighthouse accessibility is now 100 on 4 of 5 pages (98 on the catalogue, down from 98 everywhere), SEO is 100 everywhere, and layout shift is fixed on the product, catalogue and Journal pages. Two items stay open by decision (homepage intro delay, Maker first-load work), plus small performance items. CI confirms on push (link below once it's green).***

## 13 Oct 2026 · Neon Pink, Jewel Orchid stand-in, moss scan (CC BY 4.0)

| Suite | Result |
|---|---|
| `npm test` + ESLint | pass (0 fail) |
| Full Playwright | 286 pass, 5 fail under machine load (load avg ~12, run 18.5 min vs 7.6). The 5 re-run (all projects): **14/14 pass**. None touch the Maker models |
| Maker renders (colour + moss chambers) | models load, no 4xx/console errors |
| Lighthouse | CI on the PR |

## 12 Oct 2026 · Sketchfab plant models (9, CC BY 4.0)

| Suite | Result |
|---|---|
| `npm test` + ESLint | pass (0 fail) |
| Full Playwright (desktop · phone · tablet) | **291 pass, 0 fail** |
| Maker renders (carnivorous, mixed, earlier saved design) | all models load, no 4xx/console errors; earlier design unchanged after the width-limit change |
| Lighthouse | CI on the PR |

## 12 Oct 2026 · scroll motion (smooth scroll, parallax, text fades)

| Suite | Result |
|---|---|
| `npm test` | pass (0 fail) |
| `tests/motion.spec.mjs` (new, motion on) | 10/10 over two repeats |
| Full Playwright (desktop · phone · tablet) | 279 pass; 12 visual fails = stale baselines from 11 Oct (no header icons / Care link). Motion is off under reduced motion, which the visual suite uses. Baselines refreshed; visual re-run 63/63 |
| Lighthouse | CI on the PR |

## What ran

| Suite | Command | Result | Notes |
|---|---|---|---|
| Unit + data + lint + static checks | `npm test` | **pass** (0 fail) | Includes the new `care.test.mjs` and `pairings.test.mjs` |
| Smoke, journeys, a11y, visual, contrast specs | `npx playwright test` (desktop · phone · tablet, 3 workers) | Run 1: 182 pass, 2 fail · Run 2: 183 pass, 1 fail · then the 3 failing tests re-run: **all pass** | The failures were timeouts under machine load (Maker on phone; the 12-width header test), not site defects. Fixed: the header test reuses one page; Maker waits allow 15 s |
| Visual regression | `tests/visual.spec.mjs` (42 shots) | **3 consecutive clean runs** after the fixes in QA-007 | Masks: video, canvas |
| Layout-shift regression | `smoke` "no layout jump while loading" (5 pages, 412 px, motion on) | **pass**; **fails without the QA-013 fix** (0.21 / 0.18) | Shows the test catches the bug |
| Lighthouse | `lhci autorun` (5 URLs, 1 run each, mobile) | a11y/SEO/best-practices assertions **pass** | Performance warns only (single runs vary) |
| Contrast full audit | `npm run qa:contrast` | Last full run: CI 38075663247, **0 fail, 0 review** (808 states) | Not re-run locally (25 min). CI re-runs it on this push |

## Lighthouse, before → after (mobile, local, one run)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Home | 70 → 85 | 98 → 100 | 100 | 100 | 5.8 → 3.2 s | 0 → 0 |
| Catalogue | 80 → 66* | 98 → 98 | 96 | 100 | 3.2 → 6.1 s* | 0.22 → 0 |
| Product | 56 → 69 | 98 → 100 | 100 | 100 | 4.7 → 3.8 s | 0.74 → 0.28 → **0** (after QA-013, measured) |
| Maker | 67 → 63* | 98 → 100 | 100 | 100 | 2.4 s | 0 |
| Journal article | 83 → 88 | 98 → 100 | 100 | 100 | 2.3 → 2.2 s | 0.24 → 0.07 |

\* The "after" run happened while a second browser job was running on the same machine (the iconography audit). Catalogue LCP and Maker blocking time (144 s, impossible on a real device) are inflated by that. The CI Lighthouse job on a clean runner is the number to trust; QA-010 and QA-011 stay open either way. Catalogue accessibility read 98 on both runs; the cause isn't identified yet.

## Defects found and fixed in this run
QA-001 to QA-007, QA-009 and QA-013. Details, root causes and evidence are in `QA_BUG_REPORT.md`; contrast items CQ-001 to CQ-014 are in `CONTRAST.md`.

## Not covered, and why
- **Real devices** (iPhone Safari, Firefox, real GPUs): not available here; all runs are Chromium, with 3D on software rendering.
- **Live services** (Web3Forms, WhatsApp): mocked by design, so nothing real is sent.
- **Motion:** the suite runs with reduced motion, as the design asks. Only the layout-shift tests run with motion on, which is how QA-013 was found. Animation bugs elsewhere would need similar motion-on checks.
- **Screen-reader listening pass:** axe covers the rules, not the experience.

## Open (decisions or follow-ups, see the bug report)
- QA-008: the homepage intro delays the first paint; a design decision.
- QA-010: the Maker's first-load work, to be measured on a real phone.
- QA-011: catalogue image sizes.
- QA-012: the Bird Feeder photo and a branded 404, both waiting on content.

## Follow-up run · cookie banner (site-dni), 11 Oct 2026
- **What changed:** Google Analytics now loads only after "Accept" (`scripts/consent.js`, stamped into all 30 pages by `includes.mjs`). Added a privacy page and a footer link. Tests start with the choice already made, so the banner doesn't cover what they click; the banner has its own tests.
- **Full local suite:** **210 passed, 0 failed** (47 skipped by design). `npm test` passes.
- **CI on the QA push (38161589482):** 188 passed, 1 failed: the tablet guided-search click, CI-only, passes 3/3 locally. CI now retries a failed test once, reported as "flaky" and tracked in bead site-ktu. Lighthouse and unit jobs passed.

## Follow-up run · Care (epic site-eeh), 11 Oct 2026
- **What shipped:**
  - `care.html`: home planner (kit or visits) and business quote form
  - care lines in the cart
  - "Keep it thriving" on product pages and on the Maker's review step
  - cart suggestions
  - Care in the top bar, footer and a homepage band
- **Full local suite:** **242 passed, 2 failed** (51 skipped by design). The 2 failures were phone-size timeouts under load: Maker resume, and the Care kit test where the planner script hadn't run yet. Both re-ran **3 of 3 green**. CI's single retry covers this kind of flake, and it would show as "flaky".
- **Caught before release:** QA-014, adding visits to the cart failed after typing a pincode. QA-015, oversized footer icons on new pages: hotfixed live and now guarded on every page.
- **Not done:** prices. Every kit and visit shows "On enquiry" until Aayush sets them (see `CARE.md`).

## Follow-up · clean URLs, 11 Oct 2026 (commit 9189be2)
- **Root cause:** `/` always served the homepage. But the logo and every "Home" link (94) pointed to `index.html`, and all other links used `*.html`, so visitors saw `/index.html`.
- **Change:** `cleanUrls` in `vercel.json`, and every internal link made clean and root-absolute. Canonical, Open Graph, JSON-LD and sitemap URLs updated.
- **Verified on a Vercel preview, then production (earthbox.in):**
  - `/`, `/products`, `/product`, `/blog`, `/blog/<slug>`, `/care`, `/about` and `/privacy` return 200.
  - Each old `*.html` address permanently redirects (308) to its clean form.
  - Legacy `/catalogue/*.html` addresses reach `/products` in 2 hops.
  - A browser pass over 10 live pages plus the cart drawer found **0 internal `.html` links**.
- **Local suite on the branch:** 243 passed, 4 failed. The 4 were timeouts under load (elements not drawn within 5 s) and passed 2 of 2 on rerun. As the suite grows, this machine is the bottleneck; CI is the reference.
- **Testing against live with `BASE_URL`:** the "loads clean" and "clean URLs" checks wait for network idle, which the live hero video never reaches. Use the scratch link-audit approach (video blocked) for live checks, or extend the specs to block video when `BASE_URL` is set.

## Follow-up · product points (site-kry), 12 Oct 2026
- **What:** three numbered points under each chamber photo (what grows · climate · the object), built from the chamber's own data. Hover or focus opens one panel; tap toggles on touch; Escape or leaving closes. The page never moves.
- **Full local suite (2 workers):** **257 passed, 1 failed**. The failure was an expected visual change (the points now show behind the cart drawer) and the reference was updated. Fewer workers removed the load timeouts seen on 11 Oct.
- **Not covered:** Volume I pieces get no points, because they have no structured details to reuse.

## Follow-up · release gate, icons, security, 12 Oct 2026
- **Release gate (discovery M1):** `main` is protected and needs 3 green checks. Proven: a direct push was rejected, a failing PR was BLOCKED, and Vercel refused the broken build. Vercel serves an allow-listed `dist/`, and tooling paths 404 live. The bare domain now redirects permanently (308).
- **Iconography Phase 2:** shipped in PRs #3–#5 (audit items 1–17, 19, 20). Each PR: full suite green locally and on CI, visual changes reviewed by eye before updating references, then verified live.
- **Security and ops (M3):** shipped in PRs #6 and #7.
  - CSP `script-src` has no `'unsafe-inline'`, and local tests run under the same CSP.
  - Weekly live check: `tests/live.spec.mjs` via `.github/workflows/live.yml`, 13/13 against earthbox.in, also green on CI.
  - Safari-engine (WebKit) CI job; asset cache 1 day; `sharp` updated (0 vulnerabilities).
- **Bugs found and fixed:**
  - **Maker taps swallowed on slow devices:** the late 3D load rebuilt every button mid-tap. This was the long-running CI flake site-ktu; a regression test now covers it.
  - **Product points on iPhone:** a second tap reopened the panel; found by the new WebKit job.
  - **GA hits blocked live by the CSP:** `www.google.com/g/collect` was missing from `connect-src`, so consented analytics were partly lost since 11 Oct. Found by checking live with the real GA.
  - **Start-screen 3D hero regression:** caught by visual tests before release.
- **Hosting note:** one production deploy failed with Vercel's `git_info_fail`, twice. A fresh commit (PR #7) deployed normally. If it recurs, a new commit or a redeploy from the Vercel dashboard is the fix.

## Follow-up · SEO, AEO and GEO catch-up, 13 Oct 2026
- **What changed:** each of the 43 pieces now has its own page at `/product/<CODE>`. The sitemap (73 URLs), `llms.txt` and the Catalogue, Journal and Care schema are generated by `scripts/seo.mjs`. Details: `_audits/2026-10-13_seo-aeo-geo-catchup.md`.
- **Checks:** `npm test`, which now includes `seo.mjs --check`; Playwright on desktop, phone and tablet; a new smoke test, "product pages are readable without JavaScript"; Lighthouse, which now checks `/product/V1-PLT-005` and `/care`.
- **Bugs found and fixed:**
  - **QA-013:** the 404 page was unstyled at any deeper address.
  - **QA-014:** cart thumbnails broke on Journal pages.
  - **QA-015:** an Elemental Box's share description had its paragraphs joined with commas.

## Follow-up · search tap and Maker speed, 13 Oct 2026
- **site-ksq (fixed):** a tap on the Catalogue search before `catalogue.js` had loaded did nothing. `main.js` now remembers that tap, and search opens as soon as it's ready. New journey test (it holds the script back): it fails without the fix and passes with it, on desktop and phone.
- **site-glj (improved, still open):**
  - **Cause:** profiling at 4× CPU slowdown with software WebGL (as on CI) showed the six recipe-card pictures were drawn all at once when the Maker opened. They were then redrawn in one burst when the plant models arrived, even after the start screen had gone.
  - **Fix:** they're now drawn one per idle moment, and only while the start screen shows.
  - **Results:**
    - start-screen freeze: 2.9 s → 1.0 s
    - picking a recipe and reaching the next step (warm): 5.1 s → 2.7 s
  - **Ruled out:** WebP encoding and shadows; neither was the cost.
  - **Left:** the 45 plant thumbnails (about 250 ms each in software, one per idle moment).
- **Checks:**
  - `npm test`
  - Maker, search and cart tests on desktop, phone and tablet: 60 passed
  - visual + a11y on all three devices: 116 passed; tablet guided-search visual failed once under load and passed twice on rerun
  - The "Maker 3D preview loads its plant models" smoke test fails in some full runs and passes when run alone. It did this before the change too (see the 13 Oct SEO run).

## Follow-up · shopping Phase 1, 14 Oct 2026 (site-zwk)
- **What changed:** a "Where will it live?" choice (Indoors / Sunny window / Balcony → PETG / ABS / ASA) sets one exact price on every Catalogue card. Save and Add now sit on the cards, and product pages open on the same choice. Details: `SHOPPING-PLAN.md`.
- **Checks:**
  - `npm test`, including the new data checks: every orderable piece has a price in every place, plus `priceOf` cases
  - journeys, smoke and a11y on desktop + phone: 179 passed. The new tests cover:
    - switch → card price → Add → cart line in ASA at ₹629
    - Save from the card
    - coming soon has no Add
    - the product page follows the choice, and the choice persists back to the Catalogue
    - the switch works from the keyboard
  - visual + contrast on all three devices: 95 passed. The three Catalogue first-screen baselines were refreshed on purpose and reviewed.

## Follow-up · homepage manifesto removed, 15 Oct 2026
- **What changed:** the dark "EarthBox is not selling plants…" band is gone from the homepage, along with its cursor spotlight script, the cursor's dark-band styling, its CSS and its GA event (`manifesto_cta_click`).
- **Checks:**
  - `npm test`, ESLint and the build all pass.
  - Full Playwright suite on desktop, phone and tablet: 304 passed, 61 skipped (the live-only suite).
  - Contrast checks CQ-003 and CQ-010 covered only this section, so they were retired (see `CONTRAST.md`). The manifesto button was also removed from the CQ-007 focus-ring check.
  - The homepage first-screen baselines didn't change, because the band sat below the fold.

## Follow-up · Journal and About visibility, 16 Oct 2026 (QA-017)
- **What changed:** the Journal list and the About sections show again. They were drawn after the reveal set-up and never registered.
- **Checks:**
  - `npm test` passes.
  - The new smoke test "every scroll reveal shows" passes on desktop for 7 pages. It's skipped on phone and tablet, where wheel scrolling isn't available. It failed on /blog and /about before the fix.
## Follow-up · day/night theme, 16 Oct 2026
- **What changed:** the theme follows Mumbai's sky. It's light from sunrise to sunset and dark at night, worked out each day (`scripts/theme-early.js`).
  - The theme is set before the page paints, by a small blocking script in every `<head>`, so there's no flash.
  - A visitor's switch holds until the next sunrise or sunset. Choices saved before today, which have no end time, are kept.
  - An open page turns at sunrise and sunset.
  - The phone's own dark-mode setting no longer decides the theme.
- **Checks:**
  - **Unit tests:** `theme-early.test.mjs` checks sunrise and sunset against published Mumbai times for 21 Jun and 21 Dec (within 3 minutes), plus day/night edges, when the next change falls, and how a saved choice resolves.
  - **New journey (desktop and phone), with the clock set:** noon → light; 21:00 → dark; the switch holds through a reload and lapses after the next sunset.
  - **Full Playwright suite (desktop, phone, tablet):** 308 passed, 63 skipped (the live-only ones).

## Follow-up · UX audit Phase 0, 16 Oct 2026 (QA-018)
- **What changed:** see QA-018.
- **Checks:**
  - `npm test` passes, including the updated cart unit tests (coming soon is not in the cart).
  - New journeys:
    - sent cart
    - shared link over my design
    - plants announced + focus
    - phone menu focus
    - coming-soon page registers interest
  - Full Playwright suite (desktop, phone, tablet) on its own port (`E2E_PORT`, see the note below): 319 passed and 1 failed. The failure was the new share-link test racing the app's own reload; after the fix it passed 3 runs out of 3.
- **Note:** another checkout on this machine served :4173, and Playwright's `reuseExistingServer` would have tested its code. `playwright.config.mjs` now takes `E2E_PORT`.

## Follow-up · code quality gates, 16 Oct 2026 (site-tve)
- **What changed:** four checks now run in `npm test`, so they also run in CI and on every Vercel build:
  - **Strict type-checking** (`npm run typecheck`, TypeScript `checkJs` + `strict`, no compiling). Error count: 1,436 → 0.
  - **Type-aware ESLint** (typescript-eslint, via `npm run lint`). Problem count: 136 → 0, with no `eslint-disable` added.
  - **Unused-code check** (knip, `npm run check:unused`). It found one dead file (`scripts/lenis.js`), an unused export, two dead branches (`s.table` on About, `priceRange` on products) and two missing dependency declarations.
  - **Duplicate-code check** (jscpd, `npm run check:dupes`, threshold 0). It found 7 clones; they're now shared helpers (`radioKeys` in util.js, `ringFailures` in contrast.spec, `fillAndSend`, `tests/helpers.mjs`).
- **Bugs the types found:**
  - **A thrown TypeError in the Maker's focus fallback.** This was new in Phase 0. It was fixed before release, with a test (PR #26).
  - **A cart unit test helper** passed the array index as the `list` argument. Fixed.
- **Checks:** `npm test` and `npm run build` pass. The full Playwright suite (desktop, phone, tablet, `E2E_PORT`): 324 passed, 78 skipped (the live-only ones), 0 failed.

## Follow-up · UX audit Phase 1: shared rules, 16 Oct 2026 (site-bhr.2)
- **What changed** (rules E1, E2, C-12, C-14, C-15, S-15, C-19, M-17 in `_audits/2026-10-16_ux-ia-density-audit.md`):
  - **Buttons in three tiers.** The main `.cta` is now filled ink at rest, with a softer fill on hover. Outline is the secondary style. The check found one clash per page (the email form's "Send enquiry" beside the main button), and it's now secondary.
  - **The cookie banner's Accept and Decline are deliberately equal.** A journey test asserts it.
  - **"Selected" has one meaning per look:**
    - Underline for views: Journal filters, now with `aria-pressed`; the Maker's List/Map.
    - Filled for buying choices: size and material cards.
  - **Small labels have a type floor.** Nothing is under .62rem (63 sizes raised; the `--label-min` token). `check-contrast.mjs` now fails on any smaller font size.
  - **One `.badge` for status words**, in components.css.
  - **Article callouts and quotes** lose their one-edge stripe. They use the full-border notice box, and quotes are 1rem.
  - **44 px tap areas:**
    - Card Save, Maker chips, sort, filter and step numbers.
    - Text links (footer, header, breadcrumb, rating, About contact) on touch screens only, so a mouse keeps the desktop rhythm.
    - A tap-target probe at 390 px finds none left, apart from native radios inside their labels.
- **Checks:**
  - `npm test` passes (it includes typecheck, lint, knip and jscpd).
  - Visual baselines were refreshed on purpose, all 39 of them. Reviewed: product, cart, cookie banner, Journal, Maker plants.
  - Full Playwright suite: 323 passed and 1 failed (the Maker review phone screenshot). It passed when rerun alone, the known load flake.
- **Note:** the home phone baseline shows no hero text. That's a test artefact: `visual.spec` turns animations off, so the hero fade-in never runs. The live site shows the text.

## Follow-up · SEO/GEO/AEO audit fixes, 16 Oct 2026 (QA-019, site-1c6)
- **What changed:** see QA-019.
- **Checks:** `npm test` and `npm run build` pass, including the new related-product check. Full Playwright suite (desktop, phone, tablet): 327 passed, 78 skipped (the live-only ones), 0 failed.

## Follow-up · UX audit Phase 2: cart, product page, Maker Plants + Review, 16 Oct 2026 (site-bhr.3)
- **Cart drawer (spec D1):**
  - **Lines:** title and price first, then "Size · Place (MATERIAL)" with the unit price, then the status on its own line. No kind labels; icons instead of letters.
  - **Counts:** they count pieces, not parts.
  - **Breakdown:** includes "To be quoted" and "Delivery · Mumbai · confirmed by the studio".
  - **Sticky footer:** "Estimate so far ₹X + n to quote", with the qualifier at the same size, then Send on WhatsApp and "Send by email instead" at every width.
  - **Email order form:** name, phone and pincode (with the Mumbai hint), plus optional email.
  - **Saved chamber:** shows its guide price.
- **Product page (spec D2):**
  - The heading and price sit in the buying column, so Add is above the fold at 1440×900.
  - "Size · Place (MATERIAL)" under the price, and one line under Add.
  - No duplicate description.
  - The related row is "More planters": available pieces first, with prices.
  - Chamber guide prices show on desktop and on the Volume II cards.
  - The phone sticky bar appears only once the inline Add has scrolled away.
  - The WhatsApp prefill is in the customer's voice.
- **Maker Plants (spec D3):**
  - **Simple mode** when 8 or fewer plants fit (9 of 10 chambers): the plants are listed straight away. "Explore other chambers" opens the full tools.
  - **Explore mode:** a visible climate line, a quiet Guided search, and named map pins.
  - **Selected and full states:** "Added ✓", with the accessible name unchanged, and a reason when the chamber is full.
  - **Phone:** the 3D preview is a strip with "View 3D", and the count is in the bottom bar.
- **Maker Review (spec D4):**
  - "Made to order · availability confirmed with your quote", and "What happens next" in 3 steps.
  - Actions run Add to cart → send this design → Care → Copy link · Start over.
  - Edit from Review says "Back to review".
  - The recipe name clears when the chamber changes.
- **Checks:**
  - `npm test` and `npm run build` pass.
  - New specs: `tests/phase2-shop.spec.mjs` (15 journeys) and `tests/phase2-maker.spec.mjs` (10), plus unit tests.
  - Visual baselines refreshed on purpose, after review (product, cart, chamber, Maker plants and review, desktop and phone).
  - Full Playwright suite: 374 passed, 79 skipped (the live-only ones), 0 failed.

## Follow-up · UX audit Phase 3: Home, catalogue, Care, remaining Maker steps, polish, 16–17 Oct 2026 (site-bhr.4)
- **Home (spec D5):**
  - A 4-piece tease with the finish named. Its counts come from data: "32 pieces · 23 coming soon · chambers on enquiry".
  - One trust row. The unconfirmed ★4.8 rating and the unsourced "50+ pieces delivered" are removed.
  - The lone "02" is gone, and "Disposition" is now "Price".
  - Principles and Purpose are merged into one band, and the film is quieter.
  - The internal brand note is gone from the footer of every page.
  - The cookie banner is one compact row on phones, with Accept and Decline still equal.
- **Catalogue:**
  - "Prices for: <place>" stays in the sticky bar.
  - No filler blocks, and Plant Packets fold behind "Show all".
  - Search matches materials and places, shows price or status, and lists available pieces first.
  - The category header stacks on phones, and the price chips are gone.
- **Care:**
  - A plan link from a coming-soon piece no longer shows the wrong piece.
  - Plant groups get plain names, and are asked only for kits.
  - The pincode field has a plain hint and a coverage note, and the wording is fixed.
- **Maker:**
  - **Chamber cards:** readable compatibility with real plant names, plus availability. A "Help me choose a chamber" helper reuses guided search.
  - **Foundation:** "Recommended" on the studio's mix, "Suits …" on both, and the unsuitable mix stays keyboard-reachable with its reason.
  - **Your space:** it now owns room, light, care, household, maturity and the note. Light goes in the enquiry.
  - **Resume:** returns to the last step ("Continue: Moss · 3 plants").
  - **Undo:** it lasts until dismissed.
  - **Search:** "cactus" finds succulents.
  - **Recipes:** cards show "from ₹6,000".
- **Polish:**
  - Chamber text sits below the photo.
  - Vivarium pages get an email route.
  - Email form errors show inline.
- **Checks:**
  - `npm test` and `npm run build` pass, after one duplicate removed into `tests/helpers.mjs` `cleanStart`.
  - New specs: `tests/phase3-site.spec.mjs` and `tests/phase3-maker.spec.mjs`.
  - Full Playwright run: 404 passed. The only 17 failures were screenshot comparisons; I reviewed them (catalogue, chamber, Care, cookie banner, footer, product points) and refreshed the baselines on purpose, then 63/63 visual tests passed.
