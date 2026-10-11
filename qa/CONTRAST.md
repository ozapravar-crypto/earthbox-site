# Colour contrast QA

**TL;DR:** ***Contrast is checked by measurement, never by eye. `npm run qa:contrast` walks every page × light/dark × desktop/phone × interactive state. It measures every visible piece of text, placeholder, icon-only control and focus ring, and fails CI on any confirmed failure. Every defect it has found has a permanent test in `tests/contrast.spec.mjs`.***

## Why this exists
Two contrast defects shipped and a later visual pass missed them: `--accent` text at 2.14:1, and `--accent-text` on the tint at 4.46:1. The first full run of this audit then found the homepage hero's darkening scrim had been painting *under* the photo since the hero was built, which a human screenshot review had also passed. Hence the rules: no visual sign-off, no single axe scan, no Lighthouse score as evidence.

## What runs, where

| Layer | Command | When | Catches |
|---|---|---|---|
| Token pairs | `node scripts/check-contrast.mjs` | every `npm test` (deploy gate) | a token edit that breaks text/background pairs, light + dark, **under the paper grain** |
| Regression tests | `npx playwright test tests/contrast.spec.mjs` | CI on every push | each past defect (CQ-001…006) coming back |
| Full audit | `npm run qa:contrast` (`:quick` = default states only) | CI on every push (artifact: `contrast-report`) | anything new, anywhere |

## How the audit measures (`qa/contrast/`)
1. **`scan.js` (runs in the page).** For every visible element that owns text, plus placeholders, icon-only controls (3:1) and the focused element's outline (3:1), it computes the drawn colour and the backdrop from computed styles:
   - alpha, stacked translucent backgrounds, and ancestor opacity
   - the site-wide paper grain (≈1.7 % multiply), which decides borderline pairs: it alone made the "Coming soon" badge fail
   - large text (≥24 px, or ≥18.66 px bold) uses 3:1; disabled controls are reported as `exempt-disabled` (WCAG 1.4.3)
2. **Anything CSS can't settle** is marked `review` with the reason, then measured against real pixels by **`measure.mjs`**:
   - the reasons: a photo, canvas or video behind the element, a gradient, a blend mode, an overlapping box, opacity on the background, a decorative pseudo-element overlay
   - it takes the screenshot twice, with and without the ink; the pixels that differ are the glyphs
   - contrast is computed against the backdrop **under the glyphs only**, and the worst 10 % decides (so a bright patch under part of a word fails it)
   - the header's `mix-blend-mode: difference` is modelled per pixel
3. **axe-core** (`color-contrast`) runs on every state. Each violation and each "incomplete" is linked to a measured element and reconciled in the report:
   - `confirmed`
   - `settled by measurement`
   - `DISAGREE` (needs review)
   - `axe-only violation` (counted as a failure)
4. **States:**
   - default and scrolled header on every route
   - every Maker step, including all five guided-search steps, the map and pin card, filters, and the no-results state
   - catalogue search (with results and empty) and volume tabs
   - product variant and material selection, Save pressed
   - enquiry form open, error (Web3Forms returning 500) and success (both mocked; no email is sent)
   - cart drawer with all three kinds of line, the Undo notice, the Saved tab and the empty cart
   - Journal filter
   - the mobile menu
   - **hover and focus** on one of each distinct interactive element
   - all of the above in light and dark, at 1440×900 and 390×844

   The 22 further articles share one template, so they get default states only. The first article gets the full set.

## Report
`qa/reports/contrast-report.md` (readable) and `contrast-summary.json` (machine-readable) are committed. Each finding has: route, theme, viewport, state, selector, text, foreground, background (or the measured range under the glyphs), ratio, required threshold, status, method (`css` or `pixels`) and flags. The full per-element JSON (`contrast-report.json`, several MB) is a CI artifact only. **Coverage is listed explicitly.** Any route or state that couldn't be scanned appears under "Not scanned" with the error, and is never counted as passing.

## Accepting a finding (rare)
Add `{ "key": "<route> | <theme> | <viewport> | <state> | <selector>", "reason": "…", "verifiedBy": "…", "date": "…" }` to `qa/contrast/baseline.json`. The reason must say why it is not a WCAG failure (e.g. the element is disabled, or is a logotype). "Looks fine" is not a reason. The baseline is empty today.

## Known limits (stated, not hidden)
- **Large-text test:** CSS pixel size and weight only. Font metrics aren't considered.
- **Gradient text** (`background-clip:text`) isn't used on the site, so it isn't modelled.
- **Blend modes other than `normal` and `difference`** stay `review`, with a note.
- **Hover/focus** cover one element of each look, not every instance.
- **The home film** isn't loaded during the audit. No text sits over it (`index.html #film`), and streaming it crashed runs on a memory-starved machine.
- **The 3D Maker canvas** is drawn by WebGL. Text over it (the caption) is measured from pixels like any image.

## Defects found and fixed (10 Oct 2026)

| ID | Where | Was | Root cause | Fix |
|---|---|---|---|---|
| CQ-001 | Homepage hero text + header over the photo | 1.1–4.4:1 | The scrim (`.hero::before`, z −1) painted under the photo (`.hero-bg`, also z −1, later in the page) | Photo z −2; each text group gets a flat scrim band; strengths set by measurement at 1280–1920 px + phone |
| CQ-002 | Floating WhatsApp icon | 1.98:1 (needs 3) | White on brand green #25D366 | WhatsApp dark green #128C7E (4.1:1) |
| CQ-003 | Manifesto closing line | 4.27 light / 4.23 dark | 55 % / 60 % opacity text on a lit band | 70 % / 75 % |
| CQ-004 | "Coming soon" badge | 4.42 | `--accent-text` on `--bg-tint`, darkened by the paper grain | Paper (`--bg`) badge background; grain added to the token check |
| CQ-005 | Accent text (earlier, 10 Oct Phase 3) | 2.14 / 4.46 | `--accent` used for text | `--accent-text` (#736759) |
| CQ-006 | Product breadcrumb "›" | 1.25:1 | Separator set in `--rule` (12 % ink) | `--mute` |
| CQ-007 | Keyboard focus rings sitewide | 1.9–2.2:1 (needs 3); 1:1 on the manifesto band | Global `:focus-visible` used `--accent`; on the band, `currentColor` was ink on ink | `currentColor` (already ≥ 4.5:1 on its own background); on the manifesto band, `--bg` |
| CQ-008 | Maker search + note placeholders | 3.74:1 | Browser default placeholder colour | `::placeholder { color: var(--mute) }` |
| CQ-009 | Maker map: empty regions; "your chamber" plate in dark mode | 2.07–2.91; 1.72–2.47 | Opacity .5 on empty regions; the plate stays light but its contents used dark-mode tokens | Muted colour instead of opacity; light-theme tokens scoped to the plate |
| CQ-010 | Manifesto highlighted words, dark mode | 1.57:1 | `--accent` on the band that turns light in dark mode | #736759 in dark mode |
| CQ-011 | Product "Coming soon" label; footer link hover | 3.10:1 | `--accent-dk` | `--accent-text`; hover → `--ink` |
| CQ-004b | Coming-soon catalogue cards | 3.88:1 | The whole card was at opacity .85, fading its text (axe caught it; the first pixel model ignored ancestor opacity) | Fade only the photo |

### What the first full run taught the audit (fixed in the tool, not hidden)
- **Covered elements:** text under an overlay (e.g. behind the catalogue search panel) was measured against the dimmed backdrop. It's now reported as `covered`, not measured.
- **A control's own hover fill:** the `.cta` sweep (`::before`) was ignored, giving false 1:1 hover failures. It's now sent to pixel measurement.
- **Ancestor opacity:** opacity on the box that owns the background fades the text too. Ink is now modelled as P + op·(ink − bg).
- **Unisolated glyphs:** if the glyphs can't be isolated (very small text), the whole-box fallback is now `review`, never a confirmed fail.
- **Focus rings** are measured from pixels around the focused control (ring on vs off), against whatever is behind them, including the hero photo.
- **Ids:** these continue across every scan of a page; a reused id had made one test measure the wrong element.
- **Off-screen focus-only controls** (the skip link) get a focus check, not a hover check.
| CQ-012 | Secondary buttons (Save, outlined CTAs) on hover | 1.0:1, label invisible | `.cta:hover` sets text to `--cta-hover-color` (= `--bg`) expecting the ink fill sweep, but secondary buttons have no sweep | `.cta-secondary { --cta-hover-color: var(--ink) }` |
| CQ-013 | Focus rings on the WhatsApp button, selected material chip, header theme toggle | 1.07 / 1.10 / 1.56:1 | `currentColor` rings fail on filled controls with light text | Ink rings sitewide; `--bg` on the manifesto band; header rings use its own light text colour (ink once scrolled) |

**Second full run (CI, 10 Oct 16:37):** 441 → 40 failures, 0 axe violations. Of the 40, two groups were real (CQ-012, CQ-013). The rest were audit artefacts, now fixed:
- **Hover lost during measurement:** scrolling moved the control off the pointer. The batch now measures in place when the items are already on screen.
- **The WhatsApp button inside a batch shot:** it's now hidden in batch shots too.
- **Three pages that timed out on a cold runner:** they now get one retry.
| CQ-014 | "Build your little world" button focus ring, dark mode | 1.05:1 | The section keeps light paper in dark mode, where `--ink` is light | `--ink` set to the section's own ink (`--mi-ink`) |
| CQ-015 | Cookie banner (new) | passes | Checked on arrival, both themes, default + hover | Regression test only |
| CQ-016 | Care page, cart suggestions, "Keep it thriving" (new) | passes | Checked on arrival, both themes | Regression test only |
| CQ-017 | Catalogue search: hovered or tapped result "View →", phone, light | 2.84:1 | `--accent-dk` on the hovered row tint | `--accent-text` (found by full audit, CI 38165283336) |

**Third full run (CI, 10 Oct 17:16):** 1 failure (CQ-014, fixed above), 11 review, 0 axe violations, every state scanned. All 11 review items were audit artefacts: the scanner treated the button's hover fill layer as visible when it was hidden (`display:none` on secondary buttons) or parked outside the box. It now counts the fill only when it's actually showing.

**Fourth full run (CI, 10 Oct 17:47):** 20 failures, 1 review, 0 unresolved axe findings. All traced to the audit, not the site:
- **Hover fills:** the "no animations" rule (`*`) didn't reach `::before`, so `.cta` fill sweeps were caught mid-slide. Now `*, *::before, *::after`.
- **Batch shots:** a sticky panel (the Maker preview on phones) could sit over an item scrolled under it. Batch now checks each item is topmost at its spot, otherwise it's measured singly.
- **Batch failures:** any FAIL from a batch shot is re-measured with a per-element shot before it counts.

Found on the way (not contrast): the catalogue showed **"From ₹[object Object]"** for products with sizes. Fixed in `render-products.js`; `tests/smoke.spec.mjs` now fails on any `[object`, `undefined` or `NaN` text on a page.

**Fifth run (CI, 10 Oct 18:21):** 6 failures, all audit artefacts (the per-element shot scrolled hovered buttons out from under the pointer). The hover is now held across the scroll.

## Current status (CI run 38075663247, 10 Oct 2026 18:51)
- **0 failures · 0 needing review · 0 unresolved axe findings · 0 states not scanned**
- 23,340 measurements passed across 808 states (34 pages × light/dark × desktop/phone × interactive states)
- 1,167 items were behind an open overlay, reported as `covered`; 10 disabled controls are exempt
- Report: `qa/reports/contrast-report.md` and `contrast-summary.json`. The full per-element JSON is the CI artifact.
