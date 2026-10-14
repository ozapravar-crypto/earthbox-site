# QA bug report

**TL;DR:** ***This QA pass found 15 defects. 11 are fixed and covered by a test or measurement. 4 are open: performance items and content/design decisions. Contrast defects (CQ-001…014, all fixed) are tracked separately in `CONTRAST.md`. "Confirmed" means reproduced by an executed test or measurement; nothing here is a guess unless marked "suspected".***

Severity: **critical** (blocks a core task) · **major** (harms many users or the business) · **minor** · **cosmetic**.

## Fixed

### QA-001 · The enquiry form stays on screen after a successful send · major · confirmed
- **Route:** any page with the email form (desktop), e.g. `/product.html#V1-PLT-005`
- **Steps:** open "Not on WhatsApp Web? Send an enquiry here" → fill name + email → Send (Web3Forms answers success).
- **Expected:** a thank-you and the form hidden. **Actual:** the thank-you appears but the form stays, so it's easy to send the same enquiry twice.
- **Evidence:** `journeys.spec` "success: thanks the visitor and hides the form" (failed before the fix).
- **Root cause:** `.enquiry-form { display: grid }` overrides the browser's `[hidden]` rule, so `form.hidden = true` did nothing. Other components had patched this one by one.
- **Fix:** `[hidden] { display: none !important }` in `reset.css`. Every element that uses `hidden` was reviewed, and all are meant to hide.
- **Re-verified:** the test passes; all 122 other tests still pass.

### QA-002 · Product page and catalogue jump while loading (layout shift) · major · confirmed
- **Routes:** `/product.html#…` (CLS **0.74**), `/products.html` (0.22). Good is < 0.1.
- **Evidence:** Lighthouse `layout-shifts`: the footer was 0.597 of it.
- **Root cause:** content is drawn by JS after load, so the footer showed in the first screen and was then pushed down.
- **Fix:** `main { min-height: 100vh }`.
- **Re-verified:** product CLS 0.74 → 0.14 (the rest is web-font swap, see QA-009); catalogue → 0; product performance 56 → 72.

### QA-003 · Header wraps and crowds on tablets (721–1,080 px) · major · confirmed
- **Steps:** open any page at 820 px wide.
- **Actual:** "Saved 0" and "Cart 0" wrap onto two lines beside the full nav; "About" runs into them.
- **Evidence:** the tablet visual baseline, plus a width sweep (wrapping at every width up to 1,024 px).
- **Root cause:** the phone menu only took over below 720 px, and the full header needs about 1,080 px.
- **Fix:** header breakpoint moved to 1,080 px (`menu.css`, `runhead.css`, `components.css`).
- **Re-verified:** `smoke` "header fits at every width" (12 widths, 360–1,920): no wrap, overlap or sideways scroll.

### QA-004 · Headings skip levels · minor · confirmed
- **Where:** the footer column titles were `h5` under `h1`/`h2`; the principles and product cards were `h4` under `h2`; catalogue categories were `h3` under `h1`; the product page's "More …" section had no heading.
- **Evidence:** Lighthouse/axe `heading-order`.
- **Fix:** footer `h2` (via `data/site.js`); principles and cards `h3`; categories `h2`; a visually hidden `h2` for "More …". The look is unchanged.
- **Re-verified:** heading-order passes on all 5 Lighthouse pages.

### QA-005 · Catalogue shows "From ₹[object Object]" · major · confirmed
- **Route:** `/products.html` and the home preview, for products with sizes (e.g. Stackable Planter).
- **Root cause:** the card read the first price entry, but for sized products that entry is a table, not a number.
- **Fix:** the lowest price across sizes and materials ("From ₹399").
- **Re-verified:** `smoke` now fails on any `[object`, `undefined` or `NaN` text on any page; it failed before the fix.

### QA-006 · Spaced-out labels are read letter by letter by screen readers · minor · confirmed
- **Where:** 9 eyebrow labels, e.g. `T h e &nbsp; J o u r n a l`.
- **Fix:** the visual text is `aria-hidden`, with a normal-word copy for screen readers beside it. The look is unchanged.
- **Re-verified:** axe and the visual suites pass.

### QA-007 · Visual-test instability (test defect, not site) · confirmed
- **Symptoms:** captures taken (a) before the page scripts ran ("Loading…", no Saved/Cart in the header), or (b) with the body text in a fallback font because a Google font file arrived late. `document.fonts.check()` reported success either way, since it's true when no face is registered at all.
- **Fix:** captures wait for the scripts' marks and for the page to stop changing for 600 ms, and require one *loaded* face of each site font. The fonts are now on the site itself (QA-009), so the test no longer depends on Google's network. Recorded so a flaky visual test is never "fixed" by loosening the threshold.

### QA-009 · Text jumps when the fonts arrive; fonts sent visitors' IPs to Google · minor · confirmed
- **Evidence:** Lighthouse put Journal article CLS at 0.19 and product at 0.14, attributed to the font files. Every page view also requested `fonts.googleapis.com`, which shares the visitor's IP with Google; that's relevant to the consent work (site-dni).
- **Fix:** the three fonts are hosted on the site (`assets/fonts/`, 10 files, ~155 KB; Latin + Latin-ext, which includes ₹; SIL OFL licence in `OFL.txt`). Rules are in `styles/fonts.css`, and the heading and body fonts are preloaded. All 29 pages were updated; nothing references Google Fonts.
- **Re-verified:** `npm test` passes, as do three back-to-back visual runs (see the run report). The Lighthouse re-measure is in `QA_RUN_REPORT.md`.

### QA-013 · Product titles jump the page on phones while they animate · major · confirmed
- **Route:** `/product.html#…` at phone width (412 px), and any `.scramble` heading near the edge of a line.
- **Evidence:** Lighthouse product CLS 0.28. A layout-shift recorder showed `pd-showcase` moving 48 px down and up four times in 0.3 s.
- **Root cause:** the scramble effect swaps letters for random glyphs of different widths, so the title wraps to a second line and back mid-animation.
- **Fix:** `scramble.js` holds the heading's height until the animation ends.
- **Re-verified:** product CLS 0.28 → 0. `smoke` "no layout jump while loading" fails without the fix (0.21, 0.18) and passes with it.
- **Lesson:** the suite runs with reduced motion, which hid this. The layout-shift tests now run with motion on.

### QA-014 · Care planner: typing a pincode then tapping "Add visits to cart" did nothing · major · confirmed (caught before release)
- **Steps:** on `/care.html`, choose visits, type a pincode, then click "Add visits to cart".
- **Root cause:** leaving the pincode field fired a "change" event that redrew the result panel, so the button was replaced between press and release and no click happened.
- **Fix:** the change handler ignores the text fields, which already update as you type (`care-page.js`).
- **Re-verified:** journeys "visits for my own plants" fails without the fix and passes with it.

### QA-015 · Footer icons rendered 1440 px wide on the new privacy page · major · confirmed (live ~1 h)
- **Root cause:** the shared footer CSS lives in `home.css`, and `privacy.html` didn't load it. Found by the iconography audit (P0).
- **Fix:** hotfix `4e1fc9c`, plus `care.html` loads it too. The early Care links shipped in that hotfix were removed in `075b35a`.
- **Re-verified:** `smoke` "loads clean" now fails on any page whose footer icons are over 48 px (it failed on the privacy page without the fix).

## Open

### QA-008 · Homepage first paint is slow on a first visit · major · confirmed · needs a design decision
- **Evidence:** Lighthouse LCP **5.8 s** on a first visit (2.5 s on repeat visits within the session).
- **Root cause:** the intro loader plays, then the hero copy fades in 2.6 s later (`fadeInHero`). That's a deliberate motion choice (MOTION.md §4).
- **Options:**
  - (a) show the hero copy immediately and keep only the photo/loader animation;
  - (b) shorten the delay to ~0.8 s;
  - (c) keep as is.
  - Recommendation: (b).


### QA-010 · The Maker blocks the main thread on first load · major · suspected (environment-inflated)
- **Evidence:** Lighthouse TBT 11.6 s, main-thread work 21 s.
- **Caveat:** measured with software WebGL in headless Chromium, which inflates this heavily. Not yet measured on a real GPU or phone.
- **Likely cause:** all plant thumbnails and recipe stills are rendered on load.
- **Fix proposal:** render thumbnails on demand (when scrolled into view) and spread the work across idle time.

### QA-011 · Catalogue sends oversized images to phones · minor · confirmed
- **Evidence:** Lighthouse "properly size images", about 480 KB to save on `/products.html`.
- **Fix proposal:** correct the `sizes` attribute for the card grid at phone widths.

### QA-012 · Missing Bird Feeder photo; no branded 404 · minor · confirmed · already tracked
- **Bird Feeder:** the photo is missing (404 in the console, best-practices 96), tracked as site-tue and waiting on the client.
- **404 page:** there's no branded page, tracked as site-ez9.

### QA-013 · 404 page unstyled below the top level · minor · fixed 13 Oct 2026
- **Evidence:** `/blog/typo` or `/product/NOPE` served `404.html`, whose relative `styles/…` paths resolved inside the missing folder.
- **Fix:** the 404 uses site-absolute paths; `includes.mjs` stamps it with prefix `/`. Guarded by the smoke test "product pages are readable without JavaScript".

### QA-014 · Cart thumbnails broken on Journal pages · minor · fixed 13 Oct 2026
- **Evidence:** cart lines built `assets/…` relative paths, which point to `/blog/assets/…` inside `/blog/`.
- **Fix:** product photo paths are site-absolute (`photoPath`, `cart.js`).

### QA-015 · Box share description joined with commas · minor · fixed 13 Oct 2026
- **Evidence:** an Elemental Box's description is a list of paragraphs, so `.slice(0, 160)` set the meta description to an array.
- **Fix:** the shared `scripts/product-meta.js` joins it, for both the page and the build.

### QA-016 · Cart thumbnails broken everywhere · major · fixed 14 Oct 2026
- **Evidence:** the owner's screenshot showed a broken image on a cart line. Since PR #17 (13 Oct), photo paths start with "/", and the drawer still prefixed its own "/", so `src="//assets/…"` pointed at a host named "assets".
- **Why tests missed it:** the Maker thumbnail check matched only the end of the src.
- **Fix:** the drawer uses the path as given (`scripts/cart.js`).
- **Guard:** a new journey test, "cart thumbnails load", checks that the src starts with `/assets/` and that the image actually loaded. It fails without the fix. The Maker check is now anchored to the start of the src.
