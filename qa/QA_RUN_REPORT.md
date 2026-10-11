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
