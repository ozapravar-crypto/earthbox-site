// Run: node scripts/data.test.mjs   (part of npm test)
// The data files are the site's database. This checks their shape, so a
// typo in data/*.js fails the build instead of shipping a broken page or a
// cart line that can't be priced. Shapes are documented in README.md.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { volumeOne, categories, materials } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';
import { plants, elements, chamberElements, substrates, recipes, forms, SOILLESS } from '../data/maker.js';
import { articles, categories as articleCats } from '../data/articles.js';
import { NAV } from '../data/site.js';
import { decodeBuild, encodeBuild } from './build-codec.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const unique = (list, key, what) => {
  const seen = new Set();
  for (const x of list) { assert.ok(!seen.has(x[key]), `${what}: duplicate ${key} "${x[key]}"`); seen.add(x[key]); }
};

// ── Volume I products ────────────────────────────────────────────────
unique(volumeOne, 'sku', 'volume-one');
const MAT = materials.map(m => m.id), CAT = categories.map(c => c.slug);
for (const p of volumeOne) {
  const at = `volume-one ${p.sku}`;
  assert.ok(p.name && p.description, `${at}: name + description`);
  assert.ok(CAT.includes(p.category), `${at}: category "${p.category}" not in categories`);
  assert.ok(['available', 'coming-soon'].includes(p.status), `${at}: status "${p.status}"`);
  assert.match(p.photo, /\.webp$/, `${at}: photo is a .webp file name`);
  if (p.pricing === null || p.pricing === undefined) continue;          // price on enquiry
  // Fixed price: { material: rupees } or, with variants, { variant: { material: rupees } }.
  const tables = p.variants?.length ? p.variants.map(v => [v.id, p.pricing[v.id]]) : [['', p.pricing]];
  if (p.variants?.length) assert.deepEqual(Object.keys(p.pricing).sort(), p.variants.map(v => v.id).sort(), `${at}: one price table per variant`);
  for (const [v, t] of tables) {
    assert.ok(t && typeof t === 'object', `${at}${v && ` (${v})`}: price table`);
    for (const [m, rs] of Object.entries(t)) {
      assert.ok(MAT.includes(m), `${at}: unknown material "${m}"`);
      assert.ok(Number.isInteger(rs) && rs > 0, `${at}: ${m} price must be whole rupees, got ${rs}`);
    }
  }
}

// ── Elemental chambers (Volume II) ───────────────────────────────────
unique(volumeTwo.boxes, 'sku', 'upcoming boxes');
for (const b of volumeTwo.boxes) {
  const at = `chamber ${b.sku}`;
  assert.match(b.price, /^₹[\d,]+ – ₹[\d,]+$/, `${at}: price is a "₹a – ₹b" range (the cart parses it)`);
  for (const k of ['name', 'lead', 'capacity', 'photo']) assert.ok(b[k], `${at}: ${k}`);
  assert.ok(chamberElements[b.sku], `${at}: no entry in chamberElements (which plant groups it takes)`);
}

// ── Maker: plants, foundations, recipes ──────────────────────────────
unique(plants, 'id', 'plants');
const EL = elements.map(e => e.id);
for (const p of plants) {
  assert.match(p.id, /^PLT-\d{3}$/, `plant ${p.id}: id`);
  assert.ok(EL.includes(p.element), `plant ${p.id}: group "${p.element}"`);
  assert.ok(forms[p.form], `plant ${p.id}: shape "${p.form}" has no label in forms`);
  assert.ok(p.name && p.botanical, `plant ${p.id}: name + botanical`);
  if ('price' in p) assert.ok(Number.isInteger(p.price) && p.price > 0, `plant ${p.id}: price is whole rupees`);
}
for (const [sku, els] of Object.entries(chamberElements)) {
  assert.ok(volumeTwo.boxes.some(b => b.sku === sku), `chamberElements: "${sku}" is not a chamber`);
  if (els !== 'all') for (const e of els) assert.ok(EL.includes(e), `chamberElements ${sku}: group "${e}"`);
}
for (const s of SOILLESS) assert.ok(chamberElements[s], `SOILLESS: "${s}" is not a chamber`);
unique(substrates, 'id', 'substrates');
for (const s of substrates) if ('price' in s) assert.ok(Number.isInteger(s.price) && s.price > 0, `substrate ${s.id}: price`);
unique(recipes, 'id', 'recipes');
for (const r of recipes) {
  // A recipe must survive the share-link codec unchanged: every plant fits its chamber.
  const b = decodeBuild(encodeBuild({ name: '', chamber: r.chamber, substrate: r.substrate, plants: r.plants, space: {} }));
  assert.ok(b, `recipe ${r.id}: chamber "${r.chamber}"`);
  assert.deepEqual(b.plants, r.plants, `recipe ${r.id}: a plant doesn't fit ${r.chamber} or the chamber is over capacity`);
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
}

// ── Site nav ─────────────────────────────────────────────────────────
for (const n of NAV) assert.ok(existsSync(path.join(ROOT, n.href)), `NAV: ${n.href} doesn't exist`);

console.log(`data: all checks passed (${volumeOne.length} products, ${volumeTwo.boxes.length} chambers, ${plants.length} plants, ${articles.length} articles)`);
