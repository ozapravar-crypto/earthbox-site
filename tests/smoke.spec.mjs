// Smoke tests: every page loads clean, and the paths that broke before stay
// fixed. One test per behaviour; each names the bug it guards.
import { test, expect } from '@playwright/test';

// Missing files the client still owes (mirrors KNOWN_MISSING in check-assets.mjs).
const KNOWN_404 = [/bird-feeder/];

const PAGES = ['/', '/products.html', '/product.html#V1-PLT-005', '/product.html#MossBox', '/product.html#V1-PP-001',
  '/maker.html', '/blog.html', '/blog/designing-drainage.html', '/about.html'];

// Collect page errors + failed requests for the whole test.
function watch(page){
  const problems = [];
  page.on('pageerror', e => problems.push(`error: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400 && !KNOWN_404.some(k => k.test(r.url()))) problems.push(`${r.status()} ${r.url()}`); });
  return problems;
}
// Clear the cart/maker state, skip the once-per-session intro loader.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { if (!sessionStorage.getItem('eb-test')) { localStorage.clear(); sessionStorage.setItem('eb-test', '1'); } });
});

for (const path of PAGES) {
  test(`loads clean: ${path}`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(path);
    await expect(page.locator('h1:visible').first()).toBeVisible();
    await expect(page.locator('.runhead-bag')).toBeVisible();          // cart reached every page
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'no sideways scroll').toBeLessThanOrEqual(0);
    expect(problems).toEqual([]);
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
  const add = isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]';
  await page.goto('/product.html#V1-PLT-006');                          // Capsule Planter, PETG ₹429
  await page.locator(add).click();
  await expect(page.locator('dialog.ct .ct-line--fixed')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await page.goto('/product.html#MossBox');                             // range ₹6,000 – ₹9,000
  await page.locator(add).click();
  await page.keyboard.press('Escape');
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();
  for (let i = 0; i < 6 && await page.locator('[data-act=next]').count(); i++) await page.locator('[data-act=next]').click();
  await page.locator('.mk-send [data-add-line]').click();
  const d = page.locator('dialog.ct');
  await expect(d.locator('.ct-line')).toHaveCount(3);
  await expect(d.locator('.ct-line--custom .ct-parts-total')).toContainText('Build estimate');
  await expect(d.locator('.ct-row--total')).toContainText('₹12,429');   // 429 + 6,000 + 6,000 (Misty Forest = Moss)
  await expect(page.locator('[data-cart-count]').first()).toHaveText('3');
  // Remove → Undo puts it back.
  await d.locator('[data-ct=remove]').first().click();
  await expect(d.locator('.ct-line')).toHaveCount(2);
  await d.locator('[data-ct=undo]').click();
  await expect(d.locator('.ct-line')).toHaveCount(3);
});

test('guided search opens centred and its answers filter the list', async ({ page, isMobile }) => {
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

test('mobile menu lists the Maker and marks Journal on articles', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/blog/designing-drainage.html');
  await page.locator('.hamburger').click();
  await expect(page.locator('#mobile-nav a', { hasText: 'Maker' })).toBeVisible();
  await expect(page.locator('#mobile-nav a[aria-current=page]')).toHaveText('Journal');
});
