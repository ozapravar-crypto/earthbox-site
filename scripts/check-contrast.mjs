#!/usr/bin/env node
/**
 * check-contrast.mjs — text colour tokens must stay readable (WCAG AA 4.5:1)
 * on the backgrounds they're used on, in light and dark mode.
 *
 * WHY: --accent (#B8A99A) was used for text at 2.14:1 and --accent-text sat
 * at 4.46:1 on the tinted background; both shipped unnoticed (10 Oct 2026).
 * Reads styles/tokens.css, so a token edit that breaks contrast fails here.
 * Run: node scripts/check-contrast.mjs   (part of npm test)
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = await readFile(path.join(ROOT, 'styles/tokens.css'), 'utf8');

// First block = light (:root), the [data-theme="dark"] block = dark.
/** @type {(re: RegExp) => Record<string, string>} */
const block = (re) => Object.fromEntries([...(css.match(re)?.[1] ?? '').matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(m => [m[1], m[2]]));
const light = block(/:root\s*\{([^}]*)\}/);
const dark = { ...light, ...block(/\[data-theme="dark"\]\s*\{([^}]*)\}/) };

const lum = (/** @type {string} */ hex) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(c => (c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4));
  return .2126 * r + .7152 * g + .0722 * b;
};
/** @type {(a: string, b: string) => number} */
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
// The site-wide paper grain (atmosphere.css body::before) multiplies every
// pixel by up to (1 − .83 × .06 × .35). Check pairs under that worst case.
const GRAIN = 1 - .83 * .06 * .35;
const grained = (/** @type {string} */ hex) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * GRAIN).toString(16).padStart(2, '0')).join('');

// Every text token × every surface it appears on. --accent is decorative
// (rules, borders, icons) and deliberately not in this list.
const TEXT = ['ink', 'ink-soft', 'mute', 'accent-text'];
const SURFACES = ['bg', 'bg-tint'];

let fail = 0;
for (const [mode, t] of /** @type {[string, Record<string, string>][]} */ ([['light', light], ['dark', dark]]))
  for (const fg of TEXT) for (const bg of SURFACES) {
    if (!t[fg] || !t[bg]) { console.error(`missing token --${!t[fg] ? fg : bg} (${mode})`); fail++; continue; }
    const r = ratio(grained(t[fg]), grained(t[bg]));
    if (r < 4.5) { fail++; console.error(`FAIL ${mode}: --${fg} ${t[fg]} on --${bg} ${t[bg]} = ${r.toFixed(2)}:1 (needs 4.5)`); }
  }
// Type floor (UX audit C-14): no rem font size under --label-min (.62rem ≈ 10 px) in any stylesheet.
for (const f of (await readdir(path.join(ROOT, 'styles'))).filter(n => n.endsWith('.css'))) {
  const text = await readFile(path.join(ROOT, 'styles', f), 'utf8');
  for (const m of text.matchAll(/font-size:\s*(\d*\.?\d+)rem/g))
    if (Number(m[1]) < 0.62) { fail++; console.error(`FAIL type floor: styles/${f} font-size:${m[1]}rem (minimum .62rem)`); }
}
if (fail) { console.error(`check-contrast FAILED — ${fail} problem(s)`); process.exit(1); }
console.log(`check-contrast OK — ${TEXT.length * SURFACES.length * 2} text/background pairs ≥ 4.5:1, no type under .62rem`);
