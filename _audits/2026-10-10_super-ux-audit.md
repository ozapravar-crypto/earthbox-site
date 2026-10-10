# UX audit · 10 Oct 2026 (super-ux method)

**TL;DR:** ***A sitewide pass using the `super-ux` ux-audit method found 15 issues; 9 are fixed (7 in this commit, 2 in the cart commit). The worst was live: every diagram in the Journal (36 images) and the logo/favicon on all 23 articles were broken. What's left is mostly decisions and assets for Aayush: the "By enquiry only" wording, a Bird Feeder photo, plant prices, and whether "Coming soon" chambers can go in the cart.***

| | |
|---|---|
| Scope | Whole site: home, catalogue, product (priced / enquiry / chamber / vivarium / not found), Maker, cart drawer, Journal list + article, About, unknown URL |
| Depth | standard + heuristic pass (PRN-01..24) + state-stress on the cart |
| Method | super-ux `ux-audit`, **backwards mode** (no `docs/ux` scenario base exists, so scenarios were inferred from the code). Runtime evidence: Playwright at 1440 and 375 px, light + dark: console errors, failed requests, overflow, tap targets, unnamed controls, broken images, screenshots |
| Base SHA | `9a3ec6f` |
| Skipped from the skill | The docs chain (vision/foundation/flows files), linters, paywall/subscription/app-store practice sets. They don't apply to a small static shop |

## Summary

**Scenarios: 7 PASS · 1 PARTIAL · 0 FAIL (after fixes) · 2 BLOCKED**

Top issues: broken Journal images (fixed), stale "write in on WhatsApp" copy that contradicts the new cart (partly fixed, the rest needs a call), no undo in the cart (fixed).

## Scenarios (inferred)

| ID | Scenario | Verdict | Evidence |
|---|---|---|---|
| SCN-001 | Catalogue → priced piece → pick size + material → add to cart → total is right | PASS | observed: `cart.cjs` run, 2 × ₹799 → ₹1,598 |
| SCN-002 | Enquiry-priced piece / chamber → cart shows "On enquiry" and the guide range | PASS | observed: same run; `cart.test.mjs` |
| SCN-003 | Maker design → Add to cart → parts listed with a build estimate | PASS | observed: same run |
| SCN-004 | Save for later / move back / remove → Undo | PASS | observed: `undo.cjs` (focus lands on Undo) |
| SCN-005 | Send order (WhatsApp) → confirmation → clear cart | PASS | observed: `undo.cjs`. Email route: BLOCKED (submitting would email the studio) |
| SCN-006 | Read a Journal article with diagrams | PASS *(was FAIL)* | observed: 36 `src="assets/blog/…"` resolved under `/blog/` → 404 on live; now root-absolute |
| SCN-007 | Keyboard user skips the header on a product page | PASS *(was FAIL)* | observed: skip link focuses the product and keeps the `#SKU` |
| SCN-008 | Old/mistyped product link | PASS | "Piece not found" + Back to the catalogue |
| SCN-009 | Unknown URL | PARTIAL | Vercel default 404, no route back into the site |
| SCN-010 | Screen-reader walk of cart + Maker | BLOCKED | no screen-reader run this pass |

## Findings register

| ID | Sev | Principle | Issue → fix | Status |
|---|---|---|---|---|
| AUD-2026-10-10-01 | major | PRN-01 | All 36 Journal diagrams 404 on live (relative `assets/blog/` inside `/blog/`) → root-absolute paths in `blog/*.html` + `data/article-bodies` | **fixed** |
| AUD-2026-10-10-02 | major | PRN-04 | `assets/logo.png` doesn't exist: favicon, footer logo and JSON-LD publisher logo on 23 articles → `logo.webp` (also in `prerender.mjs`, `render-article.js`) | **fixed** |
| AUD-2026-10-10-03 | major | PRN-23 | Catalogue intro says "By enquiry only. Write in on WhatsApp.", which contradicts the cart → rewritten | **fixed** |
| AUD-2026-10-10-04 | major | PRN-03 | Cart Remove had no way back → Undo after remove / move / clear | **fixed** |
| AUD-2026-10-10-05 | minor | PRN-16 | Nothing happened after "Send order" → confirmation + "Clear cart" (WhatsApp and email) | **fixed** |
| AUD-2026-10-10-06 | minor | BP-136 | `product.html` had no skip link (hash routing would break a plain one) → skip link with a focus handler | **fixed** |
| AUD-2026-10-10-07 | minor | PRN-15 | Catalogue volume tabs 25×14 px, search 14×30 px on phones → 44 px targets | **fixed** |
| AUD-2026-10-10-08 | minor | PRN-01 | Product page stacked a duplicate mobile CTA on every in-page product switch | **fixed** (9a3ec6f) |
| AUD-2026-10-10-09 | minor | PRN-04 | Maker missing from the mobile menu; menu links broke under `/blog/` | **fixed** (9a3ec6f) |
| AUD-2026-10-10-11 | major | PRN-23 | Footer "By enquiry only" on ~30 pages + home/catalogue meta descriptions. It is still *true* (the studio confirms every order), but it reads as "no cart" | open: wording is Aayush's call |
| AUD-2026-10-10-12 | major | — | Bird Feeder has no photo file at all (`assets/v1/bird-feeder*.webp`) | open: asset request |
| AUD-2026-10-10-13 | major | PRN-06 | 0 of 45 plants and no foundation priced: build estimates are the chamber range only | open: data from Aayush |
| AUD-2026-10-10-14 | minor | PRN-05 | Elemental chambers are "Coming soon" but can be added to the cart (labelled "Coming soon" on the line) | open: allow (pre-order) or block? |
| AUD-2026-10-10-15 | minor | — | Unknown URLs get Vercel's default 404 with no way back | open |
| AUD-2026-10-10-16 | minor | state-stress | Cart lives in the browser: private mode keeps it for one page, silently. Drawer status is re-rendered, so some screen readers may miss it | accepted for now |

Priority (frequency × severity × solvability): 11 → 12 → 14 → 15.

## Scope and limits

- **Covered:** every page type at 1440 + 375, light + dark for the cart; failed requests; tap targets; heading/landmark/skip-link presence; cart state stress (first-use, cleared, undo, two tabs, untrusted storage, double add).
- **Not covered:** measured colour contrast, 200 % zoom, a real screen-reader walk, Lighthouse/page weight, the email form's live submit.
- **Open questions for Aayush:** see 11–14.

**Verdict:** REFINE. The structure is sound; the gaps are content, assets and a few honest-copy calls.
