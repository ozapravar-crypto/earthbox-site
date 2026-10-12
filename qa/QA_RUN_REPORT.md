# QA run report · 11 October 2026

**TL;DR:** ***Everything below was actually executed. The final local suite passed apart from 3 load-related timeouts, all fixed and re-run green. Lighthouse accessibility is now 100 on 4 of 5 pages (98 on the catalogue, down from 98 everywhere), SEO is 100 everywhere, and layout shift is fixed on the product, catalogue and Journal pages. Two items stay open by decision (homepage intro delay, Maker first-load work), plus small performance items. CI confirms on push (link below once it's green).***

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
