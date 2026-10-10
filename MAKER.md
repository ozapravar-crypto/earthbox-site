# The Maker · build-your-own terrarium

**TL;DR:** `maker.html` lets a visitor design a terrarium (chamber → foundation → plants → their space), then **add it to the cart** (tallied with anything else, see `CART.md`) or send it alone as an enquiry. Every item shown is real EarthBox data, and nothing is priced except the chamber's published range.

Source brief: `Downloads/terrarium_maker_ux_brief_for_fable.md`. Adapted to the site, not copied.

## Where it fits

- **Role:** the hands-on front end of the "Order Your Custom One" flow (Requirements workbook, tab 06). The design itself becomes the brief Aayush quotes from.
- **Entry points:** nav "Maker" (all pages + footer) · home hero "Or design your own" · each Elemental Box page "Design yours in the Maker" (`maker.html?box=FireBox`).
- **Exit:** Add to cart / Save (cart.js), or a WhatsApp message carrying the full build + a link to it, or the desktop email form (Web3Forms) prefilled with the same text.

## Decisions taken (10 Oct 2026)

| Brief said | Built instead | Why |
|---|---|---|
| Add to cart → checkout | Add to cart (10 Oct) → order sent to the studio, which replies with a payment link | No payment gateway yet; see CART.md |
| Itemised prices + total | Chamber range + "plants & foundation quoted on enquiry" | 0 of 55 plants and 0 boxes have a fixed price in the workbook |
| Step 4 "Details" (stones, driftwood) | Step 4 "Your space" (room, pets/kids, maturity, mood) | No hardscape items exist; these questions come from tab 06 |
| Rounded corners, new palette | Site tokens, sharp edges | EarthBox design rules |
| Product photos in the preview | Line-drawn "specimen plate" built on the box drawings | Photos already contain plants; drawings share one chamber outline, so scale never jumps |

## How it works

| File | Owns |
|---|---|
| `data/maker.js` | Catalogue: chambers (re-exported from `upcoming.js`), 45 plants, substrates, recipes, which plant groups each chamber suits |
| `scripts/build-codec.js` | What a build *is*: shape, lookups, capacity, share-link codec (pure). Shared with the cart; re-exported by maker.js |
| `scripts/maker.js` | Rules (pure, exported) + SVG preview + panels + controller. One `build` object; every change goes through `commit()`. Loaded only on maker.html |
| `styles/maker.css` | Page styles |
| `scripts/plant-search.js` | Discovery rules (search, filters, guided, relax) · `node scripts/plant-search.test.mjs` |
| `scripts/maker.test.mjs` | `node scripts/maker.test.mjs`: compatibility, capacity, chamber swap, share-link safety, recipes, enquiry text |

**Rules:**
- A plant fits a chamber if its elemental group matches. Lab fits every group; Spore grows mushrooms (none on the list).
- Capacity is read from the chamber's spec (`3 – 6 plants` → 6), or 5 if the spec has no number.
- Air and Aero chambers are soil-free, so the foundation step is skipped for them.
- Switching chamber keeps what still fits, names what was removed, and offers **Undo**.

**State:** the build is saved in the browser (localStorage), so a refresh doesn't lose it. The share link (`#c=…&s=…&p=…&n=…`) carries the composition only, never the "Your space" answers, and it's validated on load.

## Plants step: discovery (added 10 Oct 2026)

Search, **List / Map** views and **Guided search** live inside the Plants step, not on a separate page, so there's one flow and one `build`.

| Piece | Where | Does |
|---|---|---|
| Rules | `scripts/plant-search.js` (+ `.test.mjs`) | `searchPlants(state, ctx)` → results, chips, "loosen one" list. List, map and guided all read this one output |
| Taxonomy | `data/maker.js` → `forms`, `guide` | Shape labels; what each guided answer acts on |
| UI | `scripts/maker.js` (plants panel + `<dialog id="mkGuide">`) | Search box, Guided search button, view toggle, Filter & sort, chips |

- **Search** matches name, botanical name, plant group and the list's own group wording ("low light", "carnivorous"), plus shape. It ignores case, accents and extra spaces, and every word must match.
- **Filters:** plant group, shape, and "fits my chamber" (on by default). Chips of the same kind widen the results (Fern *or* Moss); different kinds narrow them.
- **Map view:** the nine plant groups as regions, ordered driest → most humid by their chamber's humidity spec. Same results as the list, drawn as specimens per climate. Earth plants have no chamber of their own (Lab only), so they sit last. *Not* a geographic map: there's no origin data.
- **Guided search:** five questions in a native `<dialog>` (full-screen on phones).

  | Question | Acts on | Effect |
  |---|---|---|
  | World (look) | plant groups | filter |
  | Where it lives | `build.space.room` (same as the Your space step) | goes into the enquiry only |
  | Light | group heading (Dark = low light, Fire = high light) | reorders only, because every chamber has its own grow light |
  | Care | `build.space.care` | goes into the enquiry only (no care ratings exist yet) |
  | What plants add | shapes | filter |

  Reopening the dialog shows the previous answers. Closing it changes nothing. No matches shows "Remove X · N plants" for each chip.
- **Other climates:** a plant outside your chamber shows "Use <chamber>". That switches chamber (keeping what fits, with Undo) and adds the plant. If the new chamber needs a foundation, it goes there first.
- **Saved:** search, filters, view and guided answers are saved with the build (validated on load).

**Look → groups is a studio guess for Aayush to confirm.** It's built from the group headings and the recipes: Woodland = Moss/Frost/Water, Minimal = Fire/Aero, Tropical = Earth/Air/Dark, Colourful = Earth/Dark. Shapes (`form`) were also assigned per species by us, not taken from the workbook.

## Open gaps (need data from Aayush)

1. **Plant + soil prices.** Fill the workbook Price column, add `price` in `data/maker.js`, then sum it in `reviewPanel` / `barHTML`.
2. **More substrates.** Only SOIL-001 (Aroid Atelier) is filled. The other boxes use "Studio's choice" until then.
3. **Hardscape items** (stones, driftwood). Once they exist, add a "Details" step.
4. **Plant photos.** 2 of 45 exist, so every plant uses a line-drawn thumbnail for consistency.
5. **Data clash:** the workbook says the Aroid mix suits "Air" plants, but the Air *box* is aeroponic (soil-free). The maker follows the box spec.
6. **Availability:** Elemental chambers are "Coming soon". The maker says so above the chamber cards.
7. **Per-plant Light, Care, Humidity, Description (tab 04, 0 of 45 filled).** Once they're filled, add the fields to the plant rows (the schema is noted in `data/maker.js`), then turn on real light/care filters in `plant-search.js`.
8. **Toxicity data.** Pets/children answers are passed to the studio, not used to filter (no toxicity column filled yet).

## Analytics (GA4)

`maker_start` · `maker_recipe` · `maker_send` (method whatsapp|form) · `maker_copy_link` · `maker_open_shared` · `maker_guided_open` · `maker_guided_apply`
