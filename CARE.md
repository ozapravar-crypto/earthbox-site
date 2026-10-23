# Care: refill kits, visit plans, cart suggestions

**TL;DR:** ***`care.html` sells care two ways. Homes choose a refill kit matched to their plants, or a visit plan (how long × how often). Businesses ask for a quote. Every price is empty until the studio sets it, and an empty price shows "On enquiry", so all of it works today. The cart suggests the matching kit or visits, at most two, from plain rules.***

## How it's sold

| Who | Looks after | Kit | Visits | Price |
|---|---|---|---|---|
| Home | An EarthBox piece | Matched to the piece's plant group automatically | Plan: duration × frequency | Kit: its own price. Visits: rate × number of visits |
| Home | Their own plants | They pick the plant groups | Plan + how many plants | As for a piece |
| Business | Anything | — | — | Always a quote (form on `care.html#business`) |

Visits are Mumbai only. The pincode is optional; anything outside 400001–400104 is accepted with "studio to confirm".

## Where it shows
- **`care.html`:** the home planner, then the business form. Linked from the top bar, the footer and a homepage band.
- **Product pages** (chambers, planters, plants, supports): "Keep it thriving" offers the matching kit plus a link to a visit plan prefilled for that piece.
- **Cart drawer:** "Goes with your order": up to two items, never a coming-soon piece, never something already in the cart, and no visit suggestion once a plan is in the cart.

## For the studio: setting prices (one file, `data/care.js`)
- **Kit:** set `price` on a kit in `kits` (whole rupees). Contents are in `KIT`, one list per plant group.
- **Visits:** set `visit.perVisit`. Optional term discounts: `visit.termDiscount` (`0.05` = 5% off).
- **What a visit includes:** `visit.includes`.
- **Business site types:** `businessSites`.

Once a price is set, the cart line moves from "On enquiry" to priced automatically. Custom-box visits stay quoted.

## Files

| File | Owns |
|---|---|
| `data/care.js` | Kits, visit options, subjects, coverage, business site types |
| `scripts/care.js` | Rules: `visitsFor`, `planPrice`, `groupsOf`, `kitFor`, plan codes (`encodePlan`/`decodePlan`), `planSummary`. Checked by `care.test.mjs` |
| `scripts/pairings.js` | `suggest(cart)`, the cart's suggestions (reused later by "Recommended for you", site-8bo). Checked by `pairings.test.mjs` |
| `scripts/care-page.js` | The planner UI and business-form wiring |
| `scripts/cart.js` | Care lines: `{kind:'care', code}` (no quantity); kits are ordinary product lines |
| `styles/care.css` | The page |

**Tests:**
- `cart.test.mjs` care cases
- journeys "Care…" and "Cart suggests…"
- a11y care states
- contrast CQ-016
- visual `care`, `care-visits`, `cart-suggestions`
