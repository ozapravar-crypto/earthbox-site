# Pre-Launch Audit: earthbox.in

**Stack:** hand-built static HTML + ES modules on Vercel (no framework, no backend) · client-side rendering for articles and products
**Date:** 2026-09-28
**URLs analysed:** 35 repo pages, all checked against production · sitemap 31
**Tools used:** bash (curl, openssl, grep), headless Chromium (raw-vs-rendered DOM diff), local repo + git
**Not available:** Screaming Frog MCP, DataForSEO, Chrome DevTools MCP, `dig`

---

## Top 5 Issues

1. **26 of 35 pages are invisible to every AI crawler.** All 23 Journal articles and 3 catalogue pages are 100% client-side rendered. Raw HTML is 525 characters of navigation with zero `<h1>`. GPTBot, ClaudeBot, PerplexityBot and CCBot do not execute JavaScript — they see the nav and nothing else.
2. **Canonicals and the sitemap point at the wrong hostname.** The site serves `www.earthbox.in` (307 from the apex), but every canonical and all 31 sitemap URLs say `earthbox.in`. The site is telling crawlers its real address is the one that redirects away.
3. **No security headers at all**, apart from a bare HSTS without `includeSubDomains`. No CSP, no `X-Frame-Options`, no `nosniff`, no referrer or permissions policy. This site takes enquiries.
4. **No Product schema anywhere on a commerce site.** Only a single `LocalBusiness` block on the homepage. No product, price, availability or review markup on any catalogue page.
5. **26 of 35 pages have no canonical, no Open Graph tags and no structured data at all.** Every Journal article shares no preview image and cannot be previewed when shared.

---

## Launch Blockers (P0)

### P0-1 · The entire content library is invisible to AI crawlers

**Finding.** Measured directly by diffing raw against rendered DOM on `blog/anatomy-earthbox-cradle.html`:

| | Raw HTML (no JS) | Rendered (JS executed) |
|---|---|---|
| Bytes | 5,262 | 17,899 |
| Visible text | **525 chars** | 6,169 chars |
| `<h1>` | **0** | 1 |
| `<h2>` | **0** | 10 |
| `<p>` | 2 | 32 |

The 525 characters are the header, nav and footer. Article bodies live in `data/article-bodies/*.js` and are injected by `scripts/render-article.js` at runtime.

**Business impact.** Google renders JavaScript and will mostly cope. **AI crawlers do not.** GPTBot, ClaudeBot, PerplexityBot and CCBot fetch raw HTML only. So does the user-action category — ChatGPT-User, Claude-User, Perplexity-User — which is what fires when a customer pastes an EarthBox link into a chat and asks "is this any good?"

The Journal is the entire content play: 23 articles on terrarium care, plant selection and 3D printing. It is the only thing on the site an answer engine would ever cite. Right now none of it exists outside a browser.

**Fix.** Pre-render the article bodies into the HTML at build time. The data is already static JavaScript objects, so this is a build step, not a re-architecture:

```js
// scripts/prerender.js — run before deploy
// for each blog/*.html: import its body from data/article-bodies/,
// inject the rendered markup into the container the client script targets,
// and leave the client script in place (it will simply find content already there)
```

Keep the scramble animation — it can still run over text that is already in the DOM.

**Verification.**
```bash
curl -s https://www.earthbox.in/blog/anatomy-earthbox-cradle.html | grep -c '<h1'   # expect 1, currently 0
```

### P0-2 · Canonicals and sitemap advertise the non-canonical host

**Finding.** `https://earthbox.in/` returns `307 → https://www.earthbox.in/`. Yet:
- The homepage canonical is `<link rel="canonical" href="https://earthbox.in/" />`
- All **31** sitemap URLs use `https://earthbox.in/`
- `robots.txt` points at `Sitemap: https://earthbox.in/sitemap.xml`

**Business impact.** Every sitemap entry costs a redirect hop before a crawler reaches real content, and the canonical nominates a URL that immediately redirects elsewhere. Search engines resolve this, but it is a self-inflicted signal conflict, and AI citation is URL-based — redirects break attribution.

**Fix.** Pick one host and use it everywhere. The server already prefers `www`, so make everything match:
```bash
# canonicals across all pages
grep -rl 'https://earthbox.in' --include="*.html" . | xargs sed -i 's|https://earthbox\.in|https://www.earthbox.in|g'
# regenerate the sitemap, and update robots.txt
```
Alternatively flip the Vercel redirect to prefer the apex. Either is fine; the current split is not.

---

## Fix Within 24h (P1)

### P1-1 · No security headers

**Finding.** Only `strict-transport-security: max-age=63072000` — without `includeSubDomains`. Missing: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`.

**Business impact.** The site collects enquiries. Without `X-Frame-Options`/`frame-ancestors` it can be framed for clickjacking; without `nosniff` a mistyped content-type becomes an execution vector.

**Fix.** Create `vercel.json` (the project has none):
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      {"key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains"},
      {"key": "X-Frame-Options", "value": "DENY"},
      {"key": "X-Content-Type-Options", "value": "nosniff"},
      {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
      {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
      {"key": "Cross-Origin-Opener-Policy", "value": "same-origin"},
      {"key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.google-analytics.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://api.web3forms.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"}
    ]
  }]
}
```
The `connect-src` entry for `api.web3forms.com` is required or the enquiry form breaks. Test the form after deploying.

### P1-2 · 26 of 35 pages have no canonical, Open Graph or structured data

**Finding.** Coverage by template:

| Template | Pages | Canonical | og:image | JSON-LD |
|---|---:|---:|---:|---:|
| Top-level (index, products, product, about, blog) | 5 | 5 | 5 | 2 |
| `catalogue/*.html` | 3 | **0** | **0** | **0** |
| `blog/*.html` | 23 | **0** | **0** | **0** |

The five top-level pages were done properly. Everything below them was not.

**Business impact.** Every Journal article shared to WhatsApp or Instagram renders as a bare link with no image. For a visual product — terrariums — that is the worst possible failure mode.

**Fix.** Add to each article and catalogue page: a self-referencing canonical, `og:title`, `og:description`, `og:image` (the article's own hero), `twitter:card`, and an `Article` JSON-LD block with `datePublished`/`dateModified`. Article metadata already exists in `data/articles.js`, so the same prerender step in P0-1 can emit these.

### P1-3 · No Product schema on a shop

**Finding.** Zero pages carry `"@type": "Product"`. The homepage has one `LocalBusiness` block.

**Business impact.** No rich results, no price or availability in search, and nothing for an answer engine to quote when asked "what does an EarthBox terrarium cost?"

**Fix.** Emit `Product` with `name`, `image`, `description`, `brand`, and an `Offers` node with `priceCurrency: "INR"`, `price`, `availability` and `url` on every catalogue and product page. Only publish prices that are actually shown on the page.

---

## Post-Launch Backlog (P2/P3)

- **`debug.html` is live and returns 200** — and `robots.txt` names it in a `Disallow`, which advertises its existence to anyone reading the file. It dumps article JSON to the page. Delete it from the deploy (`.vercelignore`) rather than disallowing it.
- **No `llms.txt`.** Given the Journal is the citable asset, this is worth adding once P0-1 makes the articles readable. Not before — an llms.txt pointing at pages with no content is worse than none.
- **16 stylesheets on the homepage.** Small individually, but 16 round trips. Concatenate at build.
- **Neither homepage image is lazy-loaded** (both do carry `width`/`height`, so no CLS risk).
- **No `max-image-preview:large`** — needed for image eligibility in AI Overviews and Discover.
- **No IndexNow.**

---

## What's Already Good

- **No deploy gap.** All 35 repo pages return 200 in production, and the working tree is clean with nothing unpushed. (Platinova's audit found the opposite.)
- **No secrets exposed.** A sweep for API keys, JWTs, AWS credentials and hardcoded passwords came back empty. The Web3Forms access key is public by design.
- **Fast.** TTFB 0.159s, Brotli on HTML, 22KB homepage, Vercel edge cache hitting.
- **robots.txt allows everything** and carries a `Sitemap:` directive. No bot blocking, no Cloudflare in front, no cloaking — browser, Googlebot, GPTBot, ClaudeBot and PerplexityBot all get identical 200s.
- **Sitemap carries `lastmod` on all 31 URLs.**
- **The five top-level pages are properly built** — canonical, Open Graph, and `LocalBusiness` schema on the homepage and About.
- **Images carry `width` and `height`**, so no layout shift.
- **The scramble text animation is intentional**, not a rendering bug — `scramble()` is defined in `scripts/main.js`.

---

## The one-line verdict

EarthBox is well built, fast, clean and correctly deployed — and its entire reason to be found is switched off, because the 23 articles that would earn the traffic do not exist until JavaScript runs.

Fix the prerender and the hostname split. Everything else on this list is smaller than those two.

---

# Addendum — fixes applied, same day

## Fixed

**P0-1 · Prerender.** `scripts/prerender.mjs` bakes the article head, body, FAQ and
related-articles markup into `blog/*.html` at build time, running the same logic as
`render-article.js`. Measured on `anatomy-earthbox-cradle.html`:

| | Before | After |
|---|---:|---:|
| Visible text without JS | 525 | **6,108** |
| `<h1>` | 0 | 1 |
| `<h2>` | 0 | 10 |
| JSON-LD blocks | 0 | 2 |

Average across all 23 articles: **6,714 characters** of readable text with JavaScript
disabled. Every page now carries a unique `<title>`, canonical, Open Graph set,
`Article` schema and `FAQPage` schema in the source.

The client script still runs and re-renders over the top, so the scramble animation and
every interaction are untouched. Two guards were needed to make that safe:
`injectSchema()` now returns early when it sees a `data-prerendered` block (otherwise
every page carried two identical `Article` nodes), and both the build and the client
stop appending `| EarthBox` to a title that already contains it.

**P0-2 · Hostname.** Everything now uses `https://www.earthbox.in` — canonicals,
`og:url`, sitemap (28 URLs), `robots.txt`, and the URL builders inside
`render-article.js`. Zero non-www references remain outside the audit file itself.

**P1-1 · Security headers.** `vercel.json` created (the project had none) with HSTS +
`includeSubDomains`, CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`, COOP, and a one-year immutable cache on `/assets/*`. The CSP
allows `https://api.web3forms.com` in both `connect-src` and `form-action` — **test the
enquiry form after deploying**, that is the one thing a CSP can silently break.

**Every `og:image` on the site was a 404.** Not in the original audit — found while
fixing P1-2. `og-home.jpg`, `og-journal.jpg`, `og-catalogue.jpg` and `og-about.jpg` were
referenced everywhere and had never been generated from the templates in
`assets/og-templates/`. All four rendered at 1200×630 from those templates and committed.
An `og-journal.html` template was created, since only three existed.

**P2 · `debug.html`** removed from the deploy via `.vercelignore`, and the `robots.txt`
`Disallow` that advertised it removed with it. `robots.txt` also gained explicit allows
for all major AI crawlers, and `max-image-preview:large` was added to the 8 pages that
lacked a robots meta.

## Corrected from the original audit

**The 3 `catalogue/*.html` pages are dead, not under-optimised.** The original report
recommended adding `Product` schema to them. On inspection they have **zero inbound
links** anywhere in the site, and their `#categoryList` container has **no renderer at
all** — nothing in `scripts/` targets that id, so it renders "02" and nothing else. They
were superseded by the single-page `products.html` with its volume pills.

Adding schema to permanently empty pages would have been worse than useless. They are
now 308-redirected to `/products.html`, removed from the sitemap (31 → 28 URLs) and
excluded from the deploy. The files stay in the repo.

## Still open

- **P1-3 · `Product` schema** — belongs on `products.html`, which actually renders the
  32 SKUs. Prices are enquiry-only, so any `Offer` node must omit price rather than
  invent one.
- **Per-article `og:image`** — all 23 articles now share `og-journal.jpg` because no
  article has a `featuredImage` and no per-article art exists. A real image, but a
  shared one.
- **16 stylesheets** on the homepage, still unconcatenated.
- **No `llms.txt`** — now worth adding, since the Journal is finally readable.
- **No IndexNow.**

## The guard

`npm run build` = prerender + check. `scripts/check-prerender.mjs` fails the build if any
article page lacks an `<h1>`, a canonical, JSON-LD, an `og:image`, or has under 1,000
characters of text without JavaScript. Nav and footer alone are ~525, so that threshold
catches exactly the failure this audit found. `npm test` runs the same check.
