# The Maker · build-your-own terrarium

**TL;DR:** `maker.html` lets a visitor design a terrarium (chamber → foundation → plants → their space) and **send it to the studio as an enquiry**. There is no cart, because the site sells by enquiry only. Every item shown is real EarthBox data, and nothing is priced except the chamber's published range.

Source brief: `Downloads/terrarium_maker_ux_brief_for_fable.md`. Adapted to the site, not copied.

## Where it fits

- **Role:** the hands-on front end of the "Order Your Custom One" flow (Requirements workbook, tab 06). The design itself becomes the brief Aayush quotes from.
- **Entry points:** nav "Maker" (all pages + footer) · home hero "Or design your own" · each Elemental Box page "Design yours in the Maker" (`maker.html?box=FireBox`).
- **Exit:** WhatsApp message carrying the full build + a link to it, or the existing desktop email form (Web3Forms) prefilled with the same text.

## Decisions taken (10 Oct 2026)

| Brief said | Built instead | Why |
|---|---|---|
| Add to cart → checkout | Send design on WhatsApp / email form | No cart exists; site is enquiry-only |
| Itemised prices + total | Chamber range + "plants & foundation quoted on enquiry" | 0 of 55 plants and 0 boxes have a fixed price in the workbook |
| Step 4 "Details" (stones, driftwood) | Step 4 "Your space" (room, pets/kids, maturity, mood) | No hardscape items exist; these questions come from tab 06 |
| Rounded corners, new palette | Site tokens, sharp edges | EarthBox design rules |
| Product photos in the preview | Line-drawn "specimen plate" built on the box drawings | Photos already contain plants; drawings share one chamber outline, so scale never jumps |

## How it works

| File | Owns |
|---|---|
| `data/maker.js` | Catalogue: chambers (re-exported from `upcoming.js`), 45 plants, substrates, recipes, which plant groups each chamber suits |
| `scripts/maker.js` | Rules (pure, exported) + SVG preview + panels + controller. One `build` object; every change goes through `commit()` |
| `styles/maker.css` | Page styles |
| `scripts/maker.test.mjs` | `node scripts/maker.test.mjs`: compatibility, capacity, chamber swap, share-link safety, recipes, enquiry text |

**Rules:**
- A plant fits a chamber if its elemental group matches. Lab fits every group; Spore grows mushrooms (none on the list).
- Capacity is read from the chamber's spec (`3 – 6 plants` → 6), or 5 if the spec has no number.
- Air and Aero chambers are soil-free, so the foundation step is skipped for them.
- Switching chamber keeps what still fits, names what was removed, and offers **Undo**.

**State:** the build is saved in the browser (localStorage), so a refresh doesn't lose it. The share link (`#c=…&s=…&p=…&n=…`) carries the composition only, never the "Your space" answers, and it's validated on load.

## Open gaps (need data from Aayush)

1. **Plant + soil prices.** Fill the workbook Price column, add `price` in `data/maker.js`, then sum it in `reviewPanel` / `barHTML`.
2. **More substrates.** Only SOIL-001 (Aroid Atelier) is filled. The other boxes use "Studio's choice" until then.
3. **Hardscape items** (stones, driftwood). Once they exist, add a "Details" step.
4. **Plant photos.** 2 of 45 exist, so every plant uses a line-drawn thumbnail for consistency.
5. **Data clash:** the workbook says the Aroid mix suits "Air" plants, but the Air *box* is aeroponic (soil-free). The maker follows the box spec.
6. **Availability:** Elemental chambers are "Coming soon". The maker says so above the chamber cards.
7. **Toxicity data.** Pets/children answers are passed to the studio, not used to filter (no toxicity column filled yet).

## Analytics (GA4)

`maker_start` · `maker_recipe` · `maker_send` (method whatsapp|form) · `maker_copy_link` · `maker_open_shared`
