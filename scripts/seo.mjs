#!/usr/bin/env node
/**
 * seo.mjs — everything search and answer engines read, generated from data/.
 *
 * WHY: since the 28 Sep audit the site grew Care and 41 product
 * pages, but the sitemap, schema and crawler files were hand-kept and fell
 * behind. Product pages were one URL (/product#SKU): crawlers saw an empty
 * "Loading…" shell, so no piece could be found or cited on its own.
 *
 * Writes:
 *  · product/<SKU>.html — one real page per piece (from product.html): its own
 *    title, description, canonical, social card, Product schema, and the facts
 *    as text for crawlers that don't run JavaScript. The page script still
 *    renders the full layout over it, as on the Journal.
 *  · sitemap.xml, llms.txt (the plain-text map AI assistants read)
 *  · schema in products.html (ItemList), blog.html (Blog), care.html (Service)
 *
 * Run: npm run seo (part of npm run build).  Check: node scripts/seo.mjs --check
 * (part of npm test) — fails if any of these is out of date.
 */
import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, EMAIL, PHONE, PHONE_DISPLAY, ADDRESS, NAV } from '../data/site.js';
import { articles } from '../data/articles.js';
import { categories } from '../data/volume-one.js';
import { kits, visit, coverage } from '../data/care.js';
import { allProducts, productMeta } from './product-meta.js';
import { esc, rupees } from './util.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
/** @type {Map<string, string>} */
const out = new Map();                                   // file → contents

const ld = (/** @type {object} */ o) => `<!-- seo:ld -->\n  <script type="application/ld+json">${JSON.stringify(o)}</script>\n  <!-- /seo:ld -->`;
const withLd = (/** @type {string} */ html, /** @type {object} */ o) => html.includes('<!-- seo:ld -->')
  ? html.replace(/<!-- seo:ld -->[\s\S]*?<!-- \/seo:ld -->/, () => ld(o))
  : html.replace('</head>', () => `  ${ld(o)}\n</head>`);
const attr = (/** @type {string} */ s) => esc(s).replace(/"/g, '&quot;');
const short = (/** @type {string} */ s, n = 158) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n)) + '…');
const brand = { '@type': 'Brand', name: 'EarthBox' };
// One business entity, one @id, referenced everywhere (SEO audit P2-4: the
// home and About pages described it twice, differently).
const BUSINESS_ID = `${SITE}/#business`;
const seller = { '@type': 'Organization', '@id': BUSINESS_ID, name: 'EarthBox', url: SITE };
/** @param {boolean} catalogue */
const business = (catalogue) => ({
  '@context': 'https://schema.org', '@type': 'LocalBusiness', '@id': BUSINESS_ID,
  name: 'EarthBox', alternateName: 'EarthBox Mumbai', url: SITE,
  description: 'Mumbai-based studio making terrariums and 3D-printed plant accessories as design objects, with plant care.',
  image: `${SITE}/assets/logo.webp`, logo: `${SITE}/assets/logo.webp`,
  founder: { '@type': 'Person', name: 'Aayush Lilani', sameAs: ['https://www.linkedin.com/in/aayush-lilani-13a329292/'] },
  address: { '@type': 'PostalAddress', streetAddress: 'Kandivali', addressLocality: 'Mumbai', addressRegion: 'Maharashtra', postalCode: '400101', addressCountry: 'IN' },
  geo: { '@type': 'GeoCoordinates', latitude: 19.2047, longitude: 72.8567 },
  telephone: `+${PHONE}`, email: EMAIL,
  sameAs: ['https://www.instagram.com/earthbox_india'],
  areaServed: { '@type': 'City', name: coverage.city },
  ...(catalogue && { hasOfferCatalog: { '@type': 'OfferCatalog', name: 'EarthBox Catalogue', itemListElement: [
    { '@type': 'OfferCatalog', name: 'Volume I · 3D-printed plant accessories', url: `${SITE}/products` },
    { '@type': 'OfferCatalog', name: 'Volume II · Elemental Boxes (coming soon)', url: `${SITE}/products` },
    { '@type': 'OfferCatalog', name: 'Care · refill kits and plant-care visits', url: `${SITE}/care` }] } })
});
/** @param {string} html @param {object} o */
const withBusiness = (html, o) => html.replace(/<!-- LocalBusiness Schema -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/,
  () => `<!-- LocalBusiness Schema -->\n  <script type="application/ld+json">${JSON.stringify(o)}</script>`);

// ── Product pages ────────────────────────────────────────────────────
const products = allProducts().map(f => ({ ...f, ...productMeta(f), url: `${SITE}/product/${encodeURIComponent(f.data.sku)}` }));
/** @typedef {typeof products[number]} Product */
/** @param {Product} f */
const catName = (f) => f.kind === 'printed' ? categories.find(c => c.slug === f.data.category)?.title
  : f.kind === 'box' ? 'Elemental Boxes' : 'Digital Vivariums';
/** @param {Product} p */
const priceText = (p) => !p.available ? 'Coming soon'
  : !p.prices.length ? 'Price on enquiry'
  : `From ${rupees(Math.min(...p.prices))} · made to order, about 1 week`;

/** @param {Product} p */
function productSchema(p){
  const lo = Math.min(...p.prices), hi = Math.max(...p.prices);
  const offers = p.available && p.prices.length ? {
    ...(lo === hi ? { '@type': 'Offer', price: lo } : { '@type': 'AggregateOffer', lowPrice: lo, highPrice: hi, offerCount: p.prices.length }),
    priceCurrency: 'INR', availability: 'https://schema.org/MadeToOrder', url: p.url, seller
  } : undefined;
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Product', name: p.name, description: p.description, sku: p.data.sku, url: p.url,
      image: SITE + p.photo, brand, category: catName(p), ...(offers && { offers }) },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Catalogue', item: `${SITE}/products` },
      { '@type': 'ListItem', position: 2, name: p.name, item: p.url }] }
  ] };
}

const shell = await readFile(path.join(ROOT, 'product.html'), 'utf8');
for (const p of products) {
  const title = p.title, desc = short(p.description);
  const html = shell
    .replace(/(href|src)="(assets|styles|scripts)\//g, '$1="/$2/')          // the page lives one folder down
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*/, `$1${attr(desc)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${p.url}`)
    .replace(/(<meta name="robots" content=")[^"]*/, '$1index, follow, max-image-preview:large, max-snippet:-1')
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${p.url}`)
    .replace(/(<meta property="og:(?:title)" content=")[^"]*/, `$1${attr(title)}`)
    .replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${attr(title)}`)
    .replace(/(<meta (?:property="og|name="twitter):description" content=")[^"]*/g, `$1${attr(desc)}`)
    .replace(/(<meta property="og:image" content=")[^"]*/, `$1${SITE}${p.photo}`)
    .replace(/<span class="caption italic">Loading…<\/span>/, (m) => `${m}
    <div class="u-sr-only" data-prerendered>
      <h1>${esc(p.name)}</h1>
      <p>${esc(catName(p))} · ${esc(priceText(p))}</p>
      <p>${esc(p.description)}</p>
      <p>Made by EarthBox, a terrarium and 3D-printing studio in ${esc(ADDRESS)}. Delivery within ${esc(coverage.city)}. Order or ask on WhatsApp ${esc(PHONE_DISPLAY)}.</p>
    </div>`);
  out.set(`product/${p.data.sku}.html`, withLd(html, productSchema(p)));
}
// The bare /product shell (old #SKU links) has nothing of its own to index.
out.set('product.html', shell.replace(/(<meta name="robots" content=")[^"]*/, '$1noindex, follow'));

// ── Catalogue, Journal, Care schema ──────────────────────────────────
// The catalogue and Journal draw their cards with JavaScript. Until then
// (and for crawlers that never run it) their list hosts hold the same items
// as plain links, which the page script replaces (SEO audit P1-3).
/** @param {string} html @param {string} id @param {string} items */
const seedList = (html, id, items) => html.replace(new RegExp(`(<div id="${id}"[^>]*>)[\\s\\S]*?(</div>)`), (_, open, close) => `${open}\n        <ul class="seo-list">${items}</ul>\n      ${close}`);
/** @param {string} f @param {object} o @param {(html: string) => string} [seed] */
const edit = async (f, o, seed = (/** @type {string} */ h) => h) => out.set(f, withLd(seed(await readFile(path.join(ROOT, f), 'utf8')), o));
await edit('products.html', { '@context': 'https://schema.org', '@type': 'ItemList', name: 'EarthBox Catalogue',
  itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: p.url, name: p.name })) },
  (h) => seedList(h, 'volumeOneList', products.map(p => `<li><a href="/product/${encodeURIComponent(p.data.sku)}">${esc(p.name)}</a> · ${esc(priceText(p))}</li>`).join('')));
await edit('blog.html', { '@context': 'https://schema.org', '@type': 'Blog', name: 'EarthBox Journal', url: `${SITE}/blog`,
  publisher: seller, blogPost: articles.map(a => ({ '@type': 'BlogPosting', headline: a.title, url: `${SITE}/blog/${a.slug}`,
    datePublished: a.publishDate, author: { '@type': 'Person', name: a.author } })) },
  (h) => seedList(h, 'journalGrid', articles.map(a => `<li><a href="/blog/${a.slug}">${esc(a.title)}</a></li>`).join('')));
await edit('care.html', { '@context': 'https://schema.org', '@type': 'Service', name: 'EarthBox Care',
  serviceType: 'Terrarium and indoor plant maintenance', url: `${SITE}/care`, provider: seller,
  areaServed: { '@type': 'City', name: coverage.city },
  description: `Home visit plans (one visit, or 3, 6 or 12 months; every 2 weeks, monthly or quarterly) and refill kits matched to your plants. Each visit: ${visit.includes.join('; ').toLowerCase()}. Businesses get a quote.`,
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Refill kits', itemListElement: kits.map(k => ({ '@type': 'Offer',
    itemOffered: { '@type': 'Product', name: k.name, description: `${k.for}: ${k.contents.join(', ')}` } })) } });

for (const [f, cat] of /** @type {[string, boolean][]} */ ([['index.html', true], ['about.html', false]])) {
  const html = out.get(f) ?? await readFile(path.join(ROOT, f), 'utf8');
  out.set(f, withBusiness(html, business(cat)));
}

// ── sitemap.xml ──────────────────────────────────────────────────────
/** @type {{ loc: string, lastmod?: string }[]} */
const urls = [
  ...NAV.map(n => ({ loc: SITE + (n.href === '/' ? '/' : n.href) })),
  { loc: `${SITE}/privacy` },
  ...articles.map(a => ({ loc: `${SITE}/blog/${a.slug}`, lastmod: a.publishDate })),
  ...products.map(p => ({ loc: p.url }))
];
out.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/seo.mjs from data/ — edit the data, not this file. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`);

// ── llms.txt (llmstxt.org): what EarthBox is, in plain text, with links ──
/** @param {string} title @param {string} url @param {string} [note] */
const line = (title, url, note) => `- [${title}](${url})${note ? `: ${note}` : ''}`;
out.set('llms.txt', `# EarthBox

> EarthBox is a terrarium and 3D-printing studio in ${ADDRESS}, India. It makes closed terrariums ("Elemental Boxes"), 3D-printed planters, moss poles and plant accessories (live plant packets are coming soon), and offers Care: refill kits and plant-care visits. Delivery within ${coverage.city}. Orders and questions: WhatsApp ${PHONE_DISPLAY} or ${EMAIL}.

Prices are in Indian rupees. 3D-printed pieces are made to order (about 1 week). Pieces marked "Coming soon" can't be ordered yet.

## Pages
${line('Catalogue', `${SITE}/products`, 'every piece, with prices')}
${line('Care', `${SITE}/care`, `refill kits and visit plans for homes in ${coverage.city}; quotes for offices, cafés and hotels`)}
${line('About', `${SITE}/about`, 'the studio and its founder, Aayush Lilani')}
${line('Journal', `${SITE}/blog`, 'guides to terrarium care and plants in Mumbai')}

## Products
${products.map(p => line(p.name, p.url, `${String(catName(p))}. ${priceText(p)}. ${short(p.description, 140)}`)).join('\n')}

## Journal
${articles.map(a => line(a.title, `${SITE}/blog/${a.slug}`, a.keyAnswer)).join('\n')}

## Optional
${line('Privacy', `${SITE}/privacy`)}
`);

// ── Write, or check ──────────────────────────────────────────────────
/** @type {string[]} */
const stale = [];
const existing = (await readdir(path.join(ROOT, 'product')).catch(() => [])).map(f => `product/${f}`);
for (const f of existing) if (!out.has(f)) stale.push(f);
for (const [f, body] of out) if (await readFile(path.join(ROOT, f), 'utf8').catch(() => null) !== body) stale.push(f);
if (CHECK) {
  if (stale.length) { console.error(`seo FAILED — out of date: ${stale.join(', ')}\nRun: npm run seo`); process.exit(1); }
  console.log(`seo OK — ${products.length} product pages, ${urls.length} sitemap URLs, llms.txt`);
} else {
  for (const f of existing) if (!out.has(f)) await rm(path.join(ROOT, f));
  await mkdir(path.join(ROOT, 'product'), { recursive: true });
  for (const f of stale) if (out.has(f)) await writeFile(path.join(ROOT, f), /** @type {string} */ (out.get(f)), 'utf8');
  console.log(`seo: updated ${stale.length} file(s)`);
}
