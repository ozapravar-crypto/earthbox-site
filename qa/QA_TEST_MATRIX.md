# QA test matrix

**TL;DR:** ***Every route and major state, which test covers it, and on which devices. Each "✓" points to a real test. Gaps are listed as gaps, not marked as covered.***

Key: **S** smoke · **J** journeys · **A** a11y (axe) · **V** visual · **C** contrast (spec + full audit) · **L** Lighthouse · **U** unit/data. Devices: D desktop 1440 · P phone (Pixel 7) · T tablet 820.

## Routes

| Route | Loads clean (S) | A | V | C | L | Devices |
|---|---|---|---|---|---|---|
| `/index.html` | ✓ | ✓ | ✓ | ✓ | ✓ | D P T |
| `/products.html` | ✓ | ✓ | ✓ | ✓ | ✓ | D P T |
| `/product.html#<V1 priced>` | ✓ | ✓ | ✓ | ✓ | ✓ | D P T |
| `/product.html#<V1 enquiry / plant>` | ✓ | — | — | ✓ | — | D P |
| `/product.html#<chamber>` | ✓ | ✓ | ✓ | ✓ | — | D P T |
| `/product.html#VIV-III` | ✓ (C) | ✓ | — | ✓ | — | D P |
| `/product.html#<unknown>` | J | ✓ | ✓ | ✓ | — | D P T |
| `/maker.html` | ✓ | ✓ | ✓ | ✓ | ✓ | D P T |
| `/blog.html` | ✓ | ✓ | ✓ | ✓ | — | D P T |
| `/blog/<23 articles>` | 1 in S, all 23 in C + prerender check | 1 | 1 | all | 1 | D P (T for 1) |
| `/about.html` | ✓ | ✓ | ✓ | ✓ | — | D P T |
| Unknown URL (404) | **gap**: Vercel's default page (site-ez9) | — | — | — | — | — |

## Features and states

| Feature / state | Test | Devices |
|---|---|---|
| Header fits, no wrap, no overlap, 360–1920px | S `header fits at every width` | 12 widths |
| Mobile menu: Maker listed, Journal current on articles | S | P |
| Theme toggle persists across reload and pages | J | D P |
| Catalogue search: results / empty / Escape | J; A, C (states) | D P |
| Catalogue volume tabs | C (states) | D P |
| Product size + material → price, WhatsApp text, cart line | J | D P |
| Review badge (`#reviews`) keeps the product | S | D P |
| Unknown product → "not found" + way back | J, S | D P |
| Cart: add 3 kinds, tally ₹12,429, remove → undo | S | D P |
| Cart: drawer by keyboard, focus in and back | J | D |
| Cart: two tabs stay in step | J | D P |
| Cart: storage blocked (private mode) still works | J | D P |
| Cart: tampered storage cleaned (qty clamp, junk dropped) | J, U | D P |
| Cart rules: kinds, totals, ranges, order text | U `cart.test` | — |
| Enquiry form: success / server error / offline / invalid | J (mocked; nothing sent) | D |
| Maker: recipe → review → add to cart | S | D P |
| Maker: guided search (centred, filters, keyboard Escape) | S, J; A; C (5 steps) | D P |
| Maker: map, pin card, filters, no-results | C, A (map) | D P |
| Maker: resume after reload; share link; bad link | J | D P |
| Maker: three.js or models fail → drawing fallback | J | D P |
| Maker: loads ≥1 `.glb`; 3D only on Maker | S | D P |
| Maker rules, search, data shape | U | — |
| Journal: diagrams load, one "Continue Reading", filters | S; C | D P |
| Hover + keyboard focus on every distinct control | C (full audit) | D |
| No template leaks (`[object`, `undefined`, `NaN`) on any page | S | D P T |
| No layout jump while loading (CLS < 0.1, motion on) on home, catalogue, 2 products, article | S | 412 px |
| Top bar and phone menu have no Journal; the footer does | S | D P T |
| Care rules: visit counts, prices, plan codes, kit per chamber | U `care.test` | — |
| Cart suggestions: fit, never coming soon, no duplicates, at most 2 | U `pairings.test` | — |
| Every referenced file exists (and isn't excluded from deploy) | U `check-assets` | — |

## Known gaps (not claimed as covered)
- **Real devices:** Safari/iOS, Firefox and real GPUs. All runs are Chromium; the 3D is tested on software rendering only.
- **Live services:** Web3Forms and WhatsApp aren't exercised for real (mocked by design).
- **Branded 404 page:** doesn't exist yet (site-ez9).
- **Screen-reader walk-through:** axe covers the rules, not the listening experience.
- **Load/stress and security testing:** out of scope for a static site with no backend.
