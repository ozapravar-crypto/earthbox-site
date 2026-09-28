#!/usr/bin/env node
/**
 * check-prerender.mjs — fail if any deployed page is empty to a non-JS crawler.
 *
 * The 2026-09-28 audit found all 23 Journal articles rendering to 525 chars of
 * navigation for GPTBot/ClaudeBot/PerplexityBot. prerender.mjs fixed it; this
 * stops it silently coming back when someone adds an article and forgets to
 * run the build.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIN_TEXT = 1000;   // nav + footer alone is ~525

const strip = (h) => h
  .replace(/<(script|style)[\s\S]*?<\/\1>/g, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const files = (await readdir(path.join(ROOT, 'blog'))).filter((f) => f.endsWith('.html'));
const fails = [];

for (const f of files.sort()) {
  const html = await readFile(path.join(ROOT, 'blog', f), 'utf8');
  const problems = [];
  if (!/<h1[\s>]/.test(html)) problems.push('no <h1>');
  if (strip(html).length < MIN_TEXT) problems.push(`only ${strip(html).length} chars of text`);
  if (!/rel="canonical"/.test(html)) problems.push('no canonical');
  if (!/application\/ld\+json/.test(html)) problems.push('no JSON-LD');
  if (!/property="og:image"/.test(html)) problems.push('no og:image');
  if (problems.length) fails.push(`blog/${f}: ${problems.join(', ')}`);
}

if (fails.length) {
  console.error(`check-prerender FAILED — ${fails.length} page(s) are not crawler-ready:`);
  for (const f of fails) console.error(`  ${f}`);
  console.error('\nRun: npm run prerender');
  process.exit(1);
}
console.log(`check-prerender OK — ${files.length} article pages are readable without JavaScript`);
