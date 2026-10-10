// Contrast regressions — one test per contrast defect ever found, kept
// permanently. Each measures the real rendered page with the same engine as
// the full audit (qa/contrast): computed styles, and real screenshot pixels
// under the glyphs wherever a photo, gradient, blend or overlay is involved.
// The full sweep of every route × theme × state is `npm run qa:contrast`.
import { test, expect } from '@playwright/test';
import { scanPage } from '../qa/contrast/scan.js';
import { resolveBatch } from '../qa/contrast/measure.mjs';

// These set their own viewports; running them again under the phone project would only duplicate.
test.skip(({ isMobile }) => isMobile, 'viewports are set per test');

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => sessionStorage.setItem('earthbox-loader-seen', '1'));
  await context.route('**/*.mp4', r => r.abort());
});

// Measure everything inside `scope`; return only failures, readable in the report.
async function failures(page, scope, state){
  await page.addStyleTag({ content: '.cursor-ring,.cursor-dot,.loader{display:none!important} *{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}' });
  await page.evaluate(() => document.querySelectorAll('.reveal,.reveal-line').forEach(e => e.classList.add('in')));
  const found = await page.evaluate(scanPage, { scope, state });
  expect(found.length, `nothing measured in ${scope}`).toBeGreaterThan(0);
  const measured = [...found.filter(r => r.status !== 'review'), ...await resolveBatch(page, found.filter(r => r.status === 'review'))];
  return measured.filter(r => r.status === 'fail' || r.status === 'review')
    .map(r => `${r.status} ${r.ratio}:1 (needs ${r.threshold}) "${r.text}" ${r.fg} on ${r.bg} — ${r.selector}`);
}

const THEMES = ['light', 'dark'];

// CQ-001 · Homepage hero text over the photo (title, lede, CTA label, proof row,
// "Nature in your space") and the header over it measured 1.1–4.4:1.
// Root cause: the scrim (.hero::before, z -1) painted UNDER the photo (.hero-bg,
// also z -1, later in the DOM), so it never showed. Fixed: photo z -2, scrim
// bands held flat behind each text group, strengths set by measurement.
for (const [w, h] of [[1280, 800], [1440, 900], [1744, 902], [1920, 1080]]) {
  test(`CQ-001 hero + header over the photo pass at ${w}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await page.goto('/index.html');
    expect([...await failures(page, '#top', 'hero'), ...await failures(page, '.runhead', 'hero-header')]).toEqual([]);
    await page.close();
  });
}
test('CQ-001 hero on a phone: header over the photo passes', async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await page.goto('/index.html');
  expect([...await failures(page, '#top', 'hero'), ...await failures(page, '.runhead', 'hero-header')]).toEqual([]);
  await page.close();
});
test('CQ-001 guard: the hero scrim paints above the photo', async ({ page }) => {
  await page.goto('/index.html');
  const z = await page.evaluate(() => ({ photo: +getComputedStyle(document.querySelector('.hero-bg')).zIndex, scrim: +getComputedStyle(document.querySelector('.hero'), '::before').zIndex }));
  expect(z.photo).toBeLessThan(z.scrim);
});

// CQ-002 · Floating WhatsApp button: white icon on #25D366 = 1.98:1 (icons need 3:1).
test('CQ-002 WhatsApp button icon ≥ 3:1', async ({ page }) => {
  await page.goto('/products.html');
  expect(await failures(page, '.floating-wa', 'default')).toEqual([]);
});

// CQ-003 · Manifesto closing line at 55 % white on the lit dark band = 4.27:1.
for (const theme of THEMES) {
  test(`CQ-003 manifesto closing line passes (${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('earthbox-theme', t), theme);
    await page.goto('/index.html');
    expect(await failures(page, '.manifesto-tail', 'default')).toEqual([]);
  });
}

// CQ-004 · "Coming soon" badge: --accent-text on --bg-tint under the paper
// grain = 4.42:1 (the token check, which ignored the grain, said 4.67).
// Also: the coming-soon card faded the WHOLE card to .85 → 3.88:1 (axe caught
// it; the first pixel model missed ancestor opacity). Now only the photo fades.
for (const theme of THEMES) {
  test(`CQ-004 "Coming soon" badges pass (${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('earthbox-theme', t), theme);
    await page.goto('/products.html');
    expect(await failures(page, '#volumeOneList', 'default')).toEqual([]);
  });
}

// CQ-005 · --accent (#B8A99A) used for text = 2.14:1; --accent-text at 4.46:1
// on the tint (Phase 3, 10 Oct). Guarded by scripts/check-contrast.mjs (token
// pairs, now grain-aware); this checks the rendered pages that used them.
// CQ-006 · Breadcrumb "›" separators were --rule (12 % ink) = 1.25:1. Now --mute.
test('CQ-005/006 product page captions, breadcrumb separators and badges pass', async ({ page }) => {
  await page.goto('/product.html#V1-PLT-005');
  await page.waitForSelector('#productDetail article');
  expect(await failures(page, '#productDetail', 'default')).toEqual([]);
});

// CQ-007 · Focus rings were 2px --accent = 1.9–2.2:1 (rings need 3:1).
// Now currentColor. Checked on a light page, the dark manifesto band, and dark mode.
for (const theme of THEMES) {
  test(`CQ-007 keyboard focus rings ≥ 3:1 (${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('earthbox-theme', t), theme);
    await page.goto('/index.html');
    // Scroll reveals start at opacity 0; finish them, as a scrolled visitor would see.
    await page.evaluate(() => document.querySelectorAll('.reveal,.reveal-line').forEach(e => e.classList.add('in')));
    await page.addStyleTag({ content: '*{transition:none!important;animation-duration:0s!important;animation-delay:0s!important}' });
    const bad = [];
    for (const sel of ['.runhead-nav a', '.manifesto-inner a.cta', '#catalogue-tease a.cta', 'footer .colo-col a']) {
      const el = page.locator(sel).first();
      await el.scrollIntoViewIfNeeded();
      await page.keyboard.press('Shift');                     // make focus "keyboard" focus
      await el.focus();
      const rings = (await page.evaluate(scanPage, { scope: sel, state: 'focus' })).filter(r => r.kind === 'focus-ring');
      expect(rings.length, `no focus ring measured on ${sel}`).toBeGreaterThan(0);
      const found = [...rings.filter(r => r.status !== 'review'), ...await resolveBatch(page, rings.filter(r => r.status === 'review'))];
      bad.push(...found.filter(r => r.status !== 'pass').map(r => `${r.status} ${r.ratio}:1 ${r.fg} on ${r.bg} — ${sel}`));
    }
    expect(bad).toEqual([]);
  });
}

// CQ-008 · Placeholders used the browser default #757575 = 3.74:1.
test('CQ-008 Maker placeholders pass', async ({ page }) => {
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();
  await page.locator('.mk-step[data-to=plants]').click();
  expect(await failures(page, '.mk-search', 'plants')).toEqual([]);
  await page.locator('.mk-step[data-to=space]').click();
  expect(await failures(page, '.mk-space', 'space')).toEqual([]);
});

// CQ-009 · Map view: empty regions at opacity .5 (2.07–2.91:1), and the
// light "your chamber" plate kept dark-mode tokens in dark mode (1.72–2.47:1).
for (const theme of THEMES) {
  test(`CQ-009 Maker map + pin card pass (${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('earthbox-theme', t), theme);
    await page.goto('/maker.html');
    await page.locator('[data-act=recipe]').first().click();
    await page.locator('.mk-step[data-to=plants]').click();
    await page.locator('[data-act=view][data-id=map]').click();
    await page.locator('[data-act=pin]').first().click();
    expect(await failures(page, '.mk-map', 'map-pin')).toEqual([]);
  });
}

// CQ-010 · Dark mode: manifesto highlighted words kept --accent on the light band = 1.57:1.
test('CQ-010 manifesto highlights pass in dark mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('earthbox-theme', 'dark'));
  await page.goto('/index.html');
  expect(await failures(page, '.manifesto-text', 'default')).toEqual([]);
});

// CQ-011 · Product "Coming soon" label (--accent-dk, 3.10:1) and footer link
// hover (--accent-dk, 3.10:1).
test('CQ-011 coming-soon label and footer link hover pass', async ({ page }) => {
  await page.goto('/product.html#V1-PP-001');
  await page.waitForSelector('#productDetail article');
  expect(await failures(page, '.pd-coming-soon', 'default')).toEqual([]);
  const link = page.locator('footer .colo-col a').first();
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  expect(await failures(page, 'footer .colo-col', 'hover')).toEqual([]);
});

// CQ-012 · Secondary buttons (Save, outlined CTAs): on hover the text turned
// --bg with no fill behind it — the label vanished (1.0:1).
for (const theme of THEMES) {
  test(`CQ-012 secondary button keeps its label on hover (${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('earthbox-theme', t), theme);
    await page.goto('/product.html#V1-PLT-005');
    const btn = page.locator('.pd-buy .save-btn');
    await btn.scrollIntoViewIfNeeded();
    await page.addStyleTag({ content: '*{transition:none!important} .cursor-ring,.cursor-dot{display:none!important}' });
    await btn.hover();
    expect(await failures(page, '.pd-buy .save-btn', 'hover')).toEqual([]);
  });
}

// CQ-013 · Focus rings that currentColor got wrong: the WhatsApp button
// (white ring on the page, 1.07:1), the selected material chip (light ring
// outside a dark chip, 1.10:1) and the header theme toggle (1.56:1).
for (const theme of THEMES) {
  test(`CQ-013 rings on filled controls and in the header pass (${theme})`, async ({ page }) => {
    await page.addInitScript(t => localStorage.setItem('earthbox-theme', t), theme);
    const bad = [];
    for (const [url, sel] of [['/about.html', '.floating-wa'], ['/product.html#V1-PLT-005', '.pd-selector-btn.active[data-material]'], ['/product.html#V1-PLT-005', '.runhead .theme-toggle']]) {
      await page.goto(url);
      await page.waitForLoadState('load');
      await page.addStyleTag({ content: '*{transition:none!important;animation-duration:0s!important}' });
      const el = page.locator(sel).first();
      await el.scrollIntoViewIfNeeded();
      await page.keyboard.press('Shift');
      await el.focus();
      const rings = (await page.evaluate(scanPage, { scope: sel, state: 'focus' })).filter(r => r.kind === 'focus-ring');
      expect(rings.length, `no focus ring measured on ${sel}`).toBeGreaterThan(0);
      const found = [...rings.filter(r => r.status !== 'review'), ...await resolveBatch(page, rings.filter(r => r.status === 'review'))];
      bad.push(...found.filter(r => r.status !== 'pass').map(r => `${r.status} ${r.ratio}:1 ${r.fg} on ${r.bg} — ${sel}`));
    }
    expect(bad).toEqual([]);
  });
}
