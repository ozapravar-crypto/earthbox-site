#!/usr/bin/env node
/**
 * dist.mjs — copy ONLY the website into dist/, which is what Vercel serves.
 *
 * WHY: Vercel used to serve the whole repo folder, so tests, QA tools, CI
 * config and .beads/ were all public URLs (production discovery R2). A
 * deny-list would have to remember every new file; this allow-list means
 * a file only goes live if it's one of these kinds. The build still runs on
 * the full repo (tests need it); only the output is narrowed.
 *
 * Run: last step of `npm run build`. Tests serve dist/ the same way.
 */
import { cp, rm, readdir, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const NOT_LIVE = new Set(['debug.html']);

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT);

// Root: pages + the crawler files.
for (const f of await readdir(ROOT)) {
  if ((f.endsWith('.html') && !NOT_LIVE.has(f)) || f === 'robots.txt' || f === 'sitemap.xml' || f === 'llms.txt') await copyFile(path.join(ROOT, f), path.join(OUT, f));
}

// Folders, filtered by file type: browser code and content only.
const keep = {
  blog:   (f) => f.endsWith('.html'),
  product: (f) => f.endsWith('.html'),   // one page per piece (seo.mjs)
  styles: (f) => f.endsWith('.css'),
  data:   (f) => f.endsWith('.js'),
  // Runtime modules are .js; build tools are .mjs/.cjs and tests are *.test.mjs.
  scripts: (f) => f.endsWith('.js') || f.endsWith('LICENSE'),
  // Media, except the social-card templates (design sources). Markdown stays
  // out, except the 3D models' CC BY credits, which must be reachable.
  assets: (f) => !f.startsWith(path.join('assets', 'og-templates')) && (!f.endsWith('.md') || f === path.join('assets', 'plants3d', 'CREDITS.md'))
};
for (const [dir, ok] of Object.entries(keep)) {
  await cp(path.join(ROOT, dir), path.join(OUT, dir), { recursive: true, filter: (src) => {
    const rel = path.relative(ROOT, src);
    return rel === dir || !path.extname(rel) ? true : ok(rel);
  } });
}

console.log('dist: website copied (allow-list)');
