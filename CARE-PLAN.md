# Plan: EarthBox Care: maintenance visits, refill kits, cart upsells

**TL;DR:** ***Add "Care" as a fourth thing the site sells, alongside ready pieces, chambers and custom builds. Homes get either a **refill kit** matched to their plants or a **visit plan**: duration × visits, priced as one per-visit rate × number of visits. Custom boxes and businesses get a quote. Businesses have their own enquiry form. Upsells are a few "goes with your order" rules in the cart drawer. Everything shows "On enquiry" until Aayush sets the rate, so it can go live before prices exist.***

## Context
- **Ask:** Aayush wants to sell:
  - in-person maintenance: separate for businesses and homes;
  - for homes, three cases: a standard EarthBox piece, a custom box, or their own plants;
  - each case as a kit or as visits, where visits have a duration and a number of visits;
  - kits per plant type;
  - upsells once items are in the cart.
- **Your answers:** businesses and homes are separate; a kit is a refill kit matched to the plant group; pricing is a per-visit rate × visits, with a quote for businesses and custom boxes.
- **What exists today:**
  - The cart has three line kinds (`scripts/cart.js` `resolve()`: fixed / enquiry / custom). Everything is resolved from `data/`.
  - The 9 plant groups are in `data/maker.js` `elements`, and `chamberElements` maps each chamber to its groups.
  - The requirements workbook taxonomy already lists a soil per group and "Care Services" as a category.
- **Conflicts to flag:**
  - The workbook's care drafts (SVC-001…006) were written by us. They say **Delhi NCR**, and Aayush's feedback says Kandivali, Mumbai, with no studio. **This plan uses Mumbai and drops the "studio visit".**
  - Delivery/install, replacement cover and heritage add-ons stay out of scope.
  - **Upsells overlap with the deferred recommendations bead (site-8bo).** The "goes with" rules are built once here, and site-8bo reuses them later.

## 1 · The model: how Care is sold

| Who | Looks after | Kit (no visit) | Visits (people) | Price |
|---|---|---|---|---|
| Home | Standard EarthBox piece (chamber, planter, plant) | Refill kit for that piece's plant group, picked automatically | Visit plan | Kit: fixed. Visits: rate × visits |
| Home | Custom box (Maker build) | Refill kit(s) for the groups in the build | Visit plan | Kit fixed; visits **quote** (bespoke) |
| Home | Their own plants | They pick the plant group(s) | Visit plan (+ number of plants, photo) | Kit fixed; visits rate × visits |
| Business (offices, cafés, hotels) | Any | — | Ongoing contract | **Always quote**, separate form |

- **Visit plan = duration × frequency.**
  - Durations: 1 visit, 3, 6 or 12 months.
  - Frequency: fortnightly, monthly or quarterly.
  - The number of visits is calculated (e.g. 12 months × monthly = 12 visits) and shown before they add it.
- **Price** = `perVisit × visits × (1 − termDiscount)`. Aayush sets `perVisit`, plus discounts for 6 and 12 months. Until then the line shows "On enquiry", the same way chambers do now.
- **Refill kit**, one per plant group (up to 9): soil top-up, feed, tool and care card, each with a `price` (null until set).
- **Coverage:** Mumbai. The form asks for a pincode, and an out-of-area pincode gets "we'll confirm".

## 2 · Data and rules (one source of truth, like the rest of the site)
- **New `data/care.js`:**
  - `kits` (`KIT-<GROUP>`, contents, `price: null`)
  - `visit` (`durations`, `frequencies`, `perVisit: null`, `termDiscount`)
  - `subjects` (piece / custom / own)
  - `coverage`
  - kit groups are taken from `elements` in `data/maker.js`, not retyped.
- **New `scripts/care.js` (pure functions):**
  - `visitsFor(duration, freq)`
  - `planPrice(plan)` → number or null
  - `kitFor(item)`: chamber/plant → group, via `chamberElements`
  - `encodePlan`/`decodePlan`, like the Maker's share code
- **`scripts/cart.js`:** add line kind `care` (`{kind:'care', code}`) in `resolve()`, `keyOf()`, `clean()` and `orderText()`.
  - It resolves to `fixed` when priced, `enquiry` otherwise.
  - Kits are ordinary `{kind:'product', sku:'KIT-…'}` lines, found by extending the `p` lookup.
  - The order message lists duration, frequency, number of visits, what's being looked after, and the pincode.
- **New `scripts/pairings.js` (shared with site-8bo):** `suggest(cartLines) → [line]`. Rules:
  - plant or chamber → matching refill kit
  - chamber or custom build → visit plan
  - planter → plant packet / support
  - Never "coming soon", never something already in the cart, at most 2 suggestions.

## 3 · Where it shows (UI)
1. **New page `care.html` "Care"**, added to the nav in `data/site.js` `NAV` and stamped by `includes.mjs`:
   - **For homes:** a 3-step planner. What are we looking after (piece / custom box / own plants) → kit or visits → for visits, duration + frequency with a live visit count and price or "On enquiry" → Add to cart.
   - **For businesses:** a separate enquiry form (company, site type, number of plants/sites, frequency, pincode). It reuses the existing Web3Forms enquiry code and is never added to the cart.
2. **Product pages** (chambers, plants, planters): a "Keep it thriving" block with the matching kit and "Plan visits", which opens `care.html` prefilled.
3. **Maker review step:** "Add care for this world" (kit, or visits → quote).
4. **Cart drawer:** "Goes with your order" (up to 2 suggestions from `pairings.js`) above the summary; one tap to add.
5. **Footer + homepage:** a Care link, plus one band on the homepage.

## 4 · Phases (each one ships on its own)
1. **Data, rules and cart kinds**, plus unit tests. Nothing visible changes.
2. **`care.html`:** the home planner and the business form.
3. **Entry points:** product pages, Maker review, cart upsell, nav and footer.
4. **QA:** journeys, a11y/contrast/visual baselines, docs (`CART.md` + `CARE.md`), push.

**Order with work already running:** finish and push the QA work and the cookie banner (site-dni) first, then Phase 1.

## 5 · Needs Aayush (the site works without these; it shows "On enquiry")
- per-visit rate, plus discounts for 6 and 12 months
- each kit's contents and price, per plant group
- covered areas or pincodes, how long a visit takes, minimum terms for businesses
- whether custom-box visits can ever have a fixed price

## Critical files
- **New:** `data/care.js`, `scripts/care.js`, `scripts/pairings.js`, `care.html`, `scripts/care-page.js`, `styles/care.css`
- **Edited:**
  - `scripts/cart.js`: new kind, upsell block
  - `scripts/render-product-detail.js`: "Keep it thriving"
  - `scripts/maker.js`: review step
  - `data/site.js`: NAV and footer
  - `scripts/main.js`: page module
- **Reused:** `elements`/`chamberElements` (`data/maker.js`), `esc`/`rupees`/`track` (`scripts/util.js`), the enquiry form code, `parseRange`

## Verification
- **Unit tests:**
  - `visitsFor` (all duration × frequency combinations)
  - `planPrice` (null rate → null; discounts)
  - `kitFor` for every chamber
  - care-line round trip, `clean()` on tampered care lines
  - `suggest()` (never coming-soon or a duplicate, at most 2)
- **Journeys (Playwright):**
  - home planner → add to cart → order message contains the plan
  - business form success, error and invalid input (mocked)
  - kit added from a product page
  - upsell appears, adds, then disappears
  - the custom-box path shows a quote
- `npm test`, the full Playwright run (desktop/phone/tablet), new visual baselines, and a11y with the Care page and its states.
- Live check after deploy: `BASE_URL=https://www.earthbox.in npx playwright test tests/smoke.spec.mjs`.
