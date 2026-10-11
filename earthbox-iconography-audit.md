# EarthBox: iconography, UI simplification and information hierarchy audit

*Phase 1: audit only. No site files were changed. Audited 11 Oct 2026 against the working tree, which another agent was editing at the same time, so line numbers may drift.*

***TL;DR: The site has no icon system. It has about 12 hand-drawn inline SVG shapes copied 60+ times, using 6 stroke weights (1.1 / 1.2 / 1.4 / 1.5 / 2 / filled) and 9 sizes, plus about 10 text characters used as icons (× ESC − + ✓ ← → › ★). Three problems should be fixed before any visual polish: (1) the footer social icons render at 1440 px wide on `privacy.html`, because footer CSS lives in `home.css`; (2) on the product page, a screen reader cannot tell which size or material is selected, even though the price depends on it; (3) Save, Maker "Add/Added ✓" and the theme switch change their accessible name and also their pressed state, so the state is announced twice, and the Maker button's spoken name ("Remove Pillow Moss") does not match its visible text ("Added ✓"). The proposed fix is a small vendored Lucide subset (about 22 icons) kept in one `data/icons.js` registry and stamped like the header and footer, at a 1.5 stroke, plus the site's own long arrow kept as a named brand glyph. Most labels should stay as text. Icons belong on close, search, menu, save and cart, and on the trust and care facts.***

---

## 1 · Executive summary

**What's working (keep it)**
- Most actions are already **text-led**. Add to cart, Send order on WhatsApp, Start creating, Guided search, Save for later and Remove are clear words, not icons. That's correct for consequential commercial actions (Carbon: danger and consequential actions need visible labels).
- Most icon-only controls already have accessible names: hamburger "Open menu", search "Search catalogue", the closes, floating WhatsApp, the social links, and Maker chip removal.
- Botanical art (`mi-leaves`, the cursor sprig, Maker chamber line drawings, plant glyph thumbnails, substrate swatches) is bespoke and sits apart from function. **Keep it as it is**, and never swap it for generic icons.

**What's wrong**
| # | Problem | Observed or hypothesis | Priority |
|---|---|---|---|
| 1 | `privacy.html` footer: Instagram and LinkedIn SVGs render full-width (1440 px). `.colo-social` styles live only in `styles/home.css`, which privacy.html doesn't load, and the SVGs carry no `width`/`height` attributes to fall back on | Observed (screenshot `shots/d-privacy_html-bottom.png`) | **P0** |
| 2 | PDP size/variant and material selectors: the selected state is only a CSS class (`.active`), there's no `aria-pressed`/`aria-checked`, and the `<label>` isn't associated with anything | Observed (`scripts/render-product-detail.js:216-242`) | **P0** |
| 3 | Toggle controls change their name *and* their state: Save → "Saved" + `aria-pressed`; Maker "Add/Added ✓" with aria-label "Add/Remove X" + `aria-pressed`; theme `role=switch` aria-label flips "Switch to dark/light mode" + `aria-checked` | Observed (`cart.js:269`, `maker.js:325-327`, `theme.js:54-56`) | **P1** |
| 4 | Close and remove use four renderings: serif "×" in three font sizes, the text "ESC", and the browser's native blue search-clear "×" | Observed | P1 (ESC on mobile) / P2 |
| 5 | Same meaning, different icon: delivery is a **house** on the home page and a **truck** on the PDP; "made to order" clocks use stroke 1.1 vs 1.2 and 15 vs 16 px | Observed | P2 |
| 6 | Home "Five Quiet Commitments" glyphs hard-code `stroke="#2C2C2B"`, so they're near-invisible in dark mode | Observed (`shots/m-principles-dark.png`) | P1 |
| 7 | Star ratings are SVG-only with no text alternative per review; the done state of Maker steps is shown by colour only | Observed | P1 |
| 8 | Header shows "SAVED 0 · CART 0" permanently as spaced uppercase text. That's noisy at zero, and on phones it competes with the wordmark | Hypothesis (no user data) | P2 |

**Counts:** 5 × P0/P0-adjacent a11y and functional items, 11 × P1, 22 × P2 (full list in §9).

**Recommended icon approach:** a vendored Lucide subset (ISC licence, `lucide-static@0.460.0`, every name below verified to exist) as inline SVG strings in **`data/icons.js`**. It's stamped into static HTML by `scripts/includes.mjs` (the same path the header and footer already use) and imported by the JS renderers. No npm runtime dependency, no sprite request, no build step beyond the one that already exists. Stroke **1.5** (Lucide's default of 2 is too heavy for this fine-rule brand; check 1.25 against 1.5 on screen first). Every SVG gets `width`/`height` attributes so a missing stylesheet can never blow it up again (problem 1).

---

## 2 · Route and component inventory

| Route | Rendered by | States captured (desktop 1440 × 900 + phone 390 × 844) |
|---|---|---|
| `index.html` | static + `main.js` | top, bottom, mobile menu, principles in dark mode |
| `products.html` | `render-products.js`, `catalogue.js` | top, bottom, search overlay with query "pla" |
| `product.html#<SKU>` | `render-product-detail.js` | V1 printed (`V1-PLT-*` Stackable Planter) top/mid, enquiry form open, V2 box (`#MossBox`), not-found (`#NOPE`) |
| `maker.html` | `maker.js`, `plant-search.js`, `maker-3d.js` | start, recipe loaded, chamber, foundation, plants, your space, review, guided-search dialog |
| `blog.html`, `blog/*.html` (23) | `prerender.mjs` | index top/bottom, `terrarium-soil-guide` top/bottom |
| `about.html` | `render-about.js` | top/bottom |
| `privacy.html` (draft, untracked) | static | top/bottom |
| Cart / Saved drawer | `cart.js` `<dialog>` | cart with 1 item, Saved tab (empty) |
| Header / footer / phone menu / theme | `data/site.js`, `menu.js`, `theme.js` | all pages |

Screenshots are in `/tmp/claude-1000/-mnt-c-Users-Admin/9ffeaaab-0391-4235-976c-04ccce04c2ee/scratchpad/icon-audit/shots/` (63 PNGs + `facts.json`, which holds icon-only controls, sub-24 px targets and SVGs without `aria-hidden`, per page and state).

**Not verified**
- Real screen-reader output (NVDA/VoiceOver). The a11y findings come from the DOM and ARIA, not from listening.
- Dark mode on every page (only the principles section was checked).
- V3 vivarium PDP, the Maker map view with a pin open, the enquiry form's error and success states, and the cart after "Send".
- Tablet widths (768–1079 px, where the phone menu is active).
- NN/g articles: `www.nngroup.com` failed DNS from this machine. Those citations come from the published guidance as I know it and are marked *(not re-fetched)*.
- Care section UI: it isn't built (`CARE-PLAN.md`), though `data/care.js`, `scripts/care.js` and `scripts/pairings.js` now exist.

---

## 3 · Current icon library and design-system assessment

**Library:** none. There's no package and no sprite. Every icon is an inline `<svg>` literal. The social icons are Feather/Lucide paths (24 viewBox, stroke 2); everything else is hand-drawn.

### 3.1 Inventory of functional icon shapes

| Shape | Where (file:line) | Copies | viewBox / stroke / size | `aria-hidden`? | Notes |
|---|---|---|---|---|---|
| Long arrow → (brand) | `index.html:170,186,309,344,383`, `product.html:93`, `maker.html:90,94`, `cart.js:186`, `maker.js:231`, `render-product-detail.js:67,112,504,518`, `render-products.js:205` | ~25 rendered, **4 separate JS string constants** | 16×8 / 1.2 / 16×8, 12×6, 18×9 | Mixed: about half are missing it (`index.html:309,383`, `render-product-detail.js:112,504,518`, `product.html:93`) | A real brand signature. Keep, but make it one source |
| Instagram, LinkedIn | `data/site.js:46-48` → every page's footer | 26 pages | 24 / **2** / 16 | **No** (the link has an aria-label, so it's harmless but inconsistent) | The only Lucide-weight icons on the site. Lucide is deprecating brand icons, so keep these paths as they are |
| WhatsApp (filled brand) | `index.html:488`, `products.html:252`, `blog.html:167`, `about.html:253`, `privacy.html:152` | 5 | 24 / fill / 28 → 24 | No | Absent on product, maker and the articles. That looks deliberate (those pages have their own WhatsApp CTAs); confirm |
| Search magnifier | `products.html:111,125` | 2 | 20 / 1.5 / 14 | Yes | |
| Sprout / clock / house (hero proof) | `index.html:178-180` | 3 | 16 / **1.1** / 15 | Yes | House = "Delivered" |
| Clock / truck (PDP trust) | `render-product-detail.js:303,313` | 2 | 16 / **1.2** / 16 | **No** | Truck = "Delivery" → clashes with the house |
| Star (filled) | `render-product-detail.js:90,126,154,308` | 4 templates | 12 / fill / 10–14 | **No**, and no text alternative | Plus the text "★ 4.8" at `index.html:203` |
| Check (verified purchase) | `render-product-detail.js:145` | 1 | 12 / 1.5 | No | |
| Sun / moon (theme) | `theme.js:60-66` | 2 per toggle | 16 / fill / 12 | No (inside a named switch) | |
| Principle glyphs | `index.html:244-284` | 5 | 28 / 1.4 / **hard-coded `#2C2C2B`** | **No** | Decorative. Broken in dark mode |

### 3.2 Text characters used as icons

| Glyph | Where | Meaning |
|---|---|---|
| `×` | `menu.js:44` (serif 2 rem), `cart.js:251` (1.5 rem), `maker.js:476` (1.4 rem), `maker.js:395,435,526` (chips / tray / review) | close **and** remove |
| `ESC` | `products.html:135` | close search |
| browser's native blue `×` | `input[type=search]` in `products.html:130` | clear query (shows next to ESC; off-brand blue) |
| `−` `+` | `cart.js:199-201` | quantity |
| `✓` | `maker.js:249` (Review step), `maker.js:327` ("Added ✓") | "review" **and** "added": two meanings |
| `←` | `render-product-detail.js:428,489`, 23 × `blog/*.html:78` | back |
| `→` | `render-products.js:175` "View details →", `catalogue.js:132` "View →", `render-product-detail.js:450` "&rarr;" | go to. Three text arrows next to the SVG arrow |
| `›` | breadcrumb `render-product-detail.js:214-223` | separator (read aloud) |
| `★` | `index.html:203` | rating |
| `M` / `E` | `cart.js:196` | cart thumbnail fallback (custom / enquiry) |
| native `▸` | `<details>` "Details", "Filter & sort", "Not on WhatsApp Web?" | disclosure |

### 3.3 Botanical illustration (not functional icons; keep them separate)

`index.html:322` `mi-leaves`, `scripts/cursor.js:13` sprig cursor, `maker.js:178` chamber drawing (`role="img"` with a label, which is correct), `maker.js:195` plant glyph thumbnails, `maker.js:284` substrate swatches, `assets/boxes/*.svg` chamber line art. These carry the brand's archival voice. **Rule: never replace them with Lucide**, and never use Lucide's `leaf` or `sprout` where a botanical drawing already tells the story.

### 3.4 System-level verdict
- **Stroke weights:** 6 in use. **Sizes:** 9 in use (10, 12, 14, 15, 16, 18, 24, 28, full-width). **Filled vs outline:** mixed with no rule (stars, sun/moon and WhatsApp are filled; everything else is outline).
- **Sizing depends on CSS alone.** No functional SVG carries `width`/`height`, so any page missing one stylesheet breaks (problem 1).
- **No single source:** the arrow is copied 4× in JS and many times in HTML, so the next change will drift.

---

## 4 · Site-wide inconsistencies and repeated patterns

| ID | Pattern | Observed | Recommendation |
|---|---|---|---|
| X1 | Close and remove drawn 5 ways (§3.2) | Yes | One `x` icon, 20 px, in a 44 px target, everywhere (A). "ESC" goes; the Esc key still works |
| X2 | Same concept, two icons: delivery = house (home) vs truck (PDP) | Yes | `truck` in both places |
| X3 | Same glyph, two meanings: `✓` = "Review step" and "added" | Yes | Review step → "05 Review"; done steps get `check` in place of their number |
| X4 | Back is shown 3 ways: "← Catalogue" (V2/V3 PDP), a breadcrumb (V1 PDP), "← Back to Journal" (articles); the not-found page "Back to the catalogue" uses a **forward** arrow | Yes | Breadcrumb on every PDP; `arrow-left` + text for back links; drop the → on the not-found page |
| X5 | Count formats: header "Cart 0", drawer tab "Cart (1)" | Yes | One format: "Cart 2" with a count badge, hidden at 0 |
| X6 | Toggle buttons change name and state together (Save, Add, theme) | Yes | Stable name + state attribute only (APG names and descriptions) |
| X7 | `target="_blank"` WhatsApp, Google-review and social links give no cue that they open elsewhere | Yes | `arrow-up-right` 12 px after the text, plus sr-only " (opens WhatsApp)" |
| X8 | Text arrows `→` next to SVG arrows | Yes | Use only the brand arrow; drop text arrows |
| X9 | Icon SVGs inconsistently get `aria-hidden` (25 visible SVGs without it, per `facts.json`) | Yes | Registry emits `aria-hidden="true" focusable="false"` by default (Lucide a11y doc) |
| X10 | Uppercase, tracked, 0.6 rem caption text used as a link/button label (e.g. "OR ASK ON WHATSAPP", "LEAVE A REVIEW ON GOOGLE", "NOT ON WHATSAPP WEB?…") gives 15–16 px tall targets | Yes (`facts.json`) | Pad link targets to ≥ 24 px tall (WCAG 2.5.8), ideally 44 px on touch |

---

## 5 · Page-by-page recommendations

Column key: **Rec** = A icon only · B icon + label · C text only · D simplify/remove · E progressive disclosure. **O/H** = observed / hypothesis. **P** = priority. **Conf** = confidence.

### 5.1 Shared chrome: header, phone menu, footer, floating WhatsApp, theme

| ID | Location | Current | User purpose | Problem (O/H) | Rec | Rationale | Lucide icon | Responsive | A11y | P | Scope | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | Footer social, `privacy.html` | Inline SVG with no size attrs; `.colo-social` CSS only in `home.css` | Find social profiles | Icons render 1440 px wide; page looks broken (O) | — (fix) | Footer is a shared component, so its CSS must be shared | — | both | — | **P0** | shared | high |
| S2 | Header Saved/Cart `cart.js:305-306` | Text "SAVED 0" "CART 0" | See and open the selection | Always shows zeros, which adds noise; two tracked-caps labels compete with the nav (H) | **B** on ≥1080 (icon + "Saved"/"Cart" + count when >0); **A** below 1080 (icon + count badge) | User's hierarchy: bag with count; heart for save. Icons are universal here (NN/g: cart, search, close and menu are among the few recognisable icons *(not re-fetched)*) | `heart`, `shopping-bag` | desktop B / phone A | Name "Cart, 2 items" / "Saved, 1 item"; `aria-live` on the count; 44 × 44 (already 44 tall) | P2 | shared | med |
| S3 | Hamburger `menu.js:22-28` | Three `<span>` bars, 44 × 44 | Open nav | None. Works and is named "Open menu" (O) | A | Universal | `menu` (optional; the spans are fine) | <1080 | Move focus to the first link on open (none today, H) | P2 | shared | high |
| S4 | Phone menu close `menu.js:44` | Serif "×" at 2 rem | Close menu | Glyph rendering differs from the other closes (O) | A | X1 | `x` | phone | Keep "Close menu" | P2 | shared | high |
| S5 | Theme switch `theme.js:50-66` | `role=switch`, aria-label flips "Switch to dark/light mode", `aria-checked` | Change theme | Name and state both change, so it's announced as "Switch to light mode, on" (O) | A | APG: the name says *what*, the state says *on/off* | `sun`/`moon` (decorative) | both | Stable name "Dark mode"; `aria-hidden` on the SVGs | **P1** | shared | high |
| S6 | Footer social links | Icon-only, 32 × 32 circle | Visit profiles | Target 32 px (passes 24 px AA, under 44 px); opens a new tab silently (O) | A | Brand marks, so icon-only is fine | keep current paths | both | `aria-label="Instagram (opens in new tab)"`; `aria-hidden` SVG | P2 | shared | high |
| S7 | Floating WhatsApp | Filled brand mark, 56 / 50 px | Chat | Present on 5 of 8 templates; covers content corners on phone (O, `m-index` / `m-principles-dark`) | A | Recognisable brand mark | keep | phone: consider hiding while a sticky CTA is visible | Fine (aria-label) | P2 | shared | med |
| S8 | Footer "Studio / Replacement" lists | Text | Policy facts | None | C | Policy = consequential text | — | — | — | — | shared | high |

### 5.2 Home (`index.html`)

| ID | Location | Current | User purpose | Problem (O/H) | Rec | Rationale | Lucide icon | Responsive | A11y | P | Scope | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| H1 | Hero proof `:178-180` | Bespoke icons + caps text | Trust at a glance | House for delivery clashes with the PDP truck; stroke 1.1 (O) | B | Icons help scan three facts; labels carry the meaning | `sprout`, `clock`, `truck` | stacks on phone (exists) | Already `aria-hidden` and the list is named | P2 | local | high |
| H2 | Trust strip `:196-212` | "★ 4.8 / Customer rating" | Social proof | Text star is read as "black star"; it repeats the hero proof strip just above (H) | D (merge with H1) or C | Two trust rows back to back compete | `star` if kept | — | `aria-hidden` the ★ | P2 | local | med |
| H3 | Principles `:240-285` | 28 px abstract glyphs, hard-coded `#2C2C2B` | Brand values | Near-invisible in dark mode (O); hover-dims-others has no touch meaning (H) | Keep the bespoke glyphs (they're brand, not Lucide); fix colour | Abstract shapes = editorial, not function | none, don't replace | phone: no dimming | `stroke="currentColor"`, `aria-hidden` | **P1** | local | high |
| H4 | Hero CTA ring + "Or design your own →" | Brand arrow | Go explore / make | Fine (O) | C + brand arrow | — | keep `arrow-long` | — | Add `aria-hidden` to `:170`'s inner SVG (the ring already has it) | P2 | local | high |
| H5 | Manifesto CTA `:383` "Start a conversation →" | Opens WhatsApp in a new tab | Contact | Forward arrow implies an in-site step (H) | C + `arrow-up-right` | X7 | `arrow-up-right` | — | sr-only "(opens WhatsApp)" | P2 | local | med |

### 5.3 Catalogue (`products.html`, `render-products.js`, `catalogue.js`)

| ID | Location | Current | User purpose | Problem (O/H) | Rec | Rationale | Lucide icon | Responsive | A11y | P | Scope | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 | Volume tabs `products.html:96-109` | "I NOW / II NEXT / III HORIZON", `role=tab` | Switch volume | Panels say `aria-labelledby="tab-1..3"` but the tabs have **no ids**; no arrow-key support (O) | C | Text is the brand voice | — | — | Add `id="tab-n"`, roving tabindex + arrows (copy `cart.js` tabs) | **P1** | local | high |
| C2 | Search button `:110-116` | Magnifier + "SEARCH" (label hidden on phone) | Open search | Fine (O) | B desktop / A phone | Search is universal | `search` | as now | aria-label contains the visible word, OK | — | local | high |
| C3 | Search overlay close `:135-137` | Text "ESC", 38 × 24 | Close search | "ESC" means nothing on touch; native blue clear "×" sits beside it (O, `m-search.png`) | A | X1 | `x` (close) | both | aria-label "Close search", 44 × 44; style or suppress `::-webkit-search-cancel-button` | **P1** | local | high |
| C4 | Search result "View →" `catalogue.js:132`, card "View details  →" `render-products.js:175` | Text + text arrow | Open piece | The whole card is already the link, so this repeats it (O) | D (drop) or brand arrow only | Less noise; the card affordance is enough | `arrow-long` | — | — | P2 | local | med |
| C5 | V1 cards | Photo, name, price, "Coming soon" | Browse and compare | No Save on cards, so a shopper must open each PDP to save (H) | A (heart on image corner) | Save = universal heart (user hierarchy) | `heart` | 44 px target on phone | aria-label "Save Stackable Planter", `aria-pressed` | P2 | shared | low (needs product call) |
| C6 | Category head "01 Planters ₹399–₹4,000" | Text | Orient | Fine | C | Prices and titles stay text | — | — | — | — | local | high |

### 5.4 Product detail (`render-product-detail.js`)

| ID | Location | Current | User purpose | Problem (O/H) | Rec | Rationale | Lucide icon | Responsive | A11y | P | Scope | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Size and material selectors `:248-275` | `<label>` + buttons with `.active` | Choose a variant (sets the price) | Selected state not exposed; label not associated (O) | C | Consequential choice | none (selected = border/fill, optional `check` 12 px) | — | `role=radiogroup` + `aria-labelledby` + `role=radio aria-checked`, or `aria-pressed` | **P0** | local | high |
| P2 | Save `:72` | Text "Save" → "Saved" + `aria-pressed` | Keep for later | Double state signal (O) | B | Heart scans fast; the word stays because Save vs Add-to-cart is a commercial choice | `heart` (outline → filled when saved: the only filled exception) | both | Fixed visible "Save", state via `aria-pressed` | **P1** | shared (`cart.js:269`) | high |
| P3 | Trust row `:301-315` | Clock / star / truck + caps text, below the buy box | Lead time, rating, delivery | Purchase-critical facts sit below two WhatsApp options (H); SVGs not `aria-hidden` (O); rating link 15 px tall (O) | B | Icons aid scanning of facts | `clock`, `star`, `truck` | phone: place under the price | `aria-hidden` the SVGs; target ≥ 24 px | P2 | local | med |
| P4 | Buy block `:68-75` + `enquiryAltHTML` | Add to cart, Save, "Or ask on WhatsApp", "Not on WhatsApp Web? Send an enquiry here" | Buy or ask | Four actions in a stack, two of them WhatsApp variants (O); "WhatsApp Web" wording is odd on phones (H) | D + E | One primary (Carbon hierarchy); alternatives in one disclosure | `chevron-down` on the disclosure | both | — | P2 | shared | med |
| — | wording | "Not on WhatsApp Web?  Send an enquiry here" → **"Prefer email? Send an enquiry"**; "Or ask on WhatsApp" → **"Ask a question on WhatsApp"** | | | | | | | | | | |
| P5 | Reviews stars `:89-93` | 5 SVGs, filled by class | Read rating | No text alternative; colour/fill only (O) | B | — | `star` | — | Wrapper `role="img" aria-label="Rated 4 out of 5"`; SVGs `aria-hidden` | **P1** | local | high |
| P6 | Breadcrumb `:214-223` | "›" text separators | Wayfinding | Separators read aloud (O) | — | — | `chevron-right` 12 px or CSS | phone OK | `aria-hidden` separators; `aria-current="page"` on the last item | P2 | local | high |
| P7 | V2/V3 head `:428,489` | "← Catalogue" | Back | Different from the V1 breadcrumb (O) | B | X4 | `arrow-left` | — | — | P2 | local | high |
| P8 | Phone sticky CTA `:76-79` | "Add to cart →" | Buy without scrolling | No price or chosen variant visible (H) | C | Keep price/qty clarity | — | phone | Mirror the price: "Add to cart · ₹1,399" | P2 | local | med |
| P9 | Not found `product.html:88-95` | "Back to the catalogue →" | Recover | Back action, forward arrow (O) | C | X4 | `arrow-left` or none | — | Arrow SVG lacks `aria-hidden` | P2 | local | high |
| P10 | Queued **site-kry** numbered info points under the main image | (not built) | Learn features | Risk: hover-only, essential info (H) | E | Numbers are text, not icons; tap opens on phone; a visible numbered list below is the fallback | none (numerals in circles) | tap / focus | `<button aria-expanded aria-controls>`; never hover-only | P1 (when built) | local | med |

### 5.5 Maker (`maker.js`, `plant-search.js`)

| ID | Location | Current | User purpose | Problem (O/H) | Rec | Rationale | Lucide icon | Responsive | A11y | P | Scope | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| M1 | Step nav `:243-252` | "01 Chamber … 04 Your space ✓ Review" | Know where I am / jump | `✓` on a *future* step reads as "done" (O); done state shown by colour only (O, `maker.css:68`) | B | X3 | `check` replaces the number on done steps; Review gets "05" | phone keeps "01 02 03 Plants 04 05" | Add sr-only ", completed" to done steps | **P1** | local | high |
| — | wording | "✓ Review" → **"05 Review"** | | | | | | | | | | |
| M2 | Plant Add button `:325-327` | Visible "Add" / "Added ✓" / "Full"; aria-label "Add/Remove {name}"; `aria-pressed` | Add a plant | Spoken name ≠ visible text (WCAG 2.5.3); name flips and pressed flips (O) | B | Same toggle rule as Save | `plus` → `check` | — | `aria-label="Add {name}"` stays fixed + `aria-pressed`; visible "Add" / "Added" | **P1** | local | high |
| M3 | Selected tray `:433-435`, filter chips `:394`, review remove `:526` | "×" at 34 / ~24 / 28 px | Remove | Three sizes, glyph rendering (O) | A | X1 | `x` 16 px | phone: 44 px target | Names are already right | P2 | local | high |
| M4 | Search + Guided search `:437-440` | Text field + filled dark "GUIDED SEARCH" | Find plants | Fine; Guided search is filled while Continue is outline, so the two "primaries" compete (H) | C (Guided) | User hierarchy: text-led; optional icon | optional `compass` (avoid `sparkles`, which reads as AI) | — | `aria-haspopup="dialog"` present | P2 | local | med |
| M5 | List / Map `:442-443` | Text segmented control | Switch view | Fine | C (or B) | Short clear text | optional `list`, `map` | — | `aria-pressed` present | — | local | high |
| M6 | "Filter & sort", plant "Details" | Native `<details>` with ▸ | Refine / learn more | Native marker differs from the enquiry disclosure (O) | E | Disclosure is right; unify the marker | `sliders-horizontal` (Filter), `chevron-down` (rotate) | — | Native semantics, good | P2 | local | high |
| M7 | Plant detail `:331-341` "Light · care: Not rated yet" | Text `<dl>` | Will it suit me? | Fine and honest. When Care data lands, icons help scanning (H) | B (later) | Care facts are scannable attributes | `sun`, `droplets`, `thermometer` | — | Icons `aria-hidden`; the `dt` text stays | P2 | shared (Care) | med |
| M8 | Map pins `:370-372` | Plant glyph buttons + `title` | Explore by climate | `title` tooltip doesn't work on touch, but tapping opens the card, so it's OK (O) | E | — | keep the botanical glyphs | — | Fine | — | local | high |
| M9 | Guided search dialog `:476-486` | "×" close 44 px, step dots, Back / Skip → | Answer questions | Close glyph (X1) | A | — | `x` | — | Fine | P2 | local | high |
| M10 | Review actions `:535-544` | Add to cart, Save, Send on WhatsApp, Copy design link, Start over | Finish | Five buttons, three of them secondary-weight (H) | D | One primary; Copy / Start over as quiet text links | `link` (Copy, optional), `rotate-ccw` not needed | — | — | P2 | local | med |

### 5.6 Cart / Saved drawer (`cart.js`)

| ID | Location | Current | User purpose | Problem (O/H) | Rec | Rationale | Lucide icon | Responsive | A11y | P | Scope | Conf |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| K1 | Close `:251` | "×" 1.5 rem, aria-label "Close" | Close | Name is generic (O) | A | X1 | `x` | — | "Close cart" | P2 | shared | high |
| K2 | Qty `:198-201` | "−" "+" text, 40 × 40 | Change quantity | Under 44 on touch (O) | A | Universal | `minus`, `plus` 16 px | phone 44 | Names good | P2 | shared | high |
| K3 | Save for later / Remove / Move to cart | Caps text links | Manage lines | Fine: consequential actions stay text (O) | C | Carbon: destructive = labelled | — | — | Remove has sr-only title, good | — | shared | high |
| K4 | Thumb fallback "M" / "E" `:196` | Serif letter | Recognise the line | Cryptic letters (H) | D → bespoke chamber line art (Maker build) / product photo | Botanical art, not generic icons | none | — | Already `aria-hidden` | P2 | shared | med |
| K5 | "Send order on WhatsApp →" | Primary CTA, opens WhatsApp | Send order | No new-app cue (O) | C + `arrow-up-right` | X7 | `arrow-up-right` | — | sr-only "(opens WhatsApp)" | P2 | shared | med |
| K6 | Tabs "Cart (1)" / "Saved (0)" | Text tabs | Switch list | Count format ≠ header (O) | C | X5 | — | — | Tabs pattern is correct | P2 | shared | high |
| K7 | Upcoming Care upsell rows (CARE-PLAN §pairings) | not built | Add a matching kit / visit | Risk: icon soup in the drawer (H) | B, one icon per suggestion type | — | `package` (kit), `calendar-clock` (visits) | — | Price text, never icon-only | P2 | shared | med |

### 5.7 Journal, About, Privacy

| ID | Location | Current | Problem (O/H) | Rec | Icon | P | Conf |
|---|---|---|---|---|---|---|---|
| J1 | 23 × `blog/*.html:78` | "← Back to Journal", 20 px tall | Text arrow; small target (O). With Journal gone from the top nav, this is the main way back (O) | B | `arrow-left` | P2 | high |
| J2 | `blog.html` cards | Text | Fine; editorial = typography + imagery | C | — | — | high |
| A1 | `about.html` | Only shared chrome icons found | Nothing local | — | — | — | med |
| V1 | `privacy.html` | Loads `about.css`, not `home.css`; marks **About** as `aria-current` (`:51`) | Footer breakage (S1); wrong current-page marker (O) | fix | — | **P0** (S1) / P2 | high |

---

## 6 · Cross-journey issues

**A · Discover (home → catalogue → search → product)**
- Home has two trust rows, the hero proof and the strip (H2). Merge them so the hero promise is read once.
- On the catalogue, the volume tabs are mislabelled for screen readers (C1). Search closes with "ESC" on phones (C3).
- No save from the grid (C5), so Saved is only reachable from a PDP or the Maker.
- Prices on cards stay text, which is right.

**B · Create (Maker: chamber → foundation → plants → your space → review)**
- The step bar misuses `✓` and shows done steps by colour only (M1).
- The plant toggle's spoken name contradicts its visible text (M2).
- Remove uses "×" at 3 sizes (M3).
- The price running line ("Moss · ₹6,000 – ₹9,000 · 3 plants") is clear text. Keep it as text.

**C · Evaluate a product (details → features → specs → save / enquire / buy)**
- Selected size and material aren't announced (P1, **P0**).
- Lead time and delivery sit below the WhatsApp alternatives (P3). Move them under the price, because they decide the purchase.
- Save changes its label (P2). The queued info points (P10) must not be hover-only.

**D · Purchase / enquire (cart → review → send → confirmation)**
- The drawer is already strong: text actions, undo, an honest "nothing is charged" note.
- Fixes: a new-app cue on Send (K5), 44 px qty targets (K2), a count format that matches the header (K6), and readable thumbnails for custom lines (K4).
- After sending, the notice text is good. Not verified: whether focus lands on it.

---

## 7 · Proposed iconography and labelling rules

### 7.1 Family, source, naming
- **One functional family: Lucide**, vendored. No npm runtime dependency. Copy the SVG bodies from `lucide-static@0.460.0` (ISC; keep the licence line in the file header).
- **One registry: `data/icons.js`** exports `icon(name, { size, label })` returning an SVG string. HTML pages get it through `scripts/includes.mjs` (the same mechanism as the header and footer), and the renderers (`cart.js`, `maker.js`, `render-*.js`) import it. `npm test` already fails when a stamped page drifts, so icons are covered for free.
- **Names = Lucide kebab-case names** (`shopping-bag`, `arrow-up-right`). The brand arrow is registered as `arrow-long` (the existing 16×8 path), and the WhatsApp, Instagram and LinkedIn marks as `brand-whatsapp`, `brand-instagram`, `brand-linkedin`.
- **Why not install now:** current inline SVGs can't meet the need (6 weights, no source of truth). A vendored subset of about 22 icons is roughly 6 KB and needs no build change. Revisit npm `lucide` only if the set grows past about 40.

### 7.2 Tokens (add to `styles/tokens.css`; validate on screen)
| Token | Value | Use |
|---|---|---|
| `--icon-xs` | 12px | inline with caption text, external-link cue, breadcrumb |
| `--icon-sm` | 16px | inline with body text, trust facts, buttons, chips |
| `--icon-md` | 20px | header / toolbar (search, close, cart, saved, menu) |
| `--icon-lg` | 24px | prominent single actions (floating WhatsApp) |
| `--icon-stroke` | 1.5 (test 1.25) | all outline icons; matches the 1 px rules and the 1.2 arrow |
| `--icon-gap` | .5em (8 px at 16 px) | icon ↔ label (Carbon: 8 px) |
| `--icon-target` | 44px | minimum hit area for any icon-only control (Apple HIG 44 pt; Lucide a11y doc) |
| colour | `currentColor`, inherits `--ink` / `--ink-soft` / `--mute`; accent only for trust facts (`--accent`) | never hard-code hex (H3) |

Every emitted `<svg>` carries `width` + `height` = the size token's px value, `aria-hidden="true"`, `focusable="false"`, `stroke-width` from the token, `stroke-linecap/linejoin="round"`.

### 7.3 States
- **Outline** by default. **Filled** only for `heart` when saved, and for `star` when rated (status icons, per Carbon).
- Hover: colour `--ink-soft` → `--ink` (existing pattern). Never animate size; the existing 4–6 px arrow nudge stays for the brand arrow only.
- Focus: the existing focus ring on the *control*, never on the SVG.
- Pressed/selected: fill (heart) or label weight change, *plus* `aria-pressed`/`aria-checked`. Disabled: `--rule-stronger` colour (cart pattern) + `disabled`.

### 7.4 Semantic map (same meaning = same icon, everywhere)
| Meaning | Lucide | Never use it for |
|---|---|---|
| Search | `search` | filter |
| Close (dialog, menu, overlay) | `x` | — |
| Remove item / chip | `x` (smaller, `--icon-sm`) | delete-forever (use the word "Remove") |
| Save / saved | `heart` | rating, "like" |
| Cart | `shopping-bag` | enquiry |
| Menu | `menu` | — |
| Go forward / CTA | `arrow-long` (brand) | external links |
| Back | `arrow-left` | — |
| Opens WhatsApp / external | `arrow-up-right` | internal links |
| Expand / collapse | `chevron-down` (rotates 180°) | navigation |
| Breadcrumb separator | `chevron-right` (`--icon-xs`) | "next" |
| Add / quantity up | `plus` | — |
| Quantity down | `minus` | — |
| Done / added / verified | `check` | "review" |
| Made to order / lead time | `clock` | — |
| Delivery | `truck` | home |
| Handcrafted | `sprout` (functional) | botanical storytelling |
| Rating | `star` | save |
| Info / specs | `info` | warnings |
| Filter & sort | `sliders-horizontal` | settings |
| Theme | `sun` / `moon` | — |
| **Care** (upcoming): light, water, visits, refill kit, home, business, coverage | `sun`, `droplets`, `calendar-clock`, `package`, `house`, `building-2`, `map-pin` | — |

### 7.5 Labelling conventions
| Pattern | When | Example |
|---|---|---|
| **Icon only** (A) | Universal and secondary, with context | close, search (phone), menu, qty ±, remove chip, social, WhatsApp float |
| **Icon + text** (B) | Icon speeds scanning; the word removes ambiguity | Saved / Cart (desktop), Save, trust facts, back links, Maker done steps, Care facts |
| **Text only** (C) | Commercial, consequential, editorial | Add to cart, Send order, Notify me, Start creating, Design your own, prices, titles, tabs |
| **Icon + tooltip** | Desktop-only aid on an icon-only control, never the only label | optional on header icons <1080 (no hover on touch) |
| **Accessible name ≠ visible label** | Only to *add* context, and it must *start with* the visible words (WCAG 2.5.3) | visible "Remove" → name "Remove Java Moss"; visible "Cart 2" → name "Cart, 2 items" |

Prefer **sr-only text inside the control** over `aria-label` (Lucide a11y doc). Keep names to 1–3 words with the verb first, never including "button" (APG).

### 7.6 Botanical illustration conventions
- They live in `assets/` or bespoke inline SVGs, **never in `data/icons.js`**.
- Fine line, `currentColor` or brand tokens, no Lucide geometry.
- Use them for storytelling, chambers, plants, empty states and Maker thumbnails, and where a cart line has no photo.
- Decorative ones get `aria-hidden`. Informative ones (Maker chamber) get `role="img"` + a label, as `maker.js:178` already does.

---

## 8 · Accessibility and responsive risks

| Risk | Where | Status |
|---|---|---|
| Selected variant/material not exposed | PDP (P1) | Observed, **P0** |
| Shared component styled in page CSS → icons explode | Footer on privacy (S1) | Observed, **P0** |
| Name and state both toggle; spoken ≠ visible | Save, Maker Add, theme | Observed, P1 |
| Tabs reference missing ids | Catalogue (C1) | Observed, P1 |
| Status by colour only | Maker done steps (M1), star fill (P5) | Observed, P1 |
| Dark-mode hard-coded colours | Principles (H3) | Observed, P1 |
| Touch targets <44 px (all ≥24 px except text links) | qa 40, review × 28, social 32, caps text links 15–20 px tall | Observed, P2 |
| `ESC` text close on touch | Catalogue search (C3) | Observed, P1 |
| Hover-only meaning | principles dim on hover; custom cursor labels (`data-cursor` "ADD", "ASK"); queued info points | Cursor labels duplicate visible text, so OK. Info points: risk |
| Phone menu doesn't move focus inside on open | `menu.js:86` | Hypothesis (no focus code), P2 |
| Floating WhatsApp overlaps content at 390 px | home, catalogue | Observed, P2 |
| New-tab / new-app links without warning | WhatsApp, Google review, social | Observed, P2 |

---

## 9 · Prioritised implementation backlog (in order)

| # | Item | IDs | P | Effort | Depends on |
|---|---|---|---|---|---|
| 1 | Move footer (`.colo-*`) styles from `home.css` into a shared sheet (e.g. `components.css`); add `width`/`height` to the social SVGs; fix privacy's `aria-current` | S1, V1 | P0 | S | — |
| 2 | PDP selectors → radiogroup/radios with `aria-checked`, labelled group | P1 | P0 | S | — |
| 3 | Fix toggle semantics: Save (fixed label + `aria-pressed`), Maker Add (fixed name "Add X" + `aria-pressed`, visible "Add/Added"), theme switch (fixed name "Dark mode") | P2, M2, S5 | P1 | S | — |
| 4 | Catalogue tabs: add ids, arrow keys | C1 | P1 | S | — |
| 5 | Star rating text alternative; Maker done steps get `check` + sr ", completed"; Review → "05" | P5, M1 | P1 | S | 6 for icons (text fix can ship first) |
| 6 | Create `data/icons.js` (Lucide subset + `arrow-long` + brand marks), size/stroke tokens, stamping via `includes.mjs`; replace the 4 arrow constants | §7 | P1 | M | — |
| 7 | Principles glyphs → `currentColor` + `aria-hidden` | H3 | P1 | XS | — |
| 8 | Unify close/remove on `x`; search close "ESC" → `x` 44 px; brand-style the native search clear | X1, C3, S4, K1, M3, M9 | P1 (C3) / P2 | S | 6 |
| 9 | Delivery icon = `truck` everywhere; trust facts at one size/stroke; move PDP trust row under the price | H1, P3, X2 | P2 | S | 6 |
| 10 | Header Saved/Cart → heart / shopping-bag, count hidden at 0, icon-only <1080 | S2, X5, K6 | P2 | M | 6, user decision Q1 |
| 11 | Back links / breadcrumbs → `arrow-left`, `chevron-right` (`aria-hidden`); not-found arrow fix | P6, P7, P9, J1, X4 | P2 | S | 6 |
| 12 | External cue `arrow-up-right` + sr text on WhatsApp / review / social links | X7, H5, K5, S6 | P2 | S | 6 |
| 13 | PDP buy block: one primary, alternatives in one disclosure, new wording | P4 | P2 | S | user decision Q3 |
| 14 | Maker: `<details>` markers → `chevron-down`; Filter gets `sliders-horizontal`; review actions trimmed | M6, M10 | P2 | S | 6 |
| 15 | 44 px targets: qty, review ×, social, caps text links | K2, M3, X10 | P2 | S | — |
| 16 | Cart thumbnail fallback → bespoke chamber line art | K4 | P2 | S | — |
| 17 | Phone sticky CTA shows the price; floating WhatsApp hides while the sticky CTA shows | P8, S7 | P2 | S | — |
| 18 | Home: merge the two trust rows | H2 | P2 | S | user decision Q4 |
| 19 | Care section: use the §7.4 Care mappings (B pattern) from day one | K7, M7 | P2 | — | Care build |
| 20 | site-kry info points: numbered `<button aria-expanded>` + visible list fallback | P10 | P1 when built | — | site-kry |
| 21 | Catalogue card Save (heart) | C5 | P2 | M | user decision Q2 |

---

## 10 · Expected impact, dependencies, open questions

**Expected impact**
- Items 1–5 remove every observed functional and a11y defect in the icon/label layer. These are small, local diffs.
- Item 6 replaces about 60 copies with one registry, so stroke and size become one decision rather than six.
- Visual change is deliberately small. The look stays text-led, and icons are added only where §7.5 says they help.

**Dependencies**
- `scripts/includes.mjs` stamping and its test (for item 6).
- Another agent is editing the repo right now: items 1, 3 and 9 touch `cart.js`, `site.js` and `render-product-detail.js`.
- Care build (`CARE-PLAN.md`) and site-kry should adopt §7 when they land.

**References and how they shaped this audit**
- **Lucide icon set** (lucide.dev/icons, verified names on `lucide-static@0.460.0`): the family and names in §7.4. Default stroke 2 / size 24 → overridden to 1.5 for this brand.
- **Lucide accessibility doc**: icons are `aria-hidden` by default; name the *control*, not the icon; prefer sr-only text over `aria-label`; 44 × 44 targets on the wrapper. Shaped X9, §7.2 and §7.5.
- **WAI-ARIA APG, Names and descriptions**: prefer visible text; 1–3 words, verb first; no role words. Shaped the toggle fixes (S5, P2, M2) and the "Cart, 2 items" naming.
- **Carbon button guidelines**: icon-only buttons used sparingly, always with a tooltip on desktop; one primary per view; 8 px icon gap; 16 px icon in buttons; filled only for status; launch icon for new-tab links. Shaped P4, M4, M10, X7 and §7.3.
- **Apple HIG Buttons**: 44 pt hit targets; text where meaning is ambiguous; consistent styles for like actions. Shaped X1, K2 and §7.2 `--icon-target`.
- **NN/g Icon usability** *(not re-fetched; DNS failed)*: very few icons are universally understood (search, home, menu, close, cart); labels are needed for nearly everything else; hover tooltips are not available on touch. This is why most EarthBox actions stay text.
- **NN/g Icon testing** *(fetched via summary)*: test recognisability out of context, findability in context. Suggested follow-up: a 5-person in-context test of the header icons (item 10) before shipping the icon-only phone variant.

**Open questions for the user**
1. **Header:** OK to move to heart + bag icons, icon-only on phones, with counts hidden at zero? And should the icon be `shopping-bag` (code already says "bag") or `shopping-cart` (the label says "Cart")?
2. **Catalogue cards:** add a heart Save on each card, or keep saving to the PDP only?
3. **PDP buy block:** can "Or ask on WhatsApp" and "Prefer email? Send an enquiry" fold into one "Other ways to order" disclosure?
4. **Home:** merge the "50+ / ★ 4.8 / Mumbai" strip into the hero proof row, or drop it? (Also worth confirming that "50+ pieces delivered" and "4.8" have a source.)
5. **Stroke:** check 1.25 vs 1.5 side by side before committing the token.
6. **Floating WhatsApp:** is its absence on product, maker and article pages intentional?
