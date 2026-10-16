# SEO, GEO and AEO audit

*16 Oct 2026. This follows the owner's brief (`earthbox_seo_geo_aeo_claude_brief.md`, sections 1–8 and Phase 1). It was read-only: it covered the live site (www.earthbox.in) and the code. It builds on `2026-10-13_seo-aeo-geo-catchup.md`.*

**TL;DR:** ***Search engines can reach and read the site well, and the "₹[object Object]" price bug is long gone. It was real from May to 10 October and was fixed in `ba8ab83`; none of the 73 live pages show it now. The real gaps are about trust and content, not code:***
- ***unconfirmed reviews marked "Verified Purchase"***
- ***wrong plant facts in 4 articles***
- ***articles that never link to anything EarthBox sells***
- ***delivery times the owner hasn't confirmed***
- ***a name clash with the US company EarthBox®: searching "EarthBox" shows only them***

*Plain terms: **SEO** is being found on Google. **AEO** is being the answer that ChatGPT, Perplexity and Google's AI summaries quote. **GEO** is the same idea for AI-written answers in general, plus showing up clearly as one business.*

## Scores, from evidence

| Area | Score | Confidence | Why |
|---|---|---|---|
| Technical SEO | **82** | Moderate | Clean redirects and canonicals, accurate sitemap, Lighthouse SEO 1.00 on 5 page types, product pages readable without JavaScript |
| On-page and commercial | **55** | Moderate | Titles carry only the brand ("EarthBox — Care"); articles never link to products; "By enquiry only" contradicts the cart |
| AEO | **50** | Low–moderate | 11 of 23 articles open with a direct answer; factual errors in 4 of the 7 read closely; FAQ markup valid and visible |
| GEO | **50** | Low | Name, address and phone are consistent, but the business is described in different ways and its name clashes with another brand; no outside mentions found |
| Search performance, AI visibility, real-user speed | **Not assessed** | — | No Search Console, AI platforms or field data available |

## What was checked and is fine

| Check | Result |
|---|---|
| **The "₹[object Object]" price** | Not on any live page. Checked raw HTML, the page after scripts run, JSON-LD, `llms.txt` and the sitemap. `git log -S` puts the bug from the first commit (8 May) to `ba8ab83` (10 Oct). A search snippet still showing it is out of date; asking Google to recrawl `/products` clears it. |
| **`/products` vs `/products.html`** | No duplicates. Every `.html` and trailing-slash version gives one 308 redirect to the clean address. The bare domain and http go to `https://www.` |
| **Sitemap and robots.txt** | 73 addresses, all 200, all indexable, each its own canonical. Nothing important is marked "don't index". The old `/product` shell is correctly excluded. |
| **Structured data (schema)** | All JSON-LD blocks on all 73 pages parse correctly. The 9 product prices match `data/` exactly. Reviews are kept out of the schema, which is correct. |
| **Page speed (lab, phone)** | Home 0.99 · product 0.96 · catalogue 0.98 · article 1.00. **The Maker scores 0.67.** It spends 26.6 s busy, mostly running the 3D view in software, which the test exaggerates. |
| **Phone layout** | All 73 pages at 390 px: no sideways scroll, no script errors, no "undefined" or "NaN" in the text. |

## Findings

**P0: fix before anything else**
- **Reviews.** The product pages show reviews with a "Verified Purchase" badge (`data/reviews.js`: 12 reviews, 11 marked verified). Whether they're real is still Aayush's question 11. If they aren't real, this breaks India's rules on fake reviews.
  - **Fix now, no owner input needed:** hide the badge.
  - **The owner's call:** whether the reviews themselves stay.

**P1: high**
1. **Wrong facts in the Journal** (`data/article-bodies/`):
   - **The "native Indian" plants article** lists species that aren't native: the three named Selaginella, *Peperomia pellucida*, *Pilea cadierei* and *Ficus pumila*. It also calls *Ficus pumila* "Indian fig".
   - **The supplies article** suggests collecting moss in Sanjay Gandhi National Park and at Aarey. The park is a protected area, and another of our own articles says not to collect from protected areas.
   - **The soil guide contradicts itself.** Its summary says "equal parts potting soil, perlite, bark", but the body gives a coir recipe and also says plain potting mix "will kill most terrariums". It also claims charcoal "provides trace minerals", which has no support.
   - **The open-vs-closed article** advises an open terrarium for dry climates, which is backwards.
   - **The PLA-vs-ABS article** says ABS and ASA are "food-safe… certified". In general they aren't, and nothing backs the certification claim. It also says ABS is what we mostly use, but PETG is the shop's default.
2. **Delivery times published as fact.** "Made to order · ~1 week" appears on the product pages, the cart, the product text for crawlers and `llms.txt`, but Aayush hasn't confirmed it (question 3). "We usually reply within a day" is also unconfirmed.
3. **The Journal never links to what EarthBox sells.**
   - 0 of 23 articles link to a product, the catalogue, Care or the Maker. Each article's `relatedProducts` field isn't used, and 19 of 23 point at product codes that don't exist.
   - The catalogue, home and Journal index have no product or article links in their raw HTML, so crawlers that don't run JavaScript only find pages through the sitemap.
4. **Mixed messages about what EarthBox is.**
   - The footer says "By enquiry only", but there's a cart.
   - About says "3D-printed terrariums", but the terrariums are glass.
   - `llms.txt` says it "makes closed terrariums", but all 10 chambers are coming soon.
   - Searching "EarthBox terrarium" or "earthbox.in" returned only EarthBox® (USA, since 1994).
5. **A broken image.** The Bird Feeder photo (`/assets/v1/bird-feeder.webp`) returns 404. It's used in the product's share card, its schema and the catalogue. This is the missing photo from Aayush's question 15.
6. **The Maker is slow to start.** See the speed table above. The fix is to start the 3D view only when it's needed.

**P2: medium**
- 68 empty "Photo: …" placeholder boxes are visible across 23 articles.
- 12 of 23 articles don't open with the direct answer, and only 2 of about 150 headings are questions.
- Article dates come before the site existed, and the "last updated" date never changes.
- The home and About pages describe the business as two separate entries in the schema, with different details. They should be one shared entry, used everywhere.
- Titles are brand-only and don't say what the page is: "EarthBox — Care" could be "Terrarium care visits in Mumbai · EarthBox". 9 article titles are over 60 characters.
- The supplies article sends readers to competitors and lists an "EarthBox Starter Kit" that doesn't exist.
- Overlapping articles: four cover watering and condensation, and three cover the layering recipe.
- The About story isn't in the raw HTML.

**P3: low**
- Product pages have 3 `<h1>` in the page code, though only 1 is visible.
- Some old addresses take 2–3 redirect hops.
- Care and Privacy have no share-card tags.
- All articles share one share image (bead site-13o.6).

## How people buy (analytics)

The existing GA4 events already cover:
- starting the Maker and sending a design
- the cart opening and orders sent
- form submits
- WhatsApp clicks

**Gaps:**
- no event for tapping a catalogue card
- footer phone, email and WhatsApp links aren't tracked
- the product view uses a custom name (`product_view`), not GA4's standard `view_item`, so Google's built-in shop reports can't use it
- clicks from an article to a product can't be measured, because those links don't exist

No new tools are needed.

## AI-visibility test set (to run monthly, by hand)

For each question, record:
- the date and platform
- whether EarthBox appears, and whether as a recommendation or just a mention
- whether earthbox.in is cited, and which page
- which competitors appear
- whether what's said about EarthBox is accurate

1. Where can I buy a premium terrarium in Mumbai?
2. Which studios make custom terrariums in Mumbai?
3. Which studios make custom terrariums in India?
4. What's a good plant gift for someone who loves design?
5. Who provides terrarium or indoor-plant maintenance in Mumbai?
6. Where can I design a custom terrarium online?
7. How do I care for a closed terrarium?
8. Which plants suit a closed terrarium?
9. What should I look for when buying a handcrafted terrarium?
10. Where can I buy 3D-printed planters in India?
11. What's the best moss pole for a monstera in India?
12. How often should I water a closed terrarium?
13. Why is my terrarium mouldy?
14. How do I care for a terrarium during the Mumbai monsoon?
15. What soil mix should I use for a terrarium?
16. Open vs closed terrarium: which is better for beginners?
17. PETG vs ABS vs ASA for outdoor planters?
18. What is EarthBox Mumbai?
19. Is EarthBox (earthbox.in) the same company as EarthBox USA?
20. Green Bowl vs other Mumbai terrarium makers?

**One-off search check (16 Oct, a single sample per query, run from the US):** earthbox.in didn't appear for any of these four:
- "terrarium Mumbai"
- "custom terrarium Mumbai"
- "EarthBox terrarium"
- "earthbox.in"

Competitors that did appear: The Green Bowl, Zen Gardens and Earthoholics, plus Elle Decor and The Better India features.

## Plan

**Safe to do now (no owner input):**
- hide the "Verified Purchase" badge
- correct the 4 articles
- link articles to real products and render it at build time
- add product and article links to the raw HTML of the catalogue and Journal
- one shared business entry in the schema
- clearer page titles
- a fallback image for the Bird Feeder
- one `<h1>` per page
- remove the made-up starter kit and the competitor links

**Needs Aayush:**
- are the reviews real? (question 11)
- the delivery time (question 3)
- the footer wording (question 5)
- does a Google Business Profile exist? A share.google review link on the site suggests it may.
- a one-sentence description of the business, to use everywhere

**Needs access:** Search Console and Bing Webmaster Tools (bead site-13o.2) before claiming any search results.

**Next 30 days:**
- **Week 1:** the safe fixes above, plus Search Console and a recrawl request.
- **Week 2:** confirmed delivery wording, and the business description everywhere.
- **Week 3:** direct-answer openings, real dates, real photos.
- **Week 4:** Maker speed, then the first run of the AI test set.

*Evidence (crawl data, schema dump, raw HTML, Lighthouse reports) was saved in the session scratchpad. Not run: schema.org and Google Rich Results validators, Search Console, and the AI platforms.*
