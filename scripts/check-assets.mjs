#!/usr/bin/env node
/**
 * check-assets.mjs — fail if a deployed page or a data file points at a file
 * that doesn't exist.
 *
 * WHY: on 10 Oct 2026 three of these were live at once and nobody noticed —
 * 36 Journal diagrams (relative paths inside /blog/), the article logo
 * (logo.png deleted, 23 pages still used it) and the Bird Feeder photo
 * (never uploaded). Each was one missing file; each was invisible until a
 * browser walk. This makes it a build failure instead.
 *
 * Checks: src / href / srcset in every deployed .html, product photos in
 * data/ (+ the -300/-600 sizes the catalogue asks for), images inside
 * article bodies, Maker 3D plant models. Skips external URLs and template placeholders.
 * Run: node scripts/check-assets.mjs   (part of npm test)
 */
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Known gaps waiting on the client, with their issue. Reported, not failed.
// ponytail: remove an entry the day its file lands, or the check goes blind to it.
const KNOWN_MISSING = {
  'assets/v1/bird-feeder.webp': 'site-tue',
  'assets/v1/bird-feeder-300.webp': 'site-tue',
  'assets/v1/bird-feeder-600.webp': 'site-tue'
};

const exists = (p) => access(path.join(ROOT, p)).then(() => true, () => false);
const isLocal = (u) => u && !/^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/.test(u) && !u.includes('${');

// "/assets/x.svg" is from the root; "assets/x.svg" is from the page's folder.
function resolveFrom(dir, u){
  const clean = u.split(/[?#]/)[0];
  if (!clean) return null;
  return clean.startsWith('/') ? clean.slice(1) : path.posix.normalize(path.posix.join(dir, clean));
}

const refs = [];   // { file, path }
const add = (file, dir, u) => { if (isLocal(u)) { const p = resolveFrom(dir, u); if (p) refs.push({ file, path: p }); } };

function scanMarkup(file, dir, html){
  for (const m of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) add(file, dir, m[1]);
  for (const m of html.matchAll(/\bsrcset="([^"]+)"/g))
    for (const part of m[1].split(',')) add(file, dir, part.trim().split(/\s+/)[0]);
}

// 1 · Deployed pages (catalogue/ and debug.html are in .vercelignore).
const pages = [
  ...(await readdir(ROOT)).filter((f) => f.endsWith('.html') && f !== 'debug.html').map((f) => ({ f, dir: '' })),
  ...(await readdir(path.join(ROOT, 'blog'))).filter((f) => f.endsWith('.html')).map((f) => ({ f: `blog/${f}`, dir: 'blog' }))
];
for (const { f, dir } of pages) scanMarkup(f, dir, await readFile(path.join(ROOT, f), 'utf8'));

// 2 · Product data → the files the renderers build from it.
const { volumeOne, photoPath } = await import(path.join(ROOT, 'data/volume-one.js'));
const { volumeTwo } = await import(path.join(ROOT, 'data/upcoming.js'));
for (const p of volumeOne) if (p.photo)
  for (const size of ['', '300', '600']) refs.push({ file: `data/volume-one.js (${p.sku})`, path: photoPath(p, size) });
for (const b of volumeTwo.boxes) {
  if (b.photo) refs.push({ file: `data/upcoming.js (${b.sku})`, path: `assets/boxes/${b.photo}` });
  if (b.illustration) refs.push({ file: `data/upcoming.js (${b.sku})`, path: `assets/boxes/${b.illustration}` });
}

// 3 · Maker 3D plant models (data/maker.js → models), plus their credits file.
const { models } = await import(path.join(ROOT, 'data/maker.js'));
for (const [kind, table] of [['forms', models.forms], ['plants', models.plants]])
  for (const [k, m] of Object.entries(table)) if (m) refs.push({ file: `data/maker.js (models.${kind}.${k})`, path: models.base + m.file });
refs.push({ file: 'data/maker.js (models)', path: models.base + 'CREDITS.md' });

// 4 · Article bodies render inside /blog/.
for (const f of await readdir(path.join(ROOT, 'data/article-bodies')))
  scanMarkup(`data/article-bodies/${f}`, 'blog', await readFile(path.join(ROOT, 'data/article-bodies', f), 'utf8'));

// Report once per missing file.
const missing = new Map();
for (const r of refs) if (!(await exists(r.path))) (missing.get(r.path) || missing.set(r.path, new Set()).get(r.path)).add(r.file);

let fail = 0;
for (const [p, from] of missing) {
  const known = KNOWN_MISSING[p];
  if (!known) fail++;
  console.log(`${known ? `known (${known})` : 'MISSING'}  ${p}  ← ${[...from].slice(0, 3).join(', ')}${from.size > 3 ? ` +${from.size - 3}` : ''}`);
}
const stale = Object.keys(KNOWN_MISSING).filter((p) => !missing.has(p));
for (const p of stale) { fail++; console.log(`STALE allowlist entry (file exists now, remove it): ${p}`); }

if (fail) { console.error(`\ncheck-assets FAILED — ${fail} problem(s) in ${refs.length} references`); process.exit(1); }
console.log(`check-assets OK — ${refs.length} references, ${missing.size} known gap(s)`);
