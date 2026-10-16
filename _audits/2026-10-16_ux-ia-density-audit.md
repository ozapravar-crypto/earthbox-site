# UX, information architecture and content-density audit

*16 Oct 2026. Owner brief: "show the right information, at the right moment, at the right level of detail." **Report only: no code has changed. Every change below waits for approval.** Tracking bead: `site-bhr`.*

**TL;DR:** ***The site isn't overloaded everywhere. It's overloaded in three places and broken in one.***
- ***Broken, live now:*** *the Journal list shows no articles, and four sections of About are blank. The text is in the page, but it never fades in.*
- ***Overloaded:***
  - *Home embeds the whole catalogue, 32 cards that take up 57% of the page.*
  - *The Maker's Plants step puts tools built for 45 plants around the 5 that fit.*
  - *The cart's "Estimated total" reads like a final bill while items still need a quote.*
- ***Wrong promises:***
  - *"Coming soon" pieces can be put in the cart and ordered.*
  - *Review never says what happens after you send.*
  - *A shared design link can silently overwrite your own saved design.*
- ***The plan:*** *fix the bugs first, then a small set of shared rules (one main button per section, one way to show "selected", readable labels), then redo the cart, Plants, Review, the product page and Home against those rules.*

*There are 74 findings: 1 critical (P0), 18 high (P1), 39 medium (P2) and 16 low (P3). Some decisions need Aayush; they're listed at the end.*

---

## How this was done

- **The site:** a static site with no framework. Pages are HTML files, with screens drawn by small scripts from `data/`.
- **Where it ran:** the built site, run locally, with the Journal checks repeated on www.earthbox.in.
- **Three reviewers:** the Maker, Shopping (catalogue, product pages, cart, Care) and Content plus the site frame. Each one drove the real pages in a browser at 1440, 768 and 390 px, in light and dark, and read the code behind each problem.
- **Nothing was sent.** WhatsApp, the email service and analytics were blocked during the run.
- **Evidence:** screenshots and the scripts that took them are in the session scratchpad. Every finding cites a file and line, or what was seen on screen.
- **Not covered:**
  - a real screen reader (only page structure and labels were checked)
  - 200% zoom
  - a real touch phone
  - the email route sending for real
- **Built on earlier work:** `_audits/2026-10-10_super-ux-audit.md`, whose fixed items weren't re-raised, plus `SHOPPING-PLAN.md`, `CART.md` and `AAYUSH-QUESTIONS.md`.

**Flagged clash.** The brief describes the identity as "dark charcoal surfaces". The site is actually warm off-white paper (`--bg #F8F7F5`), with an optional dark mode (`#1A1918`). This audit keeps the real identity.

---

## A · Routes, screens and states

| Area | Routes | States checked |
|---|---|---|
| **Home** | `/` | First visit (loader, cookie banner), repeat visit, reduced motion, scrolled header |
| **Catalogue** | `/products` | Place switch (Indoors / Sunny window / Balcony), Add and Save from a card, coming-soon cards, chambers, vivariums, search hint / results / no results |
| **Product** | `/product/<SKU>` (43 pages) | With sizes, without sizes, coming soon, chamber, vivarium, unknown code (real 404) |
| **Maker** | `/maker` | Start, Chamber, Foundation, Plants (list, map, filters, guided search, full, no results), Your space, Review. Plus: reload part-way, share links, `?box=`, changing an earlier choice |
| **Cart drawer** | every page | Empty, one line, many lines, Maker build, Care plan, Saved tab, quantity, Save for later / Remove / Undo, suggestions, email form (empty, bad email, server error, success), WhatsApp send, confirmation, clear plus Undo |
| **Care** | `/care` | Home planner (piece / custom box / own plants × kit / visits), business form, entry from a product page |
| **Content** | `/about`, `/blog`, 2 articles, `/privacy`, 404 | Journal filters, light and dark |
| **Site frame** | every page | Header, mobile menu, theme switch, footer, cookie banner, WhatsApp button, cursor, loader, scroll reveal |

**Shared components:**
- `.cta` / `.cta-secondary` / `.ct-link` buttons
- `selector-chip`, `place-btn`, `pd-selector-btn`, `filter-btn`
- the `v1-card` card, the cart drawer (`cart.js`), the email form (`enquiry-form.js`)
- the "Other ways to order" fold, `.ct-notice`, the reveal system (`reveal.js`)
- the icon set (`data/icons.js`, 26 Lucide icons, no package)

---

## B · Prioritised findings

*IDs: **C** = content and site frame, **S** = shopping, **M** = Maker. "Treatment" uses the brief's eight options.*

### P0 · critical (1)

| ID | Where | Problem | Evidence | Change | Treatment |
|---|---|---|---|---|---|
| C-01 | Journal list, About | Text drawn by script never fades in: 23 of 24 Journal cards and 4 of 8 About sections are invisible **on the live site**. Their invisible links still take keyboard focus | Re-checked on www.earthbox.in, 16 Oct: `/blog` 23/24 hidden, `/about` 4/8. `main.js:75-77` runs the reveal set-up before these pages draw. `render-blog.js` and `render-about.js` never register their new blocks; `render-products.js:15` does | Register new blocks after drawing (or have the reveal system watch for them), plus a test that nothing stays invisible after scrolling | Preserve as required (fix) |

### P1 · significant friction on an important journey (18)

| ID | Where | Problem | Evidence | Change | Treatment |
|---|---|---|---|---|---|
| S-01 | Coming-soon product | 23 of 32 pieces show **Add to cart** and "Made to order · ~1 week". The cart accepts them and sends the order. The page promises "Register your interest below", but there's no such button | `render-product-detail.js:271-275,322`; `cart.js:92-96` has no coming-soon check (chambers do, at `:101`) | Register interest + Save; no lead time; the cart refuses coming-soon pieces, as it already does for chambers | Remove / Preserve |
| S-02 | Chamber page (desktop), chamber cards | The published price range (e.g. ₹6,000 – ₹9,000) appears nowhere except the phone's sticky bar | `render-product-detail.js:519-522` vs `:551`; `render-products.js:218-223` | "Guide ₹a – ₹b · final price on enquiry", on the page and each card | Preserve as required |
| S-03 | Cart after sending | Nothing changes: Send stays the main button, the email form is ready again, and its thank-you disappears. A double send is likely | `cart.js:313,322-327` | A "Sent" state: list becomes read-only, main button becomes Clear cart, "Send again" as a small link | Show contextually |
| S-04 | Cart summary | "Estimated total" is the biggest number, even with unpriced items. "+1 on enquiry" is small grey text, and delivery has no row | `cart.js:270-275` | One row: "Estimate so far ₹X + 1 to quote". A row for "Delivery · Mumbai · confirmed by the studio". Merge the repeated notes | Consolidate |
| S-05 | Product page, desktop | No price or Add above the fold | screenshot `pd-sizes-d-fold` | Heading moves into the buying column; price and Add at the fold | Move |
| S-06 | Cart suggestions | A product link is labelled "Plan" | `cart.js:261`; `pairings.js` | Each suggestion's button says what it does: View / Add / Plan visits | Keep inline |
| M-01 | Opening a share link | Silently overwrites the visitor's own saved design on the first edit | `maker.js:605-611,628` | Keep the visitor's own design and offer "Open mine"; never overwrite without asking | Show contextually |
| M-02 | Editing a shared design | Reloading throws the edits away, because the shared link stays in the address bar | `maker.js:606` | Clear the link from the address bar on the first edit | Preserve |
| M-03 | Plants | Adding or removing a plant, and "chamber full", aren't announced to screen readers | `maker.js:399,435,672` | One fixed spoken-update line: "Added Fittonia. 3 of 5 plants." | Preserve |
| M-04 | Plants tray, Review | Removing a plant drops keyboard focus to the top of the page | `maker.js:438,544,680` | Move focus to the next plant, or else to the count | Preserve |
| M-05 | Plants, phone | Only 382 of 844 px are left for the list; the count and search scroll away | `maker.css:292-297` | A thin preview strip with "View 3D"; count goes in the bottom bar | Move / disclose |
| M-06 | Plants | Tools for 45 plants (search, guided search, map, 16 filter chips, sort) are shown around 5. Guided search returns all 5 or none (Bite: always none). 36 controls for a 4-plant chamber | 8 of 10 chambers show exactly 5 plants (`gd.mjs`) | Show the plants that fit straight away. Search, filters, map and guided only when more than 8 fit, or behind "Explore other chambers" | Progressively disclose |
| M-07 | Review | Never says what happens next (the studio quotes, checks availability, sends a payment link). Shows a lead time as if the chamber were in stock | `maker.js:539-566` vs `:263`; `CART.md` confirms the payment-link step | A 3-line "What happens next" plus "Made to order · availability confirmed with your quote" | Keep prominent |
| C-02 | Home | Home's "preview" is the whole Volume I catalogue: 32 cards (23 coming soon), the place switch and Add buttons, 6,793 of 11,830 px | page measurement; `index.html` | 4 available pieces, a line "32 pieces · 23 coming soon · chambers on enquiry", and "View full catalogue" | Consolidate |
| C-03 | Home hero | On every repeat visit the heading and main button stay invisible for about 3.3 s, because the first-visit delay always runs | `home.css:38` | Only delay while the loader is actually playing | Show contextually |
| C-04 | Mobile menu | Focus doesn't move into the open menu. Tab goes to links behind it, and focus isn't returned on close | `menu.js:84-92` | Focus into the menu, make the page behind it unreachable while open, return focus on close | Preserve (fix) |
| C-06 | Home trust strip | "★ 4.8 Customer rating" and "50+ pieces delivered" have no source while Q11 (are the reviews real?) is open. "Mumbai" repeats the hero row | `index.html:198-216` | Remove the rating until Aayush confirms; merge the strip into the hero's proof row | Remove / Consolidate |
| S-22 *(raised to P1)* | Product reviews | Every review says "Verified Purchase", which is unconfirmed (Q11). This is the same consumer-rules risk as C-06 | `render-product-detail.js:170-175`; `data/reviews.js` | Hide the badge until Aayush confirms | Remove (badge only) |

### P2 · meaningful refinement (39)

| ID | Where | Problem → change | Treatment |
|---|---|---|---|
| S-07 | Cart | Tab says Cart (5), summary says 4 on enquiry (a build's parts are counted) → count pieces, not parts | Consolidate |
| S-08 | Cart ≤1000 px | No email route on phone or tablet → a quiet "Send by email instead" link at all widths | Disclose |
| S-09 | Order form | Asks only name and email. WhatsApp text has no name or pincode. Labelled "enquiry" → name, phone, pincode (Mumbai check), optional email; "Send order by email" | Consolidate |
| S-10 | Cart lines | "Ready to order" sits beside "Made to order"; C/E/M letter thumbnails → drop the kind label, use icons, status on its own line | Remove |
| S-11 | Cart length | Send is 1–2 screens down (1,705 / 1,856 px) → a sticky footer with the estimate and Send | Move |
| S-12 | Product, related row | Always 4 coming-soon planters, no heading, no prices → available pieces first, a visible heading, price or status per card | Keep inline |
| S-13 | Product | The description's first sentence appears twice → drop the short copy | Remove |
| S-14 | Product sizes | No dimensions → add them once Aayush sends them (never invent) | Preserve |
| S-15 | Catalogue, product, cart | Save 36 px, Add 36 px tall, chips 35 px, Undo 36 px → 44 px touch areas, same look | Keep |
| S-16 | Catalogue after scrolling | The chosen place is no longer visible → "Prices for: Indoors" in the sticky bar | Show contextually |
| S-17 | Catalogue grid | Grey filler blocks; 15 coming-soon plant packets → remove fillers, "Show all 15", one status signal | Disclose |
| S-18 | Catalogue search | "asa" finds nothing; results have no price or status; coming soon listed first → search materials and places, show price or status, available first | Keep inline |
| S-19 | Saved tab | A chamber shows "On enquiry" twice though a guide range exists → "Guide ₹… · Coming soon" | Consolidate |
| S-20 | Care from a coming-soon piece | The dropdown shows the wrong piece → fixed by S-01, plus a guard | Remove |
| S-21 | Care | "Which plants live in it?" uses the Maker's group names (Earth, Fire, Bite…) and is asked even for visits → plain names first; ask only when it changes the result | Disclose |
| S-23 | Product WhatsApp message | Pre-written in the studio's voice ("one of my favourites…") but sent by the customer → write it in the customer's voice | Keep inline |
| M-08 | Plants | The "fits my chamber" switch is inside the folded Filter panel → a visible line: "Showing plants for the Dark chamber · Show all climates" | Move |
| M-09 | Plants | A chosen plant shows "✓ ADD"; "Full" gives no reason → "Added", plus "Chamber full: remove one to add another" | Keep inline |
| M-10 | Plants map | Pins have no names → explore mode only, with names | Disclose |
| M-11 | Your space / guided search | Room asked twice; care can't be edited on Your space; light is collected but never sent → Your space owns every answer; send light with the enquiry | Consolidate |
| M-12 | Review | A recipe's name ("Tiny Jungle") stays after you change its chamber and plants, and goes to the studio → clear it when the chamber changes | Show contextually |
| M-13 | Review | 8 actions; the Care offer sits between the estimate and Add to cart; Start over sits beside Copy link → one main, one secondary, email under it, Care after, Start over last | Consolidate / Move |
| M-14 | Review → Edit | Edit puts you back into the full sequence → "Back to review" when you came from Review | Show contextually |
| M-15 | Chamber cards | Compatibility text is ~9 px grey uppercase; no example plants; availability only as one note; "Choose" on every card → readable line plus 2–3 plant names, "Made to order" per card, drop "Choose" | Keep prominent / Remove |
| M-16 | Foundation | Nothing marked recommended; good mixes don't say what they suit; the unsuitable reason isn't reachable by keyboard; two price wordings → "Recommended" on Studio's choice, "Suits …" on both, one wording | Show contextually |
| M-17 | Step bar, phone | Bare numbers 02–05, 17 px wide → "Step 3 of 4 · Plants", or labelled 44 px targets | Preserve |
| M-18 | Start / resume | "Continue" jumps to the furthest step, not where you were; no summary → remember the last step: "Continue: Dark · 2 plants" | Show contextually |
| M-19 | Share link in the same tab | Pasting a different link does nothing → load it (with the M-01 guard) | Preserve |
| M-20 | Share link | Plants that don't fit are dropped silently → "1 plant in this link doesn't fit and was left out" | Show contextually |
| C-05 | Home footer | "Philosophy" points to an anchor that exists only on About → `/about#philosophy` | Remove / fix |
| C-07 | Journal filters | Selected looks the same as hover; screen readers aren't told which is on; boxes where the house rule says underline → underline plus pressed state, 44 px | Reduce emphasis |
| C-08 | Journal, About | Heading levels skip (H1→H3, H2→H4) → fix the levels, keep the look | Preserve |
| C-09 | Cookie banner | 170 px on phones; covers the hero button and an article's first paragraph, and sits over the WhatsApp button → one compact row of about 96 px | Reduce emphasis |
| C-11 | Footer, Home | Internal brand notes on public pages: "The brand speaks softly, like a crafted object label."; "Disposition" → customer facts; "Price" | Remove |
| C-12 | Article callouts | 3 px coloured left stripe (against the house rule) → the full 1 px box used by `.ct-notice` | Consolidate |
| C-13 | Buttons, site-wide | "Primary" buttons are outlines that fill only on hover; secondary differs only in border tone; Home has 3 primaries and none filled at rest → three tiers (rule E1) | Consolidate |
| C-14 | Small labels, site-wide | 39 different size/spacing combinations, down to 8 px → 3 label sizes, nothing under ~10 px | Consolidate |
| C-16 | "Selected" styles | 4 different looks for "selected"; three of them aren't announced → rule E2 | Consolidate |
| C-19 | Header links | 16 px tall → 44 px touch area, same look | Keep |

### P3 · polish (16)

| ID | Where | Change |
|---|---|---|
| S-24 | Care pincode | The "400101" placeholder looks filled in → a plain hint plus a coverage note |
| S-25 | Chamber page | Three paragraphs before the photo → move them below |
| S-26 | Vivarium page | Add an email route; move the status above the button |
| S-27 | Catalogue, phone | Stack the category header; the WhatsApp button overlaps the price chip |
| S-28 | Category price chip | It repeats the card prices → remove it |
| S-29 | Email form errors | Browser pop-ups → error text in the form's status line |
| S-30 | Care wording | "A chamber, planter or plant…", but chambers can't be chosen → reword |
| M-21 | Chamber switch | Undo disappears on the next tap → keep it until dismissed |
| M-22 | Plant search | "cactus" and "easy" find nothing → add synonyms |
| M-23 | Water chamber | Says "up to 8", but only 5 plants fit → "up to 5 from our list" |
| M-24 | Recipe cards | No price → "from ₹x" |
| M-25 | Plant details | "Not rated yet" on all 45 plants, and the plant group said 4 ways → one note under the list |
| C-10 | Home Maker band | A lone "02" with no 01 → remove |
| C-15 | Badges | `components.css` promises a `.badge` that's empty; each page invents its own → one shared badge |
| C-17 | Article quotes | .8 rem, smaller than body text → 1 rem italic |
| C-18 | Reduced motion | Smooth scrolling isn't switched off → switch it off |

---

## C · Proposed information architecture

**What stays visible everywhere:**
- price, with what it's for (size and place) and how firm it is (exact / guide / to quote)
- availability (orderable / coming soon / research)
- compatibility in the Maker
- the one main action
- "nothing is charged here"

**What becomes contextual:**
- Undo and change notices
- "chamber full"
- the "Sent" state
- the coverage hint for a pincode
- the place reminder after scrolling
- the dropped-plant note on shared links

**What goes behind a clearly labelled toggle:**
- the email route ("Send by email instead")
- other ways to order
- the Maker's search, filters, map and guided search when 8 or fewer plants fit
- the coming-soon plant packets beyond the first row
- plant and piece details

**What moves:**
- guided search goes to the Chamber step ("Help me choose a chamber")
- room, light and care questions all live in Your space
- the Care offer goes after the send actions on Review
- the catalogue tease moves up on Home
- the chamber description goes below its photo

**What goes:**
- the Home trust strip (merged into the hero)
- the rating, until confirmed
- the "Verified Purchase" badge, until confirmed
- the category price chips
- the grid filler blocks
- the repeated first sentence on product pages
- the "Not rated yet" filler
- the lone "02"
- internal brand notes in public copy
- one-edge stripes

**What must always stay, whatever the visual goal:**
- the quote and made-to-order uncertainty
- "nothing is charged"
- the coming-soon status
- the compatibility rules
- Undo
- both send routes
- the honest Decline on the cookie banner
- keyboard and screen-reader access

---

## D · Before → after, one complex screen per journey

### D1 · Cart drawer (Shopping)

**Before:**
- Each line shows a kind label, title, details and status, a stepper, actions and the price.
- Suggestions follow, all labelled "PLAN".
- The summary has four rows, with "Estimated total" the biggest number, then two grey notes.
- Then Send on WhatsApp, and the email form (desktop only).
- Everything scrolls, so Send can be two screens down on a phone.

**After:**
- **Tabs:** "Cart · 5 pieces | Saved · 2".
- **Lines:**
  - Title and price on top.
  - "Big Block · Balcony (ASA)" and "₹1,799 each" under them, then the status on its own quiet line.
  - Stepper, then "Save for later · Remove".
  - Unpriced lines say "On enquiry", with the guide range where one exists.
- **Suggestions:** each button says what it does.
- **Breakdown** (scrolls): priced pieces · chamber/build guide · to be quoted (n pieces) · delivery: Mumbai, confirmed by the studio.
- **Sticky footer:**
  - "**Estimate so far ₹9,598 – ₹12,598 + 3 to quote**", with the qualifier the same size as the number.
  - "Nothing is charged here."
  - **Send order on WhatsApp**.
  - "Send by email instead", at every width. It asks for name, phone, pincode and optional email, and shows the order read-only.
- **After sending:**
  - "✓ Sent to the studio · we usually reply within a day with the final price and delivery."
  - The list becomes read-only; the main button becomes Clear cart; "Didn't open? Send again" appears as a small link.
  - Editing returns to the normal view, with "Changed since you sent it".

**Why it differs from the other screens:** the cart is about checking and committing, not browsing. Its density stays, but certainty is labelled at the point of the number.

### D2 · Product page (Shopping)

**Before:**
- Breadcrumb, then a label repeating the breadcrumb.
- A big centred heading and empty space; on desktop the fold falls here.
- Then the photo, plus a side panel: a repeated short description, size cards, 35 px material chips, price, Add/Save and a trust row.
- Below: the description, reviews marked "Verified Purchase", and an unlabelled row of coming-soon pieces.

**After:**
- **Top:** breadcrumb only.
- **Photo, plus a buying column at the fold:**
  - the heading, then rating
  - **₹1,399**, with "Big Block · Indoors (PETG)" under it
  - sizes with dimensions (once supplied)
  - "Where will it live?", the same three places as the Catalogue, at 44 px
  - **Add to cart** + Save
  - one line: "Made to order · about 1 week · delivered in Mumbai"
  - the "Ask a question" fold
- **Below:** About this piece · Keep it thriving (available pieces only) · Reviews (badge hidden) · More planters (available first, each with a price or status).
- **Phone:** a sticky bar only once the real Add button has scrolled away.

**Variants:**
- **Coming soon:** "Coming soon", Register interest and Save; no lead time, no Care, no Add.
- **Chamber:** "Guide ₹… · final price on enquiry" under the heading.

### D3 · Maker: Plants

**Before:**
- Heading and intro, then the count and selected tray.
- Search plus a black "Guided search" button, then list/map and a folded Filter & sort.
- Then the results count and chips, and the rows.
- The first plant starts about 600 px down, and a phone leaves 382 px for the list.

**After, simple mode** (8 or fewer plants fit: 9 of 10 chambers):
- **Heading and intro:** "Choose up to 5 plants". "These grow in the Dark chamber's climate. Plants are quoted on enquiry."
- **The plants straight away.** Each row has thumbnail, name, botanical name, shape, and **Add → "Added ✓"** (screen readers still hear "Add Fittonia, pressed").
- **Then:**
  - one note: "Light and care ratings are coming; the studio advises with your quote".
  - a link: "Explore plants from other chambers (40 more)". It opens the full tools, and rows there show "Needs the Fire chamber · Use Fire", with the existing switch and Undo.
- **The bottom bar takes over the count:**
  - "2 of 5 plants · View / remove", with "Dark · ₹5,000 – ₹7,000 · plants quoted".
  - Back / Continue.
  - A spoken-update line.

**Explore mode** (Lab chamber, or "Explore"):
- **Search and controls:** full-width search, guided search as a quiet text button, and one control row: List | Map · Filter.
- **Compatibility line:** visible, "Showing plants for Lab · Show all climates".
- **Map and results:** map pins get names. The working "Loosen one" no-results state stays.

**Why it differs:** this is a discovery screen, so its tools are legitimate, but only once there's enough to discover.

### D4 · Maker: Review

**Before:**
- The name field and four summary groups with Edit, then the estimate.
- The Care offer, Add to cart + Save, a helper line, WhatsApp, "Prefer email?", Copy link + Start over, Back.

**After:**
- **Header:** "Review your world". The name clears if the chamber changed away from the recipe's.
- **Summary groups**, each with Edit, which then returns to Review:
  - **Chamber:** price range · **"Made to order · availability confirmed with your quote"**.
  - **Foundation:** "Quoted on enquiry".
  - **Plants:** "Quoted on enquiry", said once.
  - **Your space:** every answer, editable there.
- **Estimate:** "From ₹5,000. Plants and foundation are quoted by the studio. Nothing is charged here."
- **What happens next:**
  1. Send the design.
  2. The studio replies with a quote, availability and lead time.
  3. You confirm and get a payment link.
- **Actions:**
  - **Add to cart** + Save.
  - Secondary: "Send just this design on WhatsApp", with "Prefer email?" under it.
  - Then Keep it thriving (Care).
  - Text links: Copy design link · Start over.

### D5 · Home

**Before** (11,830 px):
1. hero
2. trust strip
3. film
4. five commitments
5. Maker band
6. **the full catalogue** (6,793 px)
7. Care
8. Purpose
9. footer

**After** (about 5,500–6,000 px, estimated):
1. **Hero:**
   - one main button
   - the "Or design your own" card
   - one proof row: Handcrafted in Mumbai · Made to order · Delivered within Mumbai
   - no 3-second wait on repeat visits
2. **Catalogue tease:**
   - 4 available pieces, with real prices and a caption naming the finish ("Indoor PETG prices")
   - "32 pieces · 23 coming soon · chambers on enquiry"
   - **View full catalogue**
3. **Maker band:** no "02"; "Price: quoted by the studio".
4. **Film**, quieter.
5. **Care**, unchanged.
6. **Principles and Purpose** merged into one quiet band, with a link to About.
7. **Footer:** a working Philosophy link and no internal notes.

**Why the screens differ:** Home answers "what is this and where do I go?", so it needs breadth, not the catalogue's depth. The cart and Review answer "am I sure?", so they need certainty labels. Plants answers "which of these?", so it needs tools in proportion to the choice.

---

## E · Cross-site design rules

*These were checked against what already works well: the 404 page, the cookie banner, `place-btn`, `.ct-notice` and the "Other ways to order" fold. The existing house rules stay: sharp 1 px rectangles, no rounded pills, no one-edge stripes.*

1. **Three button tiers.**
   - **Main:** sharp rectangle, filled at rest. *This is a visual change; see decision 2.*
   - **Secondary:** 1 px outline.
   - **Tertiary:** underlined small-caps text link.
   - One main button per section or step. The round hero button is the single exception.
2. **"Selected" has three looks, one per meaning.**
   - Underline for picking one view of the same content: tabs, nav, place, Journal filters.
   - Filled for choices that change what you buy: size, material, Maker options.
   - Filled icon for on/off: Save.
   - Always announced to screen readers. Never the same as hover.
3. **A price always says what it's for and how firm it is:** exact, guide, or to quote. The qualifier is the same size as the number. "Estimate so far" stays the label until the studio confirms.
4. **Status before action.**
   - Orderable → Add to cart.
   - Coming soon → Register interest.
   - Research → Write in.
   - Lead time and Care appear only for orderable pieces.
   - One status signal per card or line.
5. **Tools in proportion.** No search, filters, map or wizard for 8 or fewer items; just show the items.
6. **Disclosure** uses the existing fold pattern, with a clear label and a 44 px header, and only for secondary routes and details. It's never used for price, availability or quote notes. No folds inside folds.
7. **Each question has one home.** It's asked and edited in one place. Every answer collected is either used or sent.
8. **Every send screen says what happens next:** who replies, what they confirm, when money moves. After sending, the main button moves on; it never repeats the same send.
9. **Small labels:** three sizes only, and nothing under about 10 px. Decision-critical facts, like compatibility, use body-size text, not small caps.
10. **Notices** use the full-border `.ct-notice` box: one plain sentence plus an action.
11. **Helper text** is one line in the body font, muted, right under the control it explains. It's spoken when it changes, as `place-note` already is.
12. **Plain names first, house names second.** "Dark plants (ferns, mosses)", not "Bite". "Price", not "Disposition".
13. **Access basics:**
    - 44 px touch areas, even when the drawn shape is smaller.
    - Selection changes spoken through one fixed spoken-update line.
    - After removing something, focus moves to its neighbour.
    - Anything drawn by script must reveal itself; that's the lesson of C-01.
14. **Shared state is never silently overwritten,** whether by a shared link, `?box=` or a recipe.

---

## F · Implementation plan

Changes are targeted, not a rewrite. Each phase ships on its own PR with the standing checks: `npm test`, Playwright on desktop, phone and tablet, a11y, visual, contrast, Lighthouse, and the QA docs.

**Phase 0 · bug fixes with no design change.** Recommended now; about one session.
- **C-01:** Journal and About visibility, plus a test that nothing stays invisible.
- **S-01:** coming-soon pieces can't be ordered.
- **S-03:** a sent cart can't be sent twice by accident.
- **S-06:** suggestion labels.
- **M-01 / M-02 / M-19 / M-20:** share links.
- **M-03 / M-04:** spoken updates and focus.
- **C-03:** hero delay. **C-04:** mobile-menu focus. **C-05:** dead link. **C-08:** heading levels. **C-18:** reduced motion.

*Risk:* the cart tests, the Maker share-link journey, and the reveal order the Catalogue relies on.

**Phase 1 · shared foundations.**
- Button tiers (C-13), the "selected" rules (C-16), label sizes (C-14), one badge (C-15), notice and callout boxes (C-12), and 44 px touch areas (S-15, C-19, M-17).
- *Files:* `tokens.css`, `components.css`, `typography.css`, plus small class swaps.
- *Risk:* touches every page. There are 54 uses of `.cta`, so each page needs a pass to keep only one main button per section. Visual baselines will be refreshed on purpose, and contrast re-checked.

**Phase 2 · the high-impact journeys.**
1. **Cart drawer** (S-04, 07, 08, 09, 10, 11, 19). *Files:* `cart.js`, `enquiry-form.js`, `components.css`. *Risk:* the totals tests and the data sent to the email service.
2. **Maker Plants and Review** (M-05, 06, 07, 08, 09, 13, 14). *Files:* `maker.js` panels and `maker.css`; the search itself is unchanged. *Risk:* tests that open the map or guided search must use explore mode. The `.mk-care` and cart hooks must be kept.
3. **Product page** (S-02, 05, 12, 13, 23). *Files:* `render-product-detail.js`, `product-detail.css`. *Risk:* the skip link and the earlier phone-button fix.

**Phase 3 · the rest.**
- **Home:** C-02, 06, 09, 10, 11.
- **Catalogue:** S-16, 17, 18, 27, 28.
- **Chamber and Foundation:** M-15, 16.
- **Your space:** M-11, 12.
- **Care:** S-20, 21, 24, 30.
- **Journal:** C-07, 17.
- **Resume:** M-18.
- **All the P3 polish.**

**Phase 4 · validation and handover.** Before/after screenshots per screen, the QA run report, and a short "what changed / what was left alone" note.

---

## Decisions

**For you:**
1. **Fix the live Journal/About bug now?** Recommended: yes. It's a one-line cause plus a test, separate from the redesign.
2. **Main buttons filled at rest?** Today every button is an outline. Filled makes the one main action obvious, but it's the most visible style change on the site.
   - *Budget option:* keep outlines and just remove extra main buttons.
3. **Home: 4 pieces instead of the full catalogue?** Recommended: yes.
4. **Maker Plants: the simple mode for chambers where 8 or fewer plants fit?** Recommended: yes.

**For Aayush** (added to `AAYUSH-QUESTIONS.md` only when you say so):
- **Size dimensions** for pieces with sizes (S-14).
- **Reviews:** Q11, already asked. It decides C-06 and S-22.
- **"50+ pieces delivered":** is it true?
- **Footer wording:** Q5, already asked. It decides C-11.
