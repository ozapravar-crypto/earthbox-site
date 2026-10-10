#!/usr/bin/env node
/**
 * includes.mjs — write the shared header + footer (data/site.js) into every
 * deployed page.
 *
 * WHY: the same header and footer were hand-copied into 29 pages. Adding
 * "Maker" took 30 edits and the mobile menu was missed; the footers drifted
 * into two different refund policies. Now there is one source and this
 * stamps it in at build time, so pages stay plain static HTML.
 *
 * Run:   npm run includes            (part of npm run build)
 * Check: node scripts/includes.mjs --check   (part of npm test) — exits 1
 *        if any page differs from what data/site.js would produce.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runheadHTML, footerHTML, NAV } from '../data/site.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const pages = [
  ...(await readdir(ROOT)).filter((f) => f.endsWith('.html') && f !== 'debug.html'),
  ...(await readdir(path.join(ROOT, 'blog'))).filter((f) => f.endsWith('.html')).map((f) => `blog/${f}`)
];

const stale = [];
for (const f of pages.sort()) {
  const p = path.join(ROOT, f);
  const before = await readFile(p, 'utf8');
  const inBlog = f.startsWith('blog/');
  const prefix = inBlog ? '../' : '';
  const current = inBlog ? 'blog.html' : (NAV.some((n) => n.href === f) ? f : null);

  let html = before;
  for (const [re, block] of [
    [/<header class="runhead"[\s\S]*?<\/header>/, runheadHTML({ prefix, current })],
    [/<footer class="colophon">[\s\S]*?<\/footer>/, footerHTML({ prefix, home: f === 'index.html' })]
  ]) {
    if (!re.test(html)) { console.error(`includes: ${f} has no ${re.source.slice(1, 16)}… block`); process.exit(1); }
    html = html.replace(re, () => block);
  }
  if (html === before) continue;
  stale.push(f);
  if (!CHECK) await writeFile(p, html, 'utf8');
}

if (CHECK && stale.length) {
  console.error(`includes FAILED — ${stale.length} page(s) differ from data/site.js: ${stale.join(', ')}\nRun: npm run includes`);
  process.exit(1);
}
console.log(CHECK ? `includes OK — ${pages.length} pages match data/site.js` : `includes: updated ${stale.length} of ${pages.length} pages`);
