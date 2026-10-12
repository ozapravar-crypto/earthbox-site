# EarthBox · Motion

**TL;DR:** We use the *method* from the Product Motion Director template (understand → hierarchy → asset audit → reason for every motion → QA), with an **EarthBox profile** in place of the template's dark/teal cinematic default. Motion here is slow, archival and mostly one-shot on scroll. Every section below has a short spec, and new sections get one before any code is written.

Template: `Downloads/NCERT Complete/product_motion_director_agent.md` (skill: `product-motion-director`).

---

## 1. EarthBox motion profile (overrides template §25)

| | EarthBox |
|---|---|
| Character | Quiet · archival · intentional. "Slow enough to feel placed." |
| Easing | `--ease-archival` (most things) · `--ease-rise` (text lines) · `--ease-draw` (strokes). No bounce, no overshoot. |
| Durations | `--dur-fast` .4s (hover) · `--dur-base` 1.1s (reveals) · `--dur-draw` 1.6s (strokes). Stagger 120 ms. |
| Max intensity | 2 (noticeable). Only the home hero intro goes to 3. |
| Idle | At most **one** ambient motion per viewport (e.g. a leaf shadow), opacity ≤ .15, ≥ 12s cycle. |
| Interaction | Existing `.cta` fill sweep + `magnetic`. No scale-pop or glow. |
| Lighting | Warm daylight, paper, ink. Never teal or neon. |

## 2. How the template maps to a website

| Template (app screen) | Website |
|---|---|
| Screen | Section |
| ENTER | Section scrolls into view (`.reveal` → `.in`, one-shot) |
| IDLE | Ambient CSS loop, paused for reduced motion |
| EXIT | Headings and intro lines fade as they slide under the header (scroll-linked, `motion-scroll.js`; owner brief 12 Oct 2026). Nothing else animates out. |
| Figma layers | DOM elements + files in `assets/` |
| Missing Asset Request | Same format, same rule: **don't fake artwork** |

**Extra web rules the template lacks:**
1. `prefers-reduced-motion`: every motion has an off-switch (the existing modules already do).
2. Never delay or hide the LCP element; images keep `width`/`height` (no layout shift).
3. Motion never blocks scrolling or input. The only scroll smoothing is Lenis on desktop mouse/trackpad (owner brief 12 Oct 2026); touch and keyboard stay native, and drawers/dialogs/menus scroll themselves.
4. Text stays real text; images never contain copy.

## 3. Primitives already on the site (use these, add nothing new)

| Primitive | Where | Note |
|---|---|---|
| `.reveal` / `.reveal-line` | `motion.css` + `reveal.js` | Fade-rise / line-mask rise. The default. |
| `data-parallax="0.05"` | `motion-scroll.js` | Viewport-relative drift (±strength of its height) inside a clipping frame, scaled to hide edges. Safe anywhere. On: hero photo, film, Maker-invite photo, product hero (12 Oct 2026). Replaced the old absolute-`scrollY` `parallax.js` |
| text fade in/out | `motion-scroll.js` | Scroll-linked opacity + 18px rise for `main h2`, `.lede`, intros. Never prices, buttons, forms, product page, Maker, article body. Off with reduced motion |
| smooth scroll | `motion-scroll.js` + `vendor/lenis.js` | Lenis 1.3.26, `lerp .09`, desktop fine pointer only; paused while a dialog is open |
| `.reveal-clip` | `motion.css` | ⚠️ **Deadlock:** fully clipped elements never report as intersecting, so they never reveal. Don't use until `reveal.js` observes a wrapper instead. |
| `.scramble` | `scramble.js` | Section titles only |
| `.magnetic`, cursor | `magnetic.js`, `cursor.js` | CTAs only |
| `pin` | `pin.js` | Principles list only |

## 4. Section specs (homepage, in order)

| # | Section | First thing to notice | Motion (intensity) | Status |
|---|---|---|---|---|
| 1 | Hero | The terrarium photo, then "EarthBox" | Full-bleed photo (owner-supplied, 10 Oct); after the loader the copy, side line, proof row and card fade in 2.6–3.3 s (1). No parallax | Updated 10 Oct |
| 2 | Trust strip | Proof points | None (0). It's reassurance, not a moment. | Existing |
| 3 | Film | The video | Plays muted, inline. No extra motion (0). | Existing |
| 4 | Principles | One commitment at a time | Hover highlight; title `scramble` (2) | Existing |
| 5 | Manifesto | "self-contained worlds" | `.reveal-line` stagger (2) | Existing |
| 6 | **Maker invite** | The terrarium, then the headline | See §5 | **New** |
| 7 | Catalogue tease | Products | `scramble` title + card reveals (1–2) | Existing |

Other pages: catalogue, product, about and journal use `.reveal` on blocks (1). The **Maker** uses only cause-and-effect motion (plant grows in on Add, layers fade in on foundation), and is specified in `MAKER.md`.

## 5. SCREEN MOTION SPEC · Maker invite (`#maker-invite`)

**Understanding.** Type: CONTENT / invitation. State: ENTERING on scroll. Visitors arrive from the manifesto ("creating self-contained worlds") and should feel *I could make one*, then press **Start creating**.

**Hierarchy.** 1 Terrarium · 2 "Build your little world" · 3 lede · 4 Start creating · 5 spec column · 6 leaf shadow.

| Layer | Role | Motion | Status |
|---|---|---|---|
| Terrarium photo | PRIMARY_SUBJECT | Fade-rise, 150 ms delay (2) | ⚠️ Stand-in crop (see request) |
| Gold dot + dotted line + disc | DECORATION | None for now: baked into the stand-in | Procedural once a cutout exists → line draws down (`--ease-draw`) |
| Headline (3 lines) | HEADLINE | `.reveal-line` stagger 0/120/240 ms (2) | Code |
| Lede, CTA | SUPPORTING / PRIMARY_ACTION | Fade-rise 400 / 520 ms (1) | Code |
| Spec column | DATA | Fade-rise 200/320/440 ms (1) | Code |
| Leaf shadow | LIGHTING | Idle sway 14s, opacity .13, blur 7px (1) | Procedural SVG |

**Idle:** leaf shadow only. **Interaction:** standard `.cta` sweep + magnetic. **Exit:** none. **Reduced motion:** everything shows instantly, no sway.
**Theme:** the section keeps the photo's own paper `#F6F3ED` in dark mode, as a deliberate light band.

```text
## MISSING ASSET REQUEST

Asset:            Maker invite: terrarium photograph
Required for:     Maker invite primary subject + its reveal
Why it is needed: Only copy is a crop from the reference mockup: 835 px (soft on
                  retina), with the dot/line/disc baked in, so they can't animate.
                  It also shows an open glass bowl and a figurine. EarthBox sells
                  Elemental chambers, and the brand rules out "gift-shop".
Expected format:  Transparent WebP/PNG (subject + slab, no background)
Expected size:    ≥ 1800 px wide
Composition:      Same three-quarter angle and slab as the reference
Visual treatment: Warm daylight from the left, soft contact shadow, no props
Must match:       An Elemental chamber (e.g. Moss or Dark), not a bowl
Priority:         HIGH
```

## 6. QA for any new section
- [ ] Spec written (hierarchy, layers, reason per motion) before code
- [ ] No copy, layout or artwork changed by the motion
- [ ] Missing artwork requested, not faked
- [ ] Intensity ≤ 2 and ≤ 1 idle motion per viewport
- [ ] Works with `prefers-reduced-motion: reduce`
- [ ] LCP not delayed, no layout shift, no `reveal-clip` / mid-page `data-parallax`
- [ ] Checked at 1440 / 375 and in dark mode
