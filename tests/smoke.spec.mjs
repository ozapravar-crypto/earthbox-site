// Smoke tests: every page loads clean, and the paths that broke before stay
// fixed. One test per behaviour; each names the bug it guards.
import { test, expect } from '@playwright/test';

// Missing files the client still owes (mirrors KNOWN_MISSING in check-assets.mjs).
const KNOWN_404 = [/bird-feeder/];

const PAGES = ['/', '/products.html', '/product.html#V1-PLT-005', '/product.html#MossBox', '/product.html#V1-PP-001',
  '/maker.html', '/blog.html', '/blog/designing-drainage.html', '/about.html', '/privacy.html', '/care.html'];

// Collect page errors + failed requests for the whole test.
function watch(page){
  const problems = [];
  page.on('pageerror', e => problems.push(`error: ${e.message}`));
  // The local server sends vercel.json's CSP (no inline scripts): any block is a bug.
  page.on('console', m => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) problems.push(`csp: ${m.text().slice(0, 160)}`); });
  page.on('response', r => { if (r.status() >= 400 && !KNOWN_404.some(k => k.test(r.url()))) problems.push(`${r.status()} ${r.url()}`); });
  return problems;
}
// Clear the cart/maker state, skip the once-per-session intro loader.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('eb-test')) { localStorage.clear(); sessionStorage.setItem('eb-test', '1'); } });
});

for (const path of PAGES) {
  test(`loads clean: ${path}`, async ({ page }) => {
    const problems = watch(page), heavy = [];
    page.on('request', r => { if (/plants3d\/|GLTFLoader|three\.module/.test(r.url())) heavy.push(r.url()); });
    await page.goto(path);
    await expect(page.locator('h1:visible').first()).toBeVisible();
    await expect(page.locator('.runhead-bag')).toBeVisible();          // cart reached every page
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'no sideways scroll').toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
    if (!path.startsWith('/maker')) expect(heavy, 'three.js and plant models load on the Maker only').toEqual([]);
    // No template leaks ("From ₹[object Object]" shipped on the catalogue, 10 Oct 2026).
    expect(await page.locator('body').innerText()).not.toMatch(/\[object |\bundefined\b|\bNaN\b/);
    // Footer icons stay icon-sized. On privacy.html they rendered 1440px wide:
    // the footer CSS lives in home.css, which a new page forgot to load (11 Oct 2026).
    const icons = await page.locator('footer.colophon svg').evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().width)));
    expect(icons.length).toBeGreaterThan(0);
    expect(icons.filter(w => w > 48), 'oversized footer icons').toEqual([]);
  });
}

test('Journal diagrams load inside /blog/ (were 404: relative paths)', async ({ page }) => {
  await page.goto('/blog/designing-drainage.html');
  const imgs = page.locator('#articleBody img');
  expect(await imgs.count()).toBeGreaterThan(0);
  // Ask the server for each one (SVGs can report naturalWidth 0 even when fine).
  for (const src of await imgs.evaluateAll(list => list.map(i => i.src)))
    expect((await page.request.get(src)).status(), src).toBe(200);
  await expect(page.locator('.related-section')).toHaveCount(1);       // prerender once duplicated it
});

test('review badge scrolls, keeps the product (was a blank page)', async ({ page }) => {
  await page.goto('/product.html#V1-PLT-005');
  await page.locator('a.pd-rating-badge').click();
  await expect(page).toHaveURL(/#V1-PLT-005$/);
  await expect(page.locator('#productDetail article h1')).toHaveText('Stackable Planter');
  await expect(page.locator('#reviews')).toBeInViewport();
});

test('cart tallies a priced piece, an enquiry piece and a Maker build', async ({ page, isMobile }) => {
  test.slow();   // the Maker draws 3D in software on CI: ~30 s of the 45 s budget already on main (bead: Maker CI speed)
  const add = isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]';
  await page.goto('/product.html#V1-PLT-006');                          // Capsule Planter, PETG ₹429
  await page.locator(add).click();
  await expect(page.locator('dialog.ct .ct-line--fixed')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.goto('/product.html#MossBox');                             // coming soon: register interest, no cart button
  await expect(page.locator('.pd-buy [data-add-line], #pdMobileCta [data-add-line]')).toHaveCount(0);
  await page.goto('/product.html#V1-PLT-001');                          // TerraMesh Planter: price on enquiry
  await page.locator(add).click();
  await page.keyboard.press('Escape');
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();
  for (let i = 0; i < 6 && await page.locator('[data-act=next]').count(); i++) await page.locator('[data-act=next]').click();
  await page.locator('.mk-send [data-add-line]').click();
  const d = page.locator('dialog.ct');
  await expect(d.locator('.ct-line')).toHaveCount(3);
  await expect(d.locator('.ct-line--custom .ct-parts-total')).toContainText('Build estimate');
  await expect(d.locator('.ct-row--total')).toContainText('₹6,429');    // 429 + the build's 6,000 (Misty Forest = Moss); TerraMesh quoted
  await expect(page.locator('[data-cart-count]').first()).toHaveText('3');
  // Remove → Undo puts it back.
  await d.locator('[data-ct=remove]').first().click();
  await expect(d.locator('.ct-line')).toHaveCount(2);
  await d.locator('[data-ct=undo]').click();
  await expect(d.locator('.ct-line')).toHaveCount(3);
});

test('guided search opens centred and its answers filter the list', async ({ page, isMobile }) => {
  test.slow();   // the Maker draws 3D in software on CI: ~30 s of the 45 s budget already on main (bead: Maker CI speed)
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();
  await page.locator('[data-act=goto][data-to=plants]').click();
  await page.locator('[data-act=guide]').click();
  const g = page.locator('#mkGuide');
  await expect(g).toBeVisible();
  if (!isMobile) {                                                      // was stuck top-left
    const b = await g.boundingBox(), vw = page.viewportSize().width;
    expect(Math.abs(b.x + b.width / 2 - vw / 2)).toBeLessThan(4);
  }
  await g.locator('input[name=gd-look][value=woodland]').check({ force: true });
  while (await g.locator('[data-act=gd-next]').count()) await g.locator('[data-act=gd-next]').click();
  await g.locator('[data-act=gd-apply]').click();
  await expect(g).toBeHidden();
  await expect(page.locator('#mkResults')).toContainText('Woodland');   // the answer became a removable chip
});

test('Maker preview renders (3D, or the drawing without WebGL)', async ({ page }) => {
  await page.goto('/maker.html#c=DarkBox&s=SOIL-001&p=PLT-041');
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(page.locator('#mkPreview canvas, #mkPreview svg').first()).toBeVisible();
});

test('Maker 3D preview loads its plant models (.glb), no errors', async ({ page }) => {
  const problems = watch(page), glbs = [];
  page.on('response', r => { if (r.url().endsWith('.glb')) glbs.push(r.status()); });
  await page.goto('/maker.html#c=DarkBox&s=SOIL-001&p=PLT-041,PLT-042');
  test.skip(!(await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'))), 'no WebGL here: the drawings are the fallback');
  await expect(page.locator('#mkPreview canvas')).toBeVisible();
  await expect.poll(() => glbs.length, { timeout: 15_000 }).toBeGreaterThan(0);
  await page.waitForLoadState('networkidle');
  expect(glbs.every(s => s === 200), 'every model file loads').toBe(true);
  expect(problems).toEqual([]);
});

test('mobile menu lists the Maker; the Journal is in the footer, not the top menus', async ({ page, isMobile }) => {
  await page.goto('/blog/designing-drainage.html');
  await expect(page.locator('.runhead-nav a', { hasText: 'Journal' })).toHaveCount(0);
  await expect(page.locator('footer.colophon a', { hasText: 'Journal' })).toHaveCount(1);
  if (!isMobile) return;
  await page.locator('.hamburger').click();
  await expect(page.locator('#mobile-nav a', { hasText: 'Maker' })).toBeVisible();
  await expect(page.locator('#mobile-nav a', { hasText: 'Journal' })).toHaveCount(0);
});

// Header at every width from phone to wide desktop: nothing wraps, nothing
// collides, no sideways scroll. (Tablets 721–1080px wrapped "Saved 0 /
// Cart 0" under the full nav until 11 Oct 2026; the menu now covers them.)
test('header fits at every width', async ({ page: p }) => {
  const bad = [];
  await p.addInitScript(() => sessionStorage.setItem('earthbox-loader-seen', '1'));
  await p.goto('/about.html');
  for (const w of [360, 390, 600, 721, 820, 1024, 1080, 1081, 1180, 1280, 1440, 1920]) {
    await p.setViewportSize({ width: w, height: 900 });
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const els = [...document.querySelectorAll('.runhead-left, .runhead-nav a, .runhead-bag-btn, .runhead .theme-toggle, .hamburger')].filter(e => e.checkVisibility());
      const boxes = els.map(e => e.getBoundingClientRect());
      const wrap = els.filter(e => e.matches('.runhead-bag-btn, .runhead-nav a')).some(e => e.getBoundingClientRect().height > 48);
      let hit = false;
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) hit = true; }
      return { wrap, hit, over: document.documentElement.scrollWidth - innerWidth };
    });
    if (r.wrap || r.hit || r.over > 0) bad.push(`${w}px ${JSON.stringify(r)}`);
  }
  expect(bad).toEqual([]);
});

// Pages must not jump while they load (CLS < 0.1, "good" in Core Web
// Vitals). Caught: JS-drawn content pushing the footer (0.74), late Google
// fonts, and scrambled headings wrapping mid-animation (QA-002/009/013).
for (const path of ['/index.html', '/products.html', '/product.html#V1-PLT-005', '/product.html#MossBox', '/blog/designing-drainage.html']) {
  test(`no layout jump while loading: ${path}`, async ({ browser, isMobile }, info) => {
    test.skip(isMobile || info.project.name !== 'desktop', 'runs once, at Lighthouse\'s phone size');
    // Real motion (the suite defaults to reduced motion, which skips the scramble).
    const page = await browser.newPage({ viewport: { width: 412, height: 823 }, baseURL: info.project.use.baseURL, reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      sessionStorage.setItem('earthbox-loader-seen', '1');
      window.__cls = 0;
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    });
    await page.route('**/*.mp4', r => r.abort());
    await page.goto(path);
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.1);
    await page.close();
  });
}

// Clean URLs (cleanUrls in vercel.json, 11 Oct 2026): the site links to
// "/", "/products", "/blog/<slug>", never to "index.html" or "*.html".
// Locally qa/serve.mjs resolves them like Vercel does.
test('clean URLs: pages load without .html, and no internal link exposes .html', async ({ page }) => {
  const bad = [];
  for (const path of ['/', '/products', '/product#V1-PLT-005', '/maker', '/care', '/blog', '/blog/designing-drainage', '/about', '/privacy']) {
    const res = await page.goto(path);
    expect(res.status(), path).toBe(200);
    await expect(page.locator('h1:visible').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    const links = await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')));
    bad.push(...links.filter(h => /\.html(\b|#|\?|$)/.test(h) && !/^(https?:)?\/\/(?!(www\.)?earthbox\.in)/.test(h)).map(h => `${path} → ${h}`));
  }
  expect([...new Set(bad)]).toEqual([]);
});

// Unknown address → the branded 404 (site-ez9), with a real 404 status so
// search engines don't index it, and a way back into the site.
test('unknown address shows the branded 404 with a way back', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('Nothing grows here');
  await expect(page.getByRole('link', { name: 'Browse the catalogue' })).toHaveAttribute('href', '/products');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex');
});

// Only the website is served (scripts/dist.mjs allow-list, discovery R2):
// tests, QA tools, CI config, beads and build tools must 404.
test('tooling files are not served', async ({ request }) => {
  const open = [];
  for (const p of ['/tests/smoke.spec.mjs', '/scripts/cart.test.mjs', '/scripts/includes.mjs', '/qa/serve.mjs', '/qa/contrast/baseline.json',
    '/.github/workflows/qa.yml', '/.beads/config.yaml', '/.githooks/pre-push', '/vercel.json', '/package.json', '/eslint.config.js',
    '/lighthouserc.json', '/playwright.config.mjs', '/README.md', '/CARE-PLAN.md', '/assets/og-templates/', '/scripts/vendor/README.md']) {
    const r = await request.get(p);
    if (r.status() !== 404) open.push(`${p} → ${r.status()}`);
  }
  expect(open).toEqual([]);
  expect((await request.get('/assets/plants3d/CREDITS.md')).status(), 'CC BY credits must stay reachable').toBe(200);
});
