// Run: node scripts/data.test.mjs   (part of npm test)
// The data files are the site's database. This checks their shape, so a
// typo in data/*.js fails the build instead of shipping a broken page or a
// cart line that can't be priced. Shapes are documented in README.md.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { volumeOne, categories, materials, places, priceOf } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';
import { elements, chamberElements } from '../data/elements.js';
import { articles, categories as articleCats } from '../data/articles.js';
import { NAV } from '../data/site.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/**
 * @template T
 * @param {readonly T[]} list
 * @param {keyof T & string} key
 * @param {string} what
 */
const unique = (list, key, what) => {
  const seen = new Set();
  for (const x of list) { assert.ok(!seen.has(x[key]), `${what}: duplicate ${key} "${String(x[key])}"`); seen.add(x[key]); }
};

// ── Volume I products ────────────────────────────────────────────────
unique(volumeOne, 'sku', 'volume-one');
const MAT = materials.map(m => m.id), CAT = categories.map(c => c.slug);
for (const p of volumeOne) {
  const at = `volume-one ${p.sku}`;
  assert.ok(p.name && p.description, `${at}: name + description`);
  assert.ok(CAT.includes(p.category), `${at}: category "${p.category}" not in categories`);
  assert.ok(['available', 'coming-soon'].includes(p.status), `${at}: status "${p.status}"`);
  assert.match(p.photo, /^$|\.webp$/, `${at}: photo is a .webp file name, or '' while it's awaited`);
  if (p.pricing == null) continue;          // price on enquiry
  // Fixed price: { material: rupees } or, with variants, { variant: { material: rupees } }.
  /** @type {[string, unknown][]} */
  const tables = p.variants?.length ? p.variants.map(v => [v.id, /** @type {Record<string, unknown>} */ (p.pricing)[v.id]]) : [['', p.pricing]];
  if (p.variants?.length) assert.deepEqual(Object.keys(p.pricing).sort(), p.variants.map(v => v.id).sort(), `${at}: one price table per variant`);
  for (const [v, t] of tables) {
    assert.ok(t && typeof t === 'object', `${at}${v && ` (${v})`}: price table`);
    for (const [m, rs] of Object.entries(t)) {
      assert.ok(MAT.includes(m), `${at}: unknown material "${m}"`);
      assert.ok(Number.isInteger(rs) && rs > 0, `${at}: ${m} price must be whole rupees, got ${String(rs)}`);
    }
  }
}

// ── Elemental chambers (Volume II) ───────────────────────────────────
unique(volumeTwo.boxes, 'sku', 'upcoming boxes');
for (const b of volumeTwo.boxes) {
  const at = `chamber ${b.sku}`;
  assert.match(b.price, /^₹[\d,]+ – ₹[\d,]+$/, `${at}: price is a "₹a – ₹b" range (the cart parses it)`);
  for (const k of /** @type {const} */ (['name', 'lead', 'capacity', 'photo'])) assert.ok(b[k], `${at}: ${k}`);
  assert.ok(chamberElements[b.sku], `${at}: no entry in chamberElements (which plant groups it takes)`);
}

// ── Plant groups per chamber ─────────────────────────────────────────
const EL = elements.map(e => e.id);
for (const [sku, els] of Object.entries(chamberElements)) {
  assert.ok(volumeTwo.boxes.some(b => b.sku === sku), `chamberElements: "${sku}" is not a chamber`);
  if (els !== 'all') for (const e of els) assert.ok(EL.includes(e), `chamberElements ${sku}: group "${e}"`);
}

// ── Journal ──────────────────────────────────────────────────────────
unique(articles, 'slug', 'articles');
const SLUGS = articles.map(a => a.slug), ACATS = articleCats.map(c => c.slug);
for (const a of articles) {
  const at = `article ${a.slug}`;
  assert.ok(ACATS.includes(a.category), `${at}: category "${a.category}"`);
  assert.ok(!Number.isNaN(Date.parse(a.publishDate)), `${at}: publishDate`);
  assert.ok(a.body && a.title && a.metaDescription, `${at}: body, title, metaDescription`);
  assert.ok(existsSync(path.join(ROOT, 'blog', `${a.slug}.html`)), `${at}: blog/${a.slug}.html is missing (copy an existing article page, then npm run build)`);
  for (const r of a.relatedArticles ?? []) assert.ok(SLUGS.includes(r), `${at}: related "${r}" doesn't exist`);
  // "From the studio" links (prerender.mjs): 19 of 23 once pointed at SKUs that don't exist.
  for (const sku of a.relatedProducts) assert.ok(volumeOne.some(p => p.sku === sku && p.status === 'available'), `${at}: related product "${sku}" isn't an orderable piece`);
}

// ── Site nav ─────────────────────────────────────────────────────────
// Clean URLs (cleanUrls in vercel.json): "/about" must have about.html behind it.
const vercel = JSON.parse(readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
assert.equal(vercel.cleanUrls, true, 'vercel.json must keep cleanUrls: the site links to /about, not /about.html');
// The design tool left the site (D-2026-10-22-a): old links and shared designs land on the home page.
assert.ok(vercel.redirects.some((/** @type {{ source: string, destination: string }} */ r) => r.source === '/maker' && r.destination === '/'), 'vercel.json: /maker redirects home');
for (const n of NAV) {
  assert.match(n.href, /^\/[a-z-]*$/, `NAV: ${n.href} should be a clean link like /about`);
  assert.ok(existsSync(path.join(ROOT, `${n.href.slice(1) || 'index'}.html`)), `NAV: no page behind ${n.href}`);
}

// ── Icons (data/icons.js) ──────────────────────────────────────────
// Each icon is shape elements only: a stray <svg> or glued attributes (the
// first registry build, 12 Oct 2026) render as nothing.
{
  const { icon, ICON_NAMES } = await import('../data/icons.js');
  for (const n of ICON_NAMES) {
    const svg = icon(n);
    assert.equal((svg.match(/<svg\b/g) || []).length, 1, `icon ${n}: exactly one <svg>`);
    assert.match(svg, /<svg [^>]*width="\d+" height="\d+" aria-hidden="true"/, `icon ${n}: sized and hidden`);
    assert.match(svg.replace(/^<svg[^>]*>|<\/svg>$/g, ''), /^(<(path|circle|rect|line|polyline|polygon|ellipse)\b[^<]*\/>)+$/, `icon ${n}: shapes only`);
  }
  assert.throws(() => icon('nope'));
}

// "Where will it live?": every place names a real material, and every
// orderable piece has an exact price in every place (the card shows it).
for (const pl of places) assert.ok(materials.some(m => m.id === pl.material), `place ${pl.id}: unknown material ${pl.material}`);
for (const p of volumeOne.filter(x => x.status === 'available'))
  for (const pl of places) assert.ok(/** @type {number} */ (priceOf(p, pl.material)) > 0, `${p.sku}: no ${pl.name} (${pl.material}) price`);
assert.equal(priceOf(/** @type {import('../data/volume-one.js').Product} */ (volumeOne.find(p => p.sku === 'V1-PLT-005')), 'asa', 'small-circle'), 799);
assert.equal(priceOf(/** @type {import('../data/volume-one.js').Product} */ (volumeOne.find(p => p.sku === 'V1-PLT-005')), 'petg'), 1399);   // first size
assert.equal(priceOf(/** @type {import('../data/volume-one.js').Product} */ (volumeOne.find(p => p.status === 'coming-soon')), 'petg'), null);

console.log(`data: all checks passed (${volumeOne.length} products, ${volumeTwo.boxes.length} chambers, ${articles.length} articles)`);
