# SEO, AEO and GEO catch-up

*13 Oct 2026. Follows `2026-09-28_pre-launch-audit.md`. Covers everything added since: Care, the Maker, 43 product pages, new Journal posts.*

**TL;DR:** ***The site had stopped telling search engines and AI assistants about most of what it sells. All 43 pieces shared one empty address, `/product#…`, so Google, ChatGPT and Perplexity saw "Loading…" and nothing else. Each piece now has its own page. The sitemap, the schema and a new `llms.txt` are now generated from the site's data on every build, so they can't fall behind again. What's left mostly needs Aayush, and the biggest item is a Google Business Profile.***

*SEO = being found on Google. AEO = being the answer quoted by ChatGPT, Perplexity and Google's AI answers. GEO = generative-engine optimisation, the same idea for AI-written answers. It also covers showing up for "near me / in Mumbai" searches.*

## What was behind (found 13 Oct)

| Gap | Effect |
|---|---|
| Every product was `/product#CODE`, a single URL | 0 of 43 pieces could be indexed or cited on their own. Crawlers saw a "Loading…" shell |
| Sitemap was hand-written | It was missing `/care`, `/privacy` and every product; it listed the empty `/product` shell |
| No `llms.txt` | Open item from the 28 Sep audit |
| No schema on the Catalogue, Journal index or Care | No product list, article list or service for engines to read |
| Homepage business schema | Didn't mention Care or the Maker |
| The 404 page used relative paths | Any bad deep link, e.g. `/blog/typo`, showed an unstyled page |
| Cart images used relative paths | Broke on Journal pages, which live one folder down |

## What was done

- **A page per piece: `/product/<CODE>`**, e.g. `/product/V1-PLT-005`. All 43 pages are built by `scripts/seo.mjs` from `product.html`. Each one has:
  - its own title, description, canonical link and social card with the piece's photo
  - `Product` schema; the price is included only for pieces you can order today, as made to order, and is never invented for "coming soon" pieces
  - a breadcrumb
  - the facts as plain text, so crawlers that don't run JavaScript can read them
- **All links on the site now use the new addresses:** the Catalogue, the cart, the "goes with" suggestions and related pieces. Old `/product#CODE` links still work. The bare `/product` shell is now marked "don't index".
- **`sitemap.xml` is generated** from the data: 73 URLs (pages, 23 articles, 43 products).
- **New `llms.txt`**: a plain-text summary of the studio, then every page, product (with price status) and article (with its one-line answer). This is what AI assistants read.
- **Schema:**
  - Catalogue → `ItemList` of all pieces
  - Journal → `Blog` with every post
  - Care → `Service` (Mumbai, what a visit includes, the refill kits)
  - Homepage business entry → now lists Care and the Maker
- **Fixes:** the 404 page and cart images now work at any folder depth.
- **The data also had a bug:** an Elemental Box's description is several paragraphs, and the page's share description was showing them run together with commas. Fixed.
- **Guards:**
  - `npm test` fails if any generated file is out of date (`node scripts/seo.mjs --check`).
  - A smoke test checks that a product page has its name, canonical and `Product` schema without JavaScript, that an unknown piece gives a real 404, and that Catalogue cards link to the new addresses.
  - Lighthouse (SEO ≥ 0.9 is a release gate) now checks a real product page and Care.

**Checked and already fine:** the apex `earthbox.in` now redirects permanently (308), which closes R10. `robots.txt` already welcomes the AI crawlers.

## What's left

**Needs Aayush. All free, and the biggest wins:**
1. **Google Business Profile: "EarthBox, Kandivali".** This matters most for "terrarium Mumbai" searches and for map answers in AI tools. It needs his phone and a postcard or video check.
2. **Google Search Console + Bing Webmaster Tools**, then submit the sitemap. Bing's index feeds ChatGPT search and Copilot. Verification is a DNS record, which we can add in Vercel once `vercel login` is redone.
3. **Real reviews.** Are the reviews in `data/reviews.js` from real customers? They're shown on product pages but deliberately **not** put into schema. Google penalises made-up review markup, and India's consumer rules on fake reviews (2023 standard) apply. If they're samples, they should come off the site; real ones can go back into the schema.
4. **Answers for visible FAQs** on Care and the product pages: how long a visit takes, which areas are covered, kit prices, delivery time. Answer engines quote question-and-answer text, but only answers he confirms should go up.

**Later (small):**
- Each Journal article still shares one social image (open since 28 Sep).
- IndexNow (instant Bing updates): worth it after Bing Webmaster Tools is set up.
- Old `/product#CODE` links could redirect in the browser to the new address. Search engines already get the right URLs from the sitemap and links, so this can wait.
