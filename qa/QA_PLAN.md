# QA plan · EarthBox site

**TL;DR:** ***A static site with three things that can genuinely break: the money path (cart → order on WhatsApp or email), the Maker (a 3D configurator), and pages drawn by JavaScript. QA is layered so every layer catches a different class of failure. Checks run before deploy (Vercel blocks a bad build), browser suites run in GitHub Actions on every push, and anything a machine can't judge is listed for a human.***

## 1 · What the product is (from the code, not assumed)

| Area | How it works | Main risks |
|---|---|---|
| Pages | Static HTML; header and footer stamped from `data/site.js`; Journal articles prerendered | Stale copies, missing files, broken links |
| Catalogue, product pages | Drawn by JS from `data/volume-one.js` / `upcoming.js`; the product id lives in the URL `#` | Layout shift, blank pages on bad ids, wrong prices |
| Cart + Saved | `localStorage`, three line kinds (fixed / on enquiry / custom build); checkout = order message to the studio | Wrong totals, lost carts, storage blocked |
| Enquiry form | Web3Forms POST (the only third-party API) | Failure handling, double sends |
| Maker | Wizard + plant search + guided dialog + three.js preview + `.glb` models with a drawing fallback | Heavy main thread, WebGL failure, state restore |
| Accounts / payments | **None.** No login, no authorisation, no payment capture | Nothing to test; stated so it isn't assumed |

## 2 · Layers, and why each tool is here

| Layer | Tool | Why this one | Where it runs |
|---|---|---|---|
| Rules and data | Node `--test` (5 files), `data.test.mjs` | Pure logic and data shape; fast, no browser | `npm test` → Vercel build + pre-push |
| Static integrity | `check-assets`, `check-prerender`, `includes --check`, ESLint | Missing files, stale HTML, real code mistakes | same |
| Behaviour | Playwright (`smoke`, `journeys`) | Already in use; real browser, network mocking for failure paths | GitHub Actions + locally |
| Accessibility | `@axe-core/playwright`, WCAG 2.1/2.2 A+AA (`a11y.spec`) | Automated rules on every page **and** open states; includes a self-test that plants defects | GitHub Actions |
| Contrast | `qa/contrast` (pixel-measured) + `contrast.spec` | axe can't judge text over photos or overlays; this measures real pixels (see `CONTRAST.md`) | GitHub Actions |
| Visual regression | Playwright `toHaveScreenshot` (`visual.spec`), desktop/phone/tablet | No extra service; baselines in git; video and 3D canvas masked | GitHub Actions |
| Performance / SEO / best practice | Lighthouse CI (`lighthouserc.json`) | Standard budgets; accessibility/SEO/best-practice are hard limits, performance warns (single runs vary) | GitHub Actions |
| Exploration | Agent-driven browser passes (this QA run) | Finds what scripted tests don't look for; findings go into scripted tests | On demand |

**Not added, on purpose:** separate visual-diff SaaS, a second test runner, AI exploration tools such as Argus or QAssist. The scripted base comes first; those can be added once it's stable.

## 3 · Risk-ranked focus

| # | Risk | Impact | Covered by |
|---|---|---|---|
| 1 | Order message or cart total wrong | Lost or wrong orders | cart unit tests, `journeys` (price/material → message → cart), smoke cart tally |
| 2 | Enquiry lost or sent twice | Lost leads, duplicates | `journeys` form success/error/offline/invalid (**found QA-001**) |
| 3 | Page blank, or broken by JS or data | Bounce | smoke (every page), `data.test`, `check-assets` |
| 4 | Unreadable text or unusable by keyboard/screen reader | Excludes users; legal | `a11y.spec`, contrast audit, keyboard journeys |
| 5 | Layout breaks on a device class | Bounce on tablets/phones | visual (3 sizes), "header fits at every width" (**found QA-003**) |
| 6 | Slow or jumpy pages | SEO, bounce | Lighthouse (**found QA-002, QA-006…009**) |
| 7 | Maker 3D fails on a device | Feature unusable | WebGL/model failure journeys → drawing fallback |

## 4 · Entry / exit

- **Before merging:** `npm test` green (also enforced by the pre-push hook and Vercel).
- **Before UI changes ship:** `npx playwright test` green (CI runs it on every push).
- **Exit for a release:** no open critical/major items in `QA_BUG_REPORT.md` without a written decision.

## 5 · How to run

```bash
npm test                                   # rules, data, lint, static checks (what Vercel runs)
npx playwright test                        # smoke, journeys, a11y, visual, contrast regressions (desktop + phone + tablet)
npx playwright test tests/visual.spec.mjs --update-snapshots   # after an intended design change
npm run qa:contrast                        # full contrast audit (≈25 min)
CHROME_PATH=… npx @lhci/cli@0.15.1 autorun # Lighthouse (CI does this)
BASE_URL=https://www.earthbox.in npx playwright test tests/smoke.spec.mjs   # against live
```

CI: `.github/workflows/qa.yml` (checks · browser · contrast · lighthouse). Failure artifacts: Playwright traces and visual diffs, the contrast report, Lighthouse HTML.
