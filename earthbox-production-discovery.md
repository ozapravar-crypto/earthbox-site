# EarthBox site: production-readiness discovery

***TL;DR: EarthBox is a well-built static shop window (plain HTML and JavaScript on Vercel). It has an unusually strong test system and no server, no logins and no payments, so very little can be attacked. It is production-worthy today as a catalogue that sends orders by WhatsApp or email. Four things stand between it and "production" as a business: (1) the browser test suite runs after the site is already live, not before, so it doesn't block a bad release; (2) the repo's tooling files (test code, CI config, beads config) are publicly downloadable from earthbox.in; (3) the legal pages that Razorpay and Indian consumer law expect (Terms, Shipping, a confirmed Refund policy) are missing or unconfirmed; (4) nothing tells anyone when the site or the order form breaks. Recommendation: stay static, fix those four, and add one small server function only when real online payment starts. Don't build login until there is a concrete member benefit.***

Prepared 11 Oct 2026. Read-only: no file in the repo was changed. Evidence labels: **[V]** verified (I read the file, ran the command or fetched the live URL), **[A]** assumption (reasoned, not confirmed), **[U]** unknown (needs you or Aayush).

> **Limits of this review.** The repo was being edited by another agent while I read it (the Care feature, uncommitted changes in 40+ files), so the working tree is a moving target. Findings about live behaviour are from `https://www.earthbox.in` at commit `4ed0ee2`. I ran only read-only checks (unit tests, lint, static checks, `npm audit`, header/URL probes). I did **not** run Playwright, Lighthouse or the contrast audit, because they write output files. A clean build and green tests are not proof of security.

---

## Part 1 · Executive summary

### What you have [V]
- A **static website**: every page is a file served as-is, with no program running on a server. It is written in plain HTML, CSS and JavaScript "ES modules" (JS files that import each other directly in the browser). There is no framework (such as React or Next.js) and no bundler.
- **31 pages**: Home, Catalogue, Product, Maker (3D terrarium builder), About, Journal plus 23 articles, Privacy, and Care (in progress).
- Everything the site says (products, prices, plants, contact details, refund text) lives in `data/*.js`.
- It is hosted on **Vercel**. A push to `main` on GitHub deploys it to `www.earthbox.in`.

### What really works (not just visual) [V]
| Feature | How it actually works |
|---|---|
| Catalogue and product pages | Drawn by JavaScript from `data/volume-one.js` and `data/upcoming.js` |
| Cart and Saved list | Stored in the visitor's browser (`localStorage`, a small per-site storage box in the browser). It keeps ids only and re-reads prices from `data/` on every page |
| "Checkout" | Builds an order message and either opens WhatsApp (`wa.me` link) or sends it by email through **Web3Forms**, a third-party form-to-email service. **No money moves on the site** |
| Maker | A real configurator: rules for which plants fit which chamber, search, a 3D preview (three.js), and share links |
| Cookie consent | Google Analytics loads only after "Accept" (`scripts/consent.js`). Decline means it never loads |
| Enquiry form | Real POST to Web3Forms, with a honeypot (a hidden field only bots fill in) and error messages |

### What is visual-only, or a hand-off to a human [V]
- **Payment.** Aayush sends a Razorpay payment link by hand after the order arrives.
- **Order total.** It is an estimate. The studio confirms it. Many items are "On enquiry".
- **Care** (visits and kits): everything is `price: null`, which shows "On enquiry". `care.html` returns 404 on the live site right now; the page is being built.
- **Login / membership** (bead `site-aom`): it does not exist. The bead has no defined member benefit yet.

### What's missing for "production" as a business
1. A **release gate** that includes the browser tests (today they run after the site is already live).
2. **Hiding non-site files** from the public web server.
3. **Legal pages**: Terms of sale, Shipping/Delivery, a confirmed Refund/Cancellation policy, a GST/business identity line. Razorpay's KYC review checks for these. [A: standard Razorpay website requirements; confirm on their dashboard]
4. **Monitoring**: something that tells you when the site is down or the order form fails.
5. **Later, for online payment**: one server-side function that re-prices the cart itself and checks Razorpay's signature.

### Biggest risks (detail in Part 6)
1. **High (process):** a broken page can go live, because Playwright/axe/visual tests don't block the Vercel deploy. The last two CI runs on `main` were cancelled, and the last green one was 10 Oct.
2. **Medium:** tooling files are served publicly (`/tests/…`, `/qa/…`, `/.github/workflows/qa.yml`, `/.beads/config.yaml`, `/.githooks/pre-push`, `/vercel.json`, …). They contain no secrets, but it is unnecessary exposure.
3. **Medium (business/legal):** the refund schedule is published in every footer, yet bead `site-h04` says it isn't confirmed with Aayush. There are also no Terms or Shipping pages.
4. **Medium (future):** prices live in the browser. That is fine today, because a human re-prices every order. **It becomes Critical the day a "Pay" button exists** unless a server re-prices.
5. **Low–Medium:** no uptime or error monitoring. A dead Web3Forms key or quota would only be noticed when customers complain.

### Overall recommendation
**Keep the architecture.** Static on Vercel is the right fit: secure by default, close to free, and simple for a beginner working with AI. Finish four hardening items (Milestone 1, Part 8). Add **one** Vercel serverless function plus Razorpay when you want on-site payment. Defer login until there is a member benefit worth an account.

---

## Part 2 · Existing architecture (verified)

| Area | Finding | Evidence |
|---|---|---|
| Languages | HTML, CSS, JavaScript (ES modules in the browser; Node scripts for build and tests) | `package.json` `"type": "module"`, `scripts/*.js` |
| Framework | None | No framework dependency in `package.json` |
| Package manager | npm. Dev-only dependencies: Playwright 1.58.2, axe-core, ESLint 10, knip, sharp | `package.json`. **`package-lock.json` is git-ignored** (`.gitignore`), so CI installs whatever versions resolve that day |
| Build | `npm run build` = `includes.mjs` (stamps header/footer from `data/site.js` into every page) → `prerender.mjs` (writes Journal article HTML) → `npm test` | `package.json`, README |
| Output | **The whole repo folder is the website** (`"outputDirectory": "."`). `.vercelignore` removes only `node_modules`, `_audits`, `assets/og-templates` and `*.md` | `vercel.json`, `.vercelignore` |
| Hosting | Vercel production, Mumbai edge (`x-vercel-id: bom1`). Deploys are created by `vercel[bot]` on each push to `main` | live headers; `gh api …/deployments` |
| Domain | `earthbox.in` → **307 (temporary)** → `www.earthbox.in`; `http://` → 308 → https | `curl -sI` |
| Security headers | HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, COOP, and a CSP (rules for which sites the page may load from) allowing only self, GA and Web3Forms. CSP permits `'unsafe-inline'` scripts | `vercel.json`, confirmed on live response |
| Caching | HTML `max-age=0` (always fresh). `/assets/*` cached 1 year `immutable`, **but file names have no version hash** | `vercel.json` |
| Redirects | Old `/catalogue/*` URLs → `/products.html` (301) | `vercel.json` |
| Page JS | `scripts/main.js` loads shared modules (theme, header, menu, cart, motion) and imports page modules only where their root element exists (`PAGE_MODULES`) | README map, `scripts/main.js` |
| Data | `data/site.js` (nav, contact, refund text, GA snippet), `volume-one.js` (32 products: 9 with a price table, 23 `pricing: null`), `upcoming.js` (chambers), `maker.js`, `care.js` (all prices null), `articles.js`, `reviews.js` | grep counts |
| External services | Google Analytics 4 (after consent), Web3Forms (email form), WhatsApp deep links, Google Fonts allowed by CSP (privacy page says fonts are self-served) | `consent.js`, `enquiry-form.js`, `vercel.json` |
| Server code / database / auth | **None** | No `api/` folder, no functions, no DB client |
| Tests | 7 unit test files (`node --test`), ESLint, 4 static checkers, 5 Playwright specs (smoke, journeys, a11y, visual, contrast) on desktop/phone/tablet, Lighthouse CI, a pixel-level contrast audit | `scripts/*.test.mjs`, `tests/`, `qa/`, `.github/workflows/qa.yml` |
| Git | Single branch `main`, 99 commits, pushes straight to `main`; the GitHub repo is **public**. Branch protection: not found (HTTP 404, which can mean "none" or "no permission") **[U]** | `git branch -a`, `gh api` |
| Issue tracking | beads (`bd`), prefix `site-`; 13 open issues incl. `site-h04` (refund wording), `site-aom` (login), `site-eeh` (Care), `site-ez9` (404 page) | `bd list` |
| Hooks | `.githooks/pre-push` runs `npm test` (enabled by `npm install`) | file |

**Checks I ran (read-only) [V]:** unit tests 7/7 pass · ESLint clean · `check-contrast` OK (16 pairs) · `check-assets` OK (1,278 refs, 3 known gaps: bird-feeder photo `site-tue`) · `includes --check` OK (31 pages) · `npm audit --omit=dev`: 0 vulnerabilities (nothing ships to visitors from npm) · `npm audit` (all): **1 high in `sharp`** (image tool, dev-only, not deployed).

---

## Part 3 · Capability table

| Capability | Now / Later / Unnecessary | Why | Depends on | Cost / ops |
|---|---|---|---|---|
| Sign-up / sign-in / sign-out | **Later (maybe never)** | No feature needs an account yet. Orders work without one, and `site-aom` has no defined benefit | A member benefit decision | Managed auth: free tier, but adds a backend + privacy duties |
| Email verification, password recovery | Later, only with auth | Comes built into managed auth | Auth | Included |
| Profiles / settings | Later | Nothing to configure. Theme and cart already persist locally | Auth + DB | Low |
| Session persistence | **Now (exists)** for cart/theme/consent via localStorage | Works without accounts | — | None |
| Public vs protected areas | Unnecessary now | Everything is public marketing content | Auth | — |
| Roles / permissions | Unnecessary now | One studio owner, no admin UI | Auth | — |
| Admin workflows | Later (light) | Aayush edits prices via code today. If that's painful, a git-based CMS or a Google Sheet → build step beats a custom admin | Decide who edits prices | Low |
| Database / user data | Unnecessary now; **Later** for orders once payments exist | Today orders live in WhatsApp/email. A paid order needs a record | Payments | Free tiers exist |
| File uploads | Later (Care "own plants" photo) | CARE-PLAN mentions a photo. WhatsApp handles photos for free today | Care decision | Storage + abuse handling |
| Transactional email | **Now (exists)** via Web3Forms; Later: order confirmation to the customer | Studio receives enquiries. Customers get no receipt | Payments | Web3Forms free tier limits **[U]** |
| Analytics | **Now (exists)**, consent-gated GA4 | Done correctly | — | Free |
| Error / uptime monitoring | **Now (missing)** | You'd learn of an outage or a broken form from customers | — | Free tier (e.g. a ping monitor; Vercel's own logs) |
| Payments | **Later (next big step)** | Manual Razorpay links work at current volume | Razorpay KYC in EarthBox's name, legal pages, server function | Razorpay fee per transaction [A ~2%]; Vercel function free tier |
| Subscriptions | Later (Care visit plans could be recurring) | Plans are a one-off quote today | Payments | Razorpay Subscriptions |
| Search | Exists (Maker plant search, in-browser) | Small catalogue; no service needed | — | None |
| Integrations / external APIs | Exists: WhatsApp, Web3Forms, GA | Enough for now | — | — |
| Privacy / consent / deletion / retention | **Now (mostly done)**: consent banner + privacy page + deletion by email | DPDP Act (India) basics covered for a no-account site [A] | — | None |
| Backups / recovery | **Now (exists implicitly)**: git history + Vercel keeps previous deploys (instant rollback) | No user data to back up | — | None |
| Rate limiting / abuse prevention | Now (light): honeypot exists. Web3Forms key is public by design | Spam is the only realistic abuse | — | Free |
| Automated testing / staging / production | **Now (exists, but gate is incomplete)** | See Parts 6–7 | — | GitHub Actions minutes (free for public repos) |

---

## Part 4 · Recommended architecture

**Stay static. Add exactly one small server piece when online payment starts.**

```
TODAY (keep)                                    LATER (Phase 3, payments only)
──────────────────────────────────              ─────────────────────────────────────
 Visitor's browser                               Visitor's browser
  ├─ static pages from Vercel CDN                 ├─ cart sends ids only {sku, variant, qty}
  ├─ cart in localStorage (ids only)              │
  ├─ GA4 (only after Accept)                      ▼
  └─ "Send order" ──► WhatsApp / Web3Forms       /api/checkout  (Vercel function)  ◄── TRUST BOUNDARY
                         │                         ├─ re-prices from data/*.js on the server
                         ▼                         ├─ creates Razorpay order (secret key in Vercel env)
                   Aayush re-prices, sends         └─ returns order id
                   Razorpay link by hand          Razorpay checkout (hosted by Razorpay)
                                                  /api/razorpay-webhook
                                                   ├─ verifies signature (webhook secret in env)
                                                   └─ records paid order (sheet/DB) + emails both sides
```

**Information flow and security boundaries**
- **Today** nothing the browser says is trusted. A human (Aayush) reads every order and confirms price. That is a valid security control at this volume.
- **With payments**, the boundary moves to `/api/checkout`. The browser may only say *what* it wants. The server decides *how much*. Card data never touches EarthBox; Razorpay hosts it. Secrets (Razorpay key secret, webhook secret) live only in Vercel environment variables (settings stored on Vercel, not in code), never in `data/` or the repo.
- **Personal data** stays minimal: name and contact on orders. No accounts means no passwords to leak.

**Environments.** *Local* (`python3 -m http.server` or `node qa/serve-cli.mjs`) → *Preview* (Vercel builds a private URL for every branch or pull request; use it) → *Production* (`main`). Razorpay **test keys** go in Preview, live keys only in Production.

---

## Part 5 · Alternatives & trade-offs (decided)

| Decision | Options | Recommendation | Why |
|---|---|---|---|
| Framework | Keep plain static vs move to Next.js/Astro | **Keep** | No feature needs it. A rewrite is risk for no user benefit. Astro is the fallback only if page count explodes |
| Backend | None vs serverless functions vs full server | **None now → Vercel functions at payments** | Same host, same repo, no servers to patch |
| Payments | Manual links vs Razorpay Checkout + function vs Shopify | **Manual now → Razorpay Checkout + function** | CART.md already plans this. Shopify would replace the bespoke Maker/cart experience |
| Auth (only if login is approved) | Clerk vs Supabase Auth | **Supabase Auth**, *if and when* needed | You'd need a database for members anyway (Supabase gives both, with row-level security, i.e. database rules that only let each user see their own rows). Clerk is the polished login UI but would still need a separate DB. For a newsletter only, use a newsletter tool, not auth |
| Order records | Email/WhatsApp vs Google Sheet vs DB | **Email + Razorpay dashboard first**; Sheet if Aayush wants a list | Razorpay already stores paid orders |
| Price editing | Code edits vs CMS vs Sheet | **Code edits via Claude for now** **[U]** | Ask how often prices change |
| Release gate | Vercel deploys on push vs deploy only after CI passes | **Gate on CI** (Part 8, M1) | The single biggest quality lever |

---

## Part 6 · Risks & security review

No secret values were printed. The Web3Forms access key and GA id are public by design.

| # | Finding | Severity | Evidence | Remediation |
|---|---|---|---|---|
| R1 | **Browser tests don't block release.** Vercel deploys on push after `npm test` only. Playwright, axe, visual, Lighthouse and contrast run in GitHub Actions *in parallel with or after* the live deploy. The last 2 CI runs on `main` were **cancelled** (each new push cancels the running one), and the last success was 10 Oct (run 38075663247). A new push landed during this review [V] | **High** (process) | `.github/workflows/qa.yml` (`cancel-in-progress: true`), `gh run list`, deployments list | Work on branches → Vercel Preview → CI must pass → merge to `main`. Or set Vercel's "wait for checks" / deploy from CI. Turn on branch protection requiring the `checks` + `browser` jobs |
| R2 | **Non-site files publicly served** (`outputDirectory: "."`): `/tests/smoke.spec.mjs`, `/scripts/*.test.mjs`, `/qa/serve.mjs`, `/qa/contrast/baseline.json`, `/.github/workflows/qa.yml`, `/.beads/config.yaml`, `/.beads/metadata.json` (internal project id), `/.beads/hooks/*`, `/.githooks/pre-push`, `/vercel.json`, `/eslint.config.js`, `/lighthouserc.json` all return 200. `package.json` and `*.md` are correctly blocked [V] | **Medium** (no secrets found, but it's information disclosure and a trap: the next file someone adds might be a secret) | `curl` probes; `.vercelignore` | Extend `.vercelignore`: `tests/`, `qa/`, `.beads/`, `.github/`, `.githooks/`, `scripts/*.test.mjs`, `scripts/check-*.mjs`, `scripts/includes.mjs`, `scripts/prerender.mjs`, `*.config.*`, `lighthouserc.json`, `vercel.json`. Add a smoke test asserting these return 404 live |
| R3 | **Client-side prices** in `data/*.js`. A visitor can edit the WhatsApp/email message or localStorage. **Today harmless** (Aayush re-prices every order; `clean()`/`resolve()` re-read prices and drop unknown SKUs) [V] | **Low now → Critical with an online "Pay" button** | `scripts/cart.js` header comment, `resolve()`/`clean()` | When payments come: server re-prices from ids; amount never comes from the browser; verify Razorpay signature + webhook; idempotent order handling (a repeated payment notification can't create a second order) |
| R4 | **Refund policy published but unconfirmed** (4-tier schedule in every footer; bead `site-h04` open P1). **No Terms of sale, Shipping/Delivery or Cancellation page**; no business/GST identity on site [V for site, A for legal need] | **Medium** (consumer-law and Razorpay KYC exposure) | `data/site.js` `REFUND`, footer, `bd list` | Aayush confirms wording; add `terms.html`, `shipping.html`, `refunds.html` (one source in `data/site.js`); add legal name and GST (if registered) to the footer |
| R5 | **No monitoring.** No uptime check, no client error capture, no alert if Web3Forms rejects (bad key, quota) [V: no handler; U: Web3Forms quota] | Low–Medium | grep for error handlers: only inline image `onerror` | Free uptime monitor on `/` and `/products.html`; a weekly scheduled CI run of the smoke suite against live (`BASE_URL` already supported); Web3Forms test submission monthly |
| R6 | **CSP allows `'unsafe-inline'` scripts**, needed today for the inline gtag snippet and inline `onerror=` attributes. This weakens the main defence against injected scripts. Rendering escapes consistently via `esc()` (incl. single quotes) and untrusted inputs go through `decodeBuild`/`decodePlan`/`clean` allow-lists, so I found **no injection path** [V, by reading the code] | Low | `vercel.json`; `scripts/util.js`; `render-product-detail.js:250,355` use unescaped `alt="${p.name}"` (trusted data, so low) | Move the gtag stub into `consent.js`; replace inline `onerror` with a delegated listener; then drop `'unsafe-inline'` from `script-src`. Escape the two `alt` values for consistency |
| R7 | **`package-lock.json` is git-ignored**, so CI and Vercel resolve dependency versions fresh each run (Playwright and ESLint are pinned exactly; `sharp` is `^`) [V] | Low–Medium (reproducibility) | `.gitignore` | Commit the lock file; use `npm ci` in CI |
| R8 | `npm audit`: **1 high in `sharp`** (libvips/libheif/librsvg CVEs) [V] | Low (dev-only image script, never deployed or fed untrusted images) | `npm audit` | Upgrade sharp to 0.35.x when convenient; re-run the image script once to confirm |
| R9 | **Assets cached 1 year as `immutable` without versioned names.** Replacing a photo under the same name won't reach returning visitors [V config, A impact] | Low | `vercel.json` `/assets/(.*)` | Rename on change (e.g. `name-v2.webp`) or lower to `max-age=86400` |
| R10 | Apex domain redirect is **307 (temporary)** instead of 308 [V] | Low (SEO) | `curl -sI https://earthbox.in` | In Vercel domains, set the apex redirect to permanent |
| R11 | **Web3Forms key in page source** (intended). Anyone can use it to send mail to the studio inbox [V by design] | Low | `scripts/enquiry-form.js` | Accept. Keep the honeypot. If spam starts, enable Web3Forms' domain restriction/captcha [U: plan tier] |
| R12 | **Public GitHub repo, direct pushes to `main`, no branch protection found**; two GitHub accounts in play (`ozapravar-crypto` pushes, `pravaroza-stack` is local git user) [V/U] | Low–Medium | `gh api`, README "Deploy" | Decide: private repo? (Vercel free works with private). Enable protection on `main` |
| R13 | No branded **404 page** (Vercel default) [V]; bead `site-ez9` | Low (UX) | `/nope.html` returns Vercel default | Add `404.html` |
| R14 | Personal Gmail and mobile number are the business contact [V] | Info | `data/site.js` | Consider a domain email (`hello@earthbox.in`) before payments, since KYC and trust both benefit |

**Positive findings [V]:** strong security headers; consistent HTML escaping; allow-list decoding of URL hashes and storage; the Maker's "Your space" answers kept out of share links; GA properly consent-gated on all 31 pages; no secrets in tracked files or git history (pattern scan for common key formats: 0 hits); 0 vulnerabilities in anything shipped.

---

## Part 7 · QA & production-readiness plan

### Existing (substantial, keep it) [V]
| Layer | Tool | Runs where | Gates deploy? |
|---|---|---|---|
| Rules + data shape | `node --test` (7 files) | Vercel build, pre-push, CI | **Yes** |
| Lint, includes, prerender, assets, token contrast | ESLint + `check-*.mjs` | Vercel build, pre-push, CI | **Yes** |
| Smoke, journeys (27 tests), a11y (axe WCAG 2.1/2.2 AA), visual (42 shots), contrast regressions | Playwright, desktop/phone/tablet | CI + local | **No** |
| Lighthouse (a11y ≥ 0.95, SEO/BP ≥ 0.9 hard; perf warn) | lhci | CI | **No** |
| Full pixel contrast audit (808 states) | `qa/contrast` | CI (~26 min) | **No** |
| Live smoke | `BASE_URL=https://www.earthbox.in npx playwright test tests/smoke.spec.mjs` | Manual | — |

The QA documents (`qa/QA_PLAN.md`, `QA_RUN_REPORT.md`, `QA_TEST_MATRIX.md`, `QA_BUG_REPORT.md`) honestly list what isn't covered: real iOS Safari, Firefox, screen-reader listening, live Web3Forms/WhatsApp.

### Gaps (proposed)
| Gap | Proposal | Acceptance criterion |
|---|---|---|
| Release gate | CI required before production (R1) | No production deploy exists whose commit lacks a green `checks` + `browser` run |
| Exposure regression | Smoke test: tooling paths return 404 (R2) | 0 non-site paths return 200 on Preview and live |
| Header/CSP regression | Test asserting CSP + HSTS present on live | Fails if any header disappears |
| Live service canary | Weekly scheduled CI: smoke vs live + one real Web3Forms test send (to a test inbox) | Alert within 7 days of the form breaking |
| Cross-browser | Add WebKit (Safari engine) project for smoke + journeys | Cart → order message passes on WebKit phone |
| Dependency audit | `npm audit --omit=dev` in CI (fails on high) + Dependabot | 0 high in shipped code |
| Payments (Phase 3) | Unit: server re-pricing ignores client amounts. Integration: Razorpay test mode, signature valid/invalid, duplicate webhook | Tampered price → server charges the data price; invalid signature → rejected; duplicate webhook → one order |
| Auth (only if built) | Sign-up/in/out, reset, protected page redirects, user A can't read user B | All pass on Preview with test project |
| Care forms | Already planned in CARE-PLAN Verification (journeys, mocked success/error) | As written there |

### Release gates (every production release)
1. `npm test` green (exists).
2. GitHub Actions `checks` + `browser` green on the exact commit (new requirement).
3. Lighthouse assertions green (exists, make required).
4. Preview URL looked at by a human at 375 px and 1440 px, light and dark, for any UI change.
5. After deploy: live smoke run green within 10 minutes.

---

## Part 8 · Phased roadmap

### Milestone 1 · "Production-worthy shop window" (first, about 1–2 sessions)
- **Objective:** what's live is what passed the tests, and nothing extra is exposed.
- **Files/systems:** `.vercelignore`, `.github/workflows/qa.yml`, GitHub branch protection, Vercel Git settings, `.gitignore` (commit the lock file), `tests/smoke.spec.mjs`, Vercel domain redirect.
- **Prerequisites:** your OK to change GitHub/Vercel settings (Part 9). The Care agent has finished or paused its pushes.
- **Deliverables:** R1, R2, R7, R10 fixed; a 404 test for tooling paths; workflow = branch → Preview → CI → merge.
- **Tests:** CI green; `curl` of the R2 list returns 404 on Preview, then live.
- **Definition of done:** a deliberately broken branch is blocked from production (prove once), and the R2 paths return 404 live.
- **Risk/rollback:** an over-broad `.vercelignore` could hide a real page or script → caught by `check-assets`/smoke on Preview; rollback = Vercel "Promote" previous deployment (one click).

### Milestone 2 · "Legally ready to sell" (needs Aayush)
- **Objective:** the pages and identity Razorpay KYC and customers expect.
- **Files:** `data/site.js` (one source), new `terms.html`, `shipping.html`, refunds section/page, footer; `privacy.html` update; optional domain email.
- **Prerequisites:** Aayush confirms refund wording (`site-h04`), delivery area/time, legal entity name, GST status.
- **Tests:** `includes --check`, a11y, visual baselines; links in footer resolve.
- **Done:** all policy pages live, linked from the footer, wording approved by Aayush in writing.
- **Rollback:** content-only; revert commit.

### Milestone 3 · "Know when it breaks"
- **Objective:** monitoring and hygiene.
- **Deliverables:** uptime monitor; weekly live canary (R5); CSP tightening (R6); sharp upgrade (R8); asset cache fix (R9); branded 404 (`site-ez9`); WebKit project.
- **Done:** an induced outage on a Preview alias triggers an alert; CSP without `'unsafe-inline'` scripts passes all suites.
- **Rollback:** each item is a separate commit.

### Milestone 4 · "Pay online" (when Razorpay KYC in EarthBox's name is approved)
- **Objective:** "Ready to order" lines payable on-site; enquiry/custom lines still quoted.
- **Files:** `api/checkout.js`, `api/razorpay-webhook.js` (Vercel functions), `scripts/cart.js` (Pay button), Vercel env vars (test keys in Preview, live keys in Production), order record (Razorpay dashboard + email; Sheet optional).
- **Tests:** Part 7 payment row, all in Razorpay test mode on Preview.
- **Done:** a test payment round-trips; a tampered price is charged at the server price; an invalid signature is rejected; customer + studio both get confirmation.
- **Risk/rollback:** feature flag in `data/site.js` (`PAYMENTS_ON`) so the WhatsApp path stays as a fallback; turn off without a redeploy of code logic.

### Milestone 5 · Accounts (only if a member benefit is defined)
Supabase Auth + DB, a privacy update, account deletion, and the auth test row. Not scheduled.

---

## Part 9 · Beginner's operating guide

**Five concepts worth knowing**
1. **Static site:** files only, no program running. Very little to hack, very little to maintain. You give this up only when you need secrets (payments) or per-person data (login).
2. **Preview vs Production:** every branch gets its own private Vercel URL. Look there first; `main` is what customers see.
3. **The browser is not trusted:** anything in `data/*.js` or localStorage can be read and edited by any visitor. Fine for showing prices, never for charging them.
4. **Secrets live in Vercel environment variables**, never in a file in the repo (the repo is public).
5. **Rollback is one click:** Vercel → Deployments → the previous good one → "Promote to Production".

**Claude handles without asking:** reading code, running tests, small fixes on a branch, adding tests, updating docs inside the repo, opening a Preview.

**Needs your approval:** merging to `main` / anything that goes live; changing GitHub or Vercel settings (branch protection, domains, env vars); adding a paid or new third-party service (monitoring, Supabase, Razorpay); anything that collects new personal data; published wording on refunds, terms and prices (Aayush's call); making the repo private or public; deleting anything.

**How to judge AI work quickly:** ask for (a) the Preview link, (b) the CI run link showing green, (c) the list of files changed. If a change touches files unrelated to the request, ask why.

---

## Part 10 · Decisions & unknowns

### Must decide before Milestone 1–2
| Question | Options | Recommended default |
|---|---|---|
| Should every change go through a branch + Preview + CI before going live? | Yes (slower by ~20–30 min per release) / No (keep pushing to `main`) | **Yes** |
| Refund wording (`site-h04`) | Keep the 4-tier schedule / Aayush rewrites | Aayush confirms in writing; until then keep but add "case-by-case, contact us" |
| Legal identity for the footer and KYC | Sole proprietor name / company; GST yes/no | **[U]**, needed from Aayush |
| Repo visibility | Public / private | **Private** (nothing gained from public; fewer eyes on tooling) |

### Decide before payments
| Question | Options | Default |
|---|---|---|
| Is Razorpay KYC in EarthBox's name started? | — | **[U]** |
| What can be paid online? | Only fixed-price lines / also deposits on custom builds | Fixed-price lines only first |
| Where should paid orders be recorded? | Razorpay dashboard + email / Google Sheet / DB | Dashboard + email |

### Can wait
- **Login (`site-aom`):** what would a member get that a visitor doesn't? No benefit means no login. For a newsletter only, a signup form to an email tool (no accounts).
- **How often do prices change, and who edits them?** If weekly by Aayush himself, consider a Sheet → build step.
- **Web3Forms plan limits and spam level** **[U]**.

---

## Part 11 · Final recommendation

**Architecture:** keep the static, no-framework site on Vercel. Add one pair of Vercel serverless functions (checkout + webhook) only when on-site payment starts. Defer auth; if it's ever needed, Supabase Auth + DB.

**First milestone:** M1 "Production-worthy shop window": CI-gated releases via branch → Preview → `main`, `.vercelignore` hardening, lock file committed, apex 308.

**Exact pre-ship checks (each release)**
1. `npm test` passes locally and in Vercel.
2. GitHub Actions `checks` + `browser` + `lighthouse` green on the commit being shipped (not cancelled).
3. Preview reviewed at 375 / 1440 px, light and dark.
4. `curl -s -o /dev/null -w "%{http_code}"` on `/tests/smoke.spec.mjs`, `/.beads/config.yaml`, `/.github/workflows/qa.yml` → 404.
5. Live security headers present (`curl -sI https://www.earthbox.in/`).
6. After deploy: `BASE_URL=https://www.earthbox.in npx playwright test tests/smoke.spec.mjs` green.
7. One real cart → WhatsApp message and one real enquiry-form submission reach the studio (monthly, and after any cart/form change).

**Information needed from you / Aayush**
1. OK to switch to branch + Preview + required CI (and to change GitHub/Vercel settings).
2. Confirmed refund wording, delivery area/timing, legal name, GST status.
3. Razorpay KYC status in EarthBox's name.
4. Public or private repo.
5. Whether login has a concrete member benefit (otherwise close or park `site-aom`).
