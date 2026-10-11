#!/usr/bin/env node
/**
 * qa/contrast/audit.mjs — exhaustive colour-contrast audit in a real browser.
 *
 * WHY: two contrast defects (2.14:1 accent text, 4.46:1 on tint) shipped and
 * a later visual pass missed them. Visual review, a Lighthouse score or one
 * axe scan are not evidence. This walks every route × theme × viewport ×
 * interactive state, and for each one:
 *   1. scans every visible text node, placeholder, icon-only control and
 *      focus ring from computed styles (qa/contrast/scan.js);
 *   2. measures anything over a photo / gradient / blend / overlap against
 *      the real screenshot pixels behind it (measure.mjs);
 *   3. runs axe-core's color-contrast rule and links every violation and
 *      every "incomplete" back to a measured result;
 * then writes qa/reports/contrast-report.json (+ .md) and exits 1 on any
 * confirmed failure not listed, with a verified reason, in baseline.json.
 *
 * Run:  npm run qa:contrast            (serves the folder itself)
 *       BASE_URL=https://www.earthbox.in npm run qa:contrast
 * Opts: --quick  (default state only; for a fast local loop)
 */
import { chromium } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { serve } from '../serve.mjs';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanPage, interactiveSignatures } from './scan.js';
import { resolveBatch } from './measure.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const QUICK = process.argv.includes('--quick');
const PORT = 4180;
const BASE = process.env.BASE_URL || `http://localhost:${PORT}`;

// ── Routes ───────────────────────────────────────────────────────────
// Every deployed page, plus each kind of product page (one renderer, five
// layouts). Articles share one template, so they get the default state only;
// the template's interactive states are covered on the first article.
const articles = (await readdir(path.join(ROOT, 'blog'))).filter(f => f.endsWith('.html')).sort();
const ROUTES = [
  { path: '/index.html', name: 'home' },
  { path: '/products.html', name: 'catalogue' },
  { path: '/product.html#V1-PLT-005', name: 'product-priced-variants' },
  { path: '/product.html#V1-PP-001', name: 'product-enquiry-plant' },
  { path: '/product.html#MossBox', name: 'product-chamber' },
  { path: '/product.html#VIV-III', name: 'product-vivarium' },
  { path: '/product.html#NOPE', name: 'product-not-found' },
  { path: '/maker.html', name: 'maker' },
  { path: '/blog.html', name: 'journal' },
  { path: '/about.html', name: 'about' },
  ...articles.map((f, i) => ({ path: `/blog/${f}`, name: `article:${f.replace('.html', '')}`, light: i > 0 }))
];

const THEMES = ['light', 'dark'];
const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
};

// A cart with one line of each kind, for every cart-drawer state.
const CART = JSON.stringify({ cart: [
  { kind: 'product', sku: 'V1-PLT-006', variant: null, material: 'petg', qty: 2 },
  { kind: 'product', sku: 'MossBox', variant: null, material: null, qty: 1 },
  { kind: 'build', code: 'c=MossBox&s=studio&p=PLT-036,PLT-037' }
], saved: [{ kind: 'product', sku: 'V1-PLT-001', variant: null, material: null, qty: 1 }] });

const click = (sel) => async (p) => { await p.locator(sel).first().click(); await p.waitForTimeout(250); };
const seq = (...steps) => async (p) => { for (const s of steps) await s(p); };
const openCart = click('.runhead-bag-btn[data-open=cart]');
const fillForm = async (p) => {
  const f = p.locator('.enquiry-alt').first();
  await f.locator('summary').click();
  await f.locator('input[name=name]').fill('QA Test');
  await f.locator('input[name=email]').fill('qa@example.com');
  await f.locator('button[type=submit]').click();
  await p.waitForTimeout(600);
};

// ── States ───────────────────────────────────────────────────────────
// { name, viewports?, setup(page), scope? }  Every route also gets
// 'default', 'scrolled-header', and (desktop) hover + focus on each distinct
// interactive element.
const STATES = {
  home: [],
  catalogue: [
    { name: 'search-results', setup: seq(click('#catalogueSearchBtn'), async p => { await p.fill('#cat-search', 'moss'); await p.waitForTimeout(300); }) },
    { name: 'search-empty', setup: seq(click('#catalogueSearchBtn'), async p => { await p.fill('#cat-search', 'zzqx'); await p.waitForTimeout(300); }) },
    { name: 'volume-II', setup: click('.vol-pill >> nth=1') },
    { name: 'volume-III', setup: click('.vol-pill >> nth=2') }
  ],
  'product-priced-variants': [
    { name: 'variant+material-selected', setup: seq(click('[data-variant="small-circle"]'), click('[data-material="asa"]')) },
    { name: 'saved-pressed', setup: click('.pd-buy .save-btn') },
    { name: 'enquiry-form-open', viewports: ['desktop'], setup: click('.enquiry-alt summary') },
    { name: 'enquiry-error', viewports: ['desktop'], route: { status: 500, body: { success: false, message: 'down' } }, setup: fillForm },
    { name: 'enquiry-success', viewports: ['desktop'], route: { status: 200, body: { success: true } }, setup: fillForm },
    { name: 'cart-open', cart: true, setup: openCart, scope: 'dialog.ct' },
    { name: 'cart-notice-undo', cart: true, setup: seq(openCart, click('dialog.ct [data-ct=remove]')), scope: 'dialog.ct' },
    { name: 'saved-tab', cart: true, setup: seq(openCart, click('dialog.ct [data-tab=saved]')), scope: 'dialog.ct' },
    { name: 'cart-empty', setup: openCart, scope: 'dialog.ct' }
  ],
  maker: [
    { name: 'chamber-step', setup: click('#mkBegin') },
    { name: 'plants-list', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=plants]')) },
    { name: 'plants-map', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=plants]'), click('[data-act=view][data-id=map]')) },
    { name: 'plants-pin-card', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=plants]'), click('[data-act=view][data-id=map]'), click('[data-act=pin]')) },
    { name: 'plants-refine-open', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=plants]'), click('summary:has-text("Filter")')) },
    { name: 'plants-no-results', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=plants]'), async p => { await p.fill('input[name=q]', 'zzqx'); await p.waitForTimeout(300); }) },
    { name: 'plants-error-full', setup: seq(click('[data-act=recipe] >> nth=2'), click('.mk-step[data-to=plants]'), click('[data-act=next]'), click('.mk-step[data-to=plants]')) },
    ...[1, 2, 3, 4, 5].map(n => ({ name: `guided-step-${n}`, scope: '#mkGuide', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=plants]'), click('[data-act=guide]'),
      async p => { for (let i = 1; i < n; i++) await p.locator('#mkGuide [data-act=gd-next]').click(); await p.waitForTimeout(200); }) })),
    { name: 'space-step', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=space]')) },
    { name: 'review-step', setup: seq(click('[data-act=recipe] >> nth=0'), click('.mk-step[data-to=review]')) }
  ],
  journal: [{ name: 'filter-active', setup: click('#journalFilters .filter-btn >> nth=1') }],
  'article:anatomy-earthbox-cradle': [],
  about: []
};
const PHONE_STATES = [{ name: 'mobile-menu-open', viewports: ['phone'], setup: click('.hamburger'), scope: '#mobile-nav' }];

// ── Server ───────────────────────────────────────────────────────────
const server = process.env.BASE_URL ? null : await serve(ROOT, PORT);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const results = [], coverage = [], axeFindings = [];
let base = 0;

async function prepare(page){
  await page.addStyleTag({ content: '.cursor-ring,.cursor-dot,.loader{display:none!important} *,*::before,*::after{transition:none!important;animation-duration:0s!important;animation-delay:0s!important;caret-color:transparent!important}' });
  await page.evaluate(() => document.querySelectorAll('.reveal,.reveal-line,.reveal-clip').forEach(e => e.classList.add('in')));
  await page.waitForTimeout(150);
}

async function measure(page, ctx, { scope = null, state, axe = false }){
  const found = await page.evaluate(scanPage, { scope, state, base });
  base += found.length + 1;
  for (const it of found) Object.assign(it, ctx);
  results.push(...found.filter(it => it.status !== 'review'), ...await resolveBatch(page, found.filter(it => it.status === 'review')));
  if (axe) {
    const builder = new AxeBuilder({ page }).withRules(['color-contrast']);
    if (scope) builder.include(scope);
    const r = await builder.analyze();
    for (const [kind, list] of [['violation', r.violations], ['incomplete', r.incomplete]])
      for (const v of list) for (const n of v.nodes) {
        const target = n.target.join(' ');
        const cq = await page.evaluate(t => document.querySelector(t)?.getAttribute('data-cq') ?? document.querySelector(t)?.closest('[data-cq]')?.getAttribute('data-cq'), target).catch(() => null);
        const d = n.any?.[0]?.data || {};
        axeFindings.push({ ...ctx, state, axe: kind, target, cq: cq ? +cq : null,
          axeFg: d.fgColor, axeBg: d.bgColor, axeRatio: d.contrastRatio, axeExpected: d.expectedContrastRatio,
          reason: n.any?.[0]?.message || n.failureSummary?.split('\n').slice(1).join(' ').trim() });
      }
  }
  return found.length;
}

async function run(route, theme, vpName){
  const vp = VIEWPORTS[vpName];
  const states = [{ name: 'default' }, { name: 'scrolled-header', scope: '.runhead', setup: async p => { await p.evaluate(() => scrollTo(0, 800)); await p.waitForTimeout(200); } },
    ...(route.light ? [] : (STATES[route.name] || [])), ...(route.light || !['home', 'article:anatomy-earthbox-cradle'].includes(route.name) ? [] : PHONE_STATES)]
    .filter(s => !s.viewports || s.viewports.includes(vpName));
  if (QUICK) states.splice(1);

  for (const st of states) {
    const ctxBrowser = await browser.newContext({ ...vp, reducedMotion: 'reduce', colorScheme: theme });
    await ctxBrowser.addInitScript(([t, cart]) => {
      sessionStorage.setItem('earthbox-loader-seen', '1');
      localStorage.setItem('earthbox-theme', t);
      localStorage.setItem('earthbox-consent', 'denied');   // banner audited in contrast.spec (CQ-015)
      if (cart) localStorage.setItem('earthbox-cart', cart); else localStorage.removeItem('earthbox-cart');
    }, [theme, st.cart ? CART : null]);
    await ctxBrowser.route('https://wa.me/**', r => r.fulfill({ body: 'wa' }));
    // The home film has no text over it (checked: index.html #film), and streaming it
    // under memory pressure crashed runs, so it isn't loaded.
    await ctxBrowser.route('**/*.mp4', r => r.abort());
    await ctxBrowser.route('https://www.googletagmanager.com/**', r => r.fulfill({ body: '' }));
    if (st.route) await ctxBrowser.route('https://api.web3forms.com/**', r => r.fulfill({ status: st.route.status, contentType: 'application/json', body: JSON.stringify(st.route.body) }));
    const page = await ctxBrowser.newPage();
    const ctx = { route: route.path, theme, viewport: vpName };
    const cov = { ...ctx, state: st.name, scanned: false, items: 0 };
    try {
      // One retry: a cold CI runner occasionally stalls a first load.
      await page.goto(BASE + route.path, { waitUntil: 'load' }).catch(() => page.goto(BASE + route.path, { waitUntil: 'load', timeout: 60000 }));
      await page.waitForTimeout(700);                   // renderers + fonts settle (networkidle never fires with the home film streaming)
      await prepare(page);
      if (st.setup) { await st.setup(page); await prepare(page); }
      cov.items = await measure(page, ctx, { scope: st.scope, state: st.name, axe: true });
      cov.scanned = true;

      // Hover + focus on each distinct interactive look (desktop, default state only).
      if (st.name === 'default' && vpName === 'desktop' && !route.light && !QUICK) {
        const targets = await page.evaluate(interactiveSignatures, {});
        for (const t of targets) {
          const loc = page.locator(`[data-cq-target="${t.i}"]`).first();
          for (const mode of t.offscreen ? ['focus'] : ['hover', 'focus']) {   // off-screen until focused: hover is meaningless
            try {
              await loc.scrollIntoViewIfNeeded({ timeout: 2000 });
              if (mode === 'hover') await loc.hover({ timeout: 2000, force: true }); else { await page.mouse.move(0, 0); await page.keyboard.press('Shift'); await loc.focus(); }
              await page.waitForTimeout(60);
              const n = await measure(page, ctx, { scope: `[data-cq-target="${t.i}"]`, state: `${mode}:${t.sig}` });
              coverage.push({ ...ctx, state: `${mode}:${t.sig}`, scanned: true, items: n });
            } catch (e) {
              coverage.push({ ...ctx, state: `${mode}:${t.sig}`, scanned: false, items: 0, error: e.message.split('\n')[0] });
            }
          }
          await loc.evaluate(e => e.blur()).catch(() => {});
        }
      }
    } catch (e) {
      cov.error = e.message.split('\n')[0];
    }
    coverage.push(cov);
    await ctxBrowser.close();
  }
}

const started = Date.now();
for (const route of ROUTES)
  for (const theme of THEMES)
    for (const vp of Object.keys(VIEWPORTS)) {
      process.stdout.write(`${route.path} ${theme} ${vp} … `);
      await run(route, theme, vp);
      process.stdout.write('done\n');
    }
await browser.close();
server?.closeAllConnections(); server?.close();

// ── Reconcile axe with measurements ──────────────────────────────────
// Every axe violation must match a measured FAIL; every axe "incomplete"
// must be settled by a measurement. Anything else stays visible as review.
const byId = new Map(results.map(r => [r.cq, r]));
for (const a of axeFindings) {
  const m = a.cq != null ? byId.get(a.cq) : null;
  a.measured = m ? { status: m.status, ratio: m.ratio, method: m.method || 'css' } : null;
  if (a.axe === 'violation' && m && m.status === 'pass') a.resolution = 'DISAGREE: axe fails, measurement passes — review';
  else if (a.axe === 'violation') a.resolution = m ? `confirmed (${m.status})` : 'axe-only violation — counted as fail';
  else a.resolution = m ? `settled by measurement: ${m.status}` : 'not linked to a measured element — review';
}
for (const a of axeFindings)
  if (a.axe === 'violation' && !a.measured)
    results.push({ ...a, kind: 'text', selector: a.target, status: 'fail', source: 'axe-only', fg: a.axeFg, bg: a.axeBg, ratio: a.axeRatio, threshold: parseFloat(a.axeExpected) || 4.5, flags: [] });

// ── Baseline: accepted findings need a written, verified reason ───────
const baseline = JSON.parse(await readFile(path.join(ROOT, 'qa/contrast/baseline.json'), 'utf8').catch(() => '{"accepted":[]}'));
const key = (r) => [r.route, r.theme, r.viewport, r.state.split(':')[0], r.selector].join(' | ');
const accepted = new Map(baseline.accepted.map(a => [a.key, a]));
for (const r of results) if (r.status === 'fail' && accepted.has(key(r))) { r.status = 'accepted'; r.acceptedReason = accepted.get(key(r)).reason; }

// De-duplicate identical findings (same element/colours across states) for the summary only.
const fails = results.filter(r => r.status === 'fail');
const reviews = results.filter(r => r.status === 'review');
const uniq = (list) => [...new Map(list.map(r => [[r.selector, r.theme, r.viewport, r.fg, r.bg, r.kind].join('|'), r])).values()];

const report = {
  generated: new Date().toISOString(), base: BASE, quick: QUICK, seconds: Math.round((Date.now() - started) / 1000),
  wcag: 'AA: 4.5:1 normal text, 3:1 large text (≥24px or ≥18.66px bold), 3:1 icons and focus rings (1.4.11); disabled controls exempt (1.4.3)',
  totals: Object.fromEntries(['pass', 'fail', 'review', 'accepted', 'exempt-disabled', 'covered'].map(s => [s, results.filter(r => r.status === s).length])),
  coverage: { scanned: coverage.filter(c => c.scanned).length, notScanned: coverage.filter(c => !c.scanned) },
  axe: { violations: axeFindings.filter(a => a.axe === 'violation').length, incomplete: axeFindings.filter(a => a.axe === 'incomplete').length,
    unresolved: axeFindings.filter(a => /review|DISAGREE/.test(a.resolution)) },
  failures: uniq(fails), review: uniq(reviews), axeFindings, coverageLog: coverage, results
};
await mkdir(path.join(ROOT, 'qa/reports'), { recursive: true });
await writeFile(path.join(ROOT, 'qa/reports/contrast-report.json'), JSON.stringify(report, null, 1));
// Committed summary: everything except the per-element pass rows.
const summary = { ...report };
delete summary.results;
summary.coverageLog = coverage.map(c => ({ route: c.route, theme: c.theme, viewport: c.viewport, state: c.state, scanned: c.scanned, items: c.items, error: c.error }));
await writeFile(path.join(ROOT, 'qa/reports/contrast-summary.json'), JSON.stringify(summary, null, 1));

const row = (r) => `| ${r.route} | ${r.theme}/${r.viewport} | ${r.state} | \`${r.selector}\` | ${r.text ?? ''} | ${r.fg} | ${r.bg} | ${r.ratio} | ${r.threshold} | ${r.status}${r.method === 'pixels' ? ' (pixels)' : ''} |`;
const md = [
  `# Contrast report · ${report.generated}`, '',
  `Base: ${BASE} · ${report.seconds}s · ${report.quick ? '**QUICK run: default states only**' : 'full run'}`, '',
  `**Measured items:** ${Object.entries(report.totals).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
  `**States scanned:** ${report.coverage.scanned} · **not scanned:** ${report.coverage.notScanned.length}`,
  `**axe:** ${report.axe.violations} violation nodes, ${report.axe.incomplete} incomplete · unresolved: ${report.axe.unresolved.length}`, '',
  `## Failures (${report.failures.length} unique)`, '',
  '| Route | Theme/VP | State | Selector | Text | FG | BG | Ratio | Needs | Status |', '|---|---|---|---|---|---|---|---|---|---|',
  ...report.failures.map(row), '',
  `## Needs review (${report.review.length} unique)`, '',
  '| Route | Theme/VP | State | Selector | Text | FG | BG | Ratio | Needs | Status |', '|---|---|---|---|---|---|---|---|---|---|',
  ...report.review.map(r => row(r) + (r.note ? ` ${r.note}` : '')), '',
  `## Not scanned (${report.coverage.notScanned.length})`, '',
  ...report.coverage.notScanned.map(c => `- ${c.route} · ${c.theme}/${c.viewport} · ${c.state}: ${c.error || 'skipped'}`)
].join('\n');
await writeFile(path.join(ROOT, 'qa/reports/contrast-report.md'), md);

console.log(`\ncontrast: ${Object.entries(report.totals).map(([k, v]) => `${k} ${v}`).join(' · ')} · states ${report.coverage.scanned} scanned, ${report.coverage.notScanned.length} not · axe unresolved ${report.axe.unresolved.length}`);
console.log(`report: qa/reports/contrast-report.md`);
if (fails.length) { console.error(`contrast FAILED — ${report.failures.length} unique confirmed failure(s)`); process.exit(1); }
