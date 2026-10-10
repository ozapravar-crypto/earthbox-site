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
| (10 Oct) Illustrated preview | Low-poly 3D preview, thumbnails and recipe stills; line drawings kept as the fallback | Owner asked for the whole maker in low-poly 3D, not illustration |

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

## 3D preview (added 10 Oct 2026)

| Piece | Where | Does |
|---|---|---|
| Scene + builders | `scripts/maker-3d.js` | Chamber (the SVG's chamfered octagon, extruded; depth from the chamber's `size`), foundation layers, plant models + one procedural plant builder per `form`, light rig, render loop, drag/arrow-key turning |
| Plant models | `assets/plants3d/*.glb`, mapped in `data/maker.js` → `models` | Low-poly plants (CC0 / CC BY, see `assets/plants3d/CREDITS.md`). ~300 KB for all ten |
| Spec | `sceneSpec(b)` in `scripts/maker.js` (tested) | The only input the 3D view gets: chamber, soil-free, substrate look, plants. Same facts `previewSVG` reads |
| three.js | `scripts/vendor/three.module.min.js` r160 (MIT, see `scripts/vendor/README.md`) | Vendored: the CSP allows no script CDN. ~655 KB raw, ~165 KB gzip |

- **Loading:** maker.js checks for WebGL2, then `import('./maker-3d.js')`. No WebGL (or a lost context) = the SVG line drawings, unchanged. three.js is never downloaded on other pages, or here without WebGL.
- **One WebGL context.** Its canvas is the live view: the landing hero, then the build preview. Plant thumbnails (list + map), recipe cards and foundation swatches are drawn once with the same renderer and cached as `data:` images (CSP allows `data:`, not `blob:`).
- **Motion (MOTION.md):** one idle motion, a slow 18 s sway; a new plant grows in over 600 ms (ease-out, no overshoot); foundation layers rise in when chosen. Reduced motion = no sway, no growth, still renders on change. The loop pauses when the view is off screen or the tab is hidden; pixel ratio capped at 2.
- **Access:** the canvas is focusable, labelled with the build description, and turns with the arrow keys (Home resets) as well as drag. The "indicative" caption stays.
- **What's data and what's ours:** chamber light colour/strength comes from its `light` and `temp` specs (warm, white, UV mode…), glass fog from `humidity`. **Plant colours are inferred** from the plant group plus colour words in the plant's name ("Pink Princess", "Black Velvet"): no colour data exists. Plant shapes are low-poly models or procedural per `form`, varied per plant id; they're indicative, like the drawings were. The plinth and the soil-free mist rail/floor plate are presentation, not products.
- **Plate stays paper in dark mode**, as before, so the scene's light reads the same in both themes.

### Plant models (added 10 Oct 2026)

- **Which plant gets which model** is data: `models` in `data/maker.js`. A plant uses `models.plants[id]` if present, else `models.forms[form]`. `null` (or no entry) = the procedural plant. Options: `scale`, `yaw`, `tint: false` (keep the model's own colours).
- **Today:** heart-leaf (leaf), monstera (Monstera, Rhaphidophora, Umbrella Plant, Fatsia), pothos (trail), three succulents (rosettes), bromeliad (air), fern clump (fern), moss cushion (moss), flytrap (Venus Flytrap). **Still procedural:** sundew + both pitcher plants (no licensed models found), Java Fern + Bird's Nest Fern (strap leaves read truer procedurally).
- **Colour:** each model's greens take the plant's palette (group + name, as above), one colour per face, keeping the model's own light/dark; non-green parts (red traps, a bloom) keep theirs.
- **Loading:** `GLTFLoader` (vendored) and each `.glb` load only when a plant using them is drawn (live view, recipe stills; thumbnails once the Plants step opens). The procedural plant shows until the model arrives, then the model grows in (600 ms; instant with reduced motion). A failed file keeps the procedural plant, silently.
- **Sizing:** same `SIZE` targets and `layout()` as before. A model keeps its proportions (squeezed to 60 % at most), turns its narrow side to the nearest wall, and is drawn smaller rather than poke through the glass.
- **Add or swap a model:**
  1. Find one that is CC0 (preferred) or CC BY from its official page. No NC, editorial or unclear licences.
  2. Convert to a single-mesh `.glb` with vertex colours, no textures (the CSP blocks the `blob:` URLs embedded textures need), ≤ ~5k triangles, ≤ ~300 KB: bake the texture into vertex colours, `simplify`, `weld`, `quantize` with `@gltf-transform`. No Draco/meshopt compression (no decoder is vendored).
  3. Put it in `assets/plants3d/` under a **new** file name (`/assets` is cached for a year), add it to `models`, and add a row to `CREDITS.md`. CC BY: also name the author in the credit line on `maker.html`.
  4. `npm test` (data shape + the file exists) and `npm run test:e2e`, then look at it in the chamber at 1440 and 375.

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
4. **Plant photos.** 2 of 45 exist, so every plant uses a generated 3D thumbnail (line drawing without WebGL) for consistency.
5. **Data clash:** the workbook says the Aroid mix suits "Air" plants, but the Air *box* is aeroponic (soil-free). The maker follows the box spec.
6. **Availability:** Elemental chambers are "Coming soon". The maker says so above the chamber cards.
7. **Per-plant Light, Care, Humidity, Description (tab 04, 0 of 45 filled).** Once they're filled, add the fields to the plant rows (the schema is noted in `data/maker.js`), then turn on real light/care filters in `plant-search.js`.
8. **Toxicity data.** Pets/children answers are passed to the studio, not used to filter (no toxicity column filled yet).
9. **Plant colours** in the 3D view are inferred (group + name). A per-plant colour or photo column would replace the guess.
10. **Plant models for sundew and pitcher plants.** None with a usable licence was found (Oct 2026); they stay procedural.

## Analytics (GA4)

`maker_start` · `maker_recipe` · `maker_send` (method whatsapp|form) · `maker_copy_link` · `maker_open_shared` · `maker_guided_open` · `maker_guided_apply`
