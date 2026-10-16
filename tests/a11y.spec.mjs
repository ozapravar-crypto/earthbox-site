// Accessibility: every page and its open states against axe-core's WCAG 2.1
// A/AA rules. Colour contrast is measured separately and more strictly by
// qa/contrast (pixels, not CSS guesses), so it's excluded here.
import { test, expect } from '@playwright/test';
import { quietStart } from './helpers.mjs';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(quietStart);

/** @typedef {import('@playwright/test').Page} Page */

/** @param {Page} page @param {string | null} [include] */
const scan = async (page, include) => {
  const b = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).disableRules(['color-contrast']);
  if (include) b.include(include);
  const r = await b.analyze();
  return r.violations.map(v => `${v.id} (${String(v.impact)}) ×${v.nodes.length}: ${v.help} — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`);
};

const PAGES = ['/index.html', '/products.html', '/product.html#V1-PLT-005', '/product.html#MossBox', '/product.html#VIV-III',
  '/product.html#NOPE', '/product/V1-PLT-005', '/maker.html', '/blog.html', '/blog/designing-drainage.html', '/about.html', '/privacy.html', '/care.html', '/404.html'];

for (const path of PAGES) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState('load');
    expect(await scan(page)).toEqual([]);
  });
}

/** @type {[string, string, (p: Page) => Promise<void>, string | null][]} */
const STATES = [
  ['cart drawer', '/product.html#V1-PLT-006', async p => { await p.locator('.pd-buy [data-add-line], #pdMobileCta [data-add-line]').first().click(); }, 'dialog.ct'],
  ['saved tab', '/products.html', async p => { await p.locator('[data-open=saved]').click(); }, 'dialog.ct'],
  ['guided search', '/maker.html', async p => { await p.locator('[data-act=recipe]').first().click(); await p.locator('.mk-step[data-to=plants]').click(); await p.locator('[data-act=explore]').click(); await p.locator('[data-act=guide]').click(); }, '#mkGuide'],
  ['maker map', '/maker.html', async p => { await p.locator('[data-act=recipe]').first().click(); await p.locator('.mk-step[data-to=plants]').click(); await p.locator('[data-act=explore]').click(); await p.locator('[data-act=view][data-id=map]').click(); }, null],
  ['maker review', '/maker.html', async p => { await p.locator('[data-act=recipe]').first().click(); await p.locator('.mk-step[data-to=review]').click(); }, null],
  ['catalogue search', '/products.html', async p => { await p.locator('#catalogueSearchBtn').click(); await p.fill('#cat-search', 'moss'); }, null],
  ['enquiry form open', '/product.html#V1-PLT-005', async p => { await p.locator('.pd-other-ways > summary').click(); await p.locator('.enquiry-alt summary').first().click(); }, null],
  ['care: own plants, visits', '/care.html', async p => { const c = p.locator('#carePlanner'); await c.getByText('My own plants').click(); await c.getByText('Visits from the studio').click(); }, '#carePlanner'],
  ['care: kits', '/care.html', async p => { await p.locator('#carePlanner').getByRole('checkbox', { name: /^Moss/ }).check(); }, '#carePlanner'],
  ['product points open', '/product#SporeBox', async p => { await p.locator('.pd-point').nth(1).click(); }, '[data-points]'],
  ['cart with suggestions', '/maker#c=MossBox&s=studio&p=PLT-036', async p => { await p.locator('.mk-step[data-to=review]').click(); await p.locator('[data-key=cart]').click(); }, 'dialog.ct']
];
for (const [name, path, setup, include] of STATES) {
  test(`a11y state: ${name}`, async ({ page, isMobile }) => {
    test.skip(isMobile && name === 'enquiry form open', 'desktop-only form');
    await page.goto(path);
    await page.waitForLoadState('load');
    await setup(page);
    await page.waitForTimeout(300);
    expect(await scan(page, include)).toEqual([]);
  });
}

test('a11y state: mobile menu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/index.html');
  await page.locator('.hamburger').click();
  await page.waitForTimeout(300);
  expect(await scan(page, '#mobile-nav')).toEqual([]);
});

// Guard against a scan that silently checks nothing: plant two real defects
// and require axe to report both.
test('a11y self-test: the scan catches planted defects', async ({ page }) => {
  await page.goto('/about.html');
  await page.evaluate(() => {
    const img = document.createElement('img'); img.src = 'assets/logo.webp'; /** @type {HTMLElement} */ (document.querySelector('main')).append(img);   // no alt
    const b = document.createElement('button'); /** @type {HTMLElement} */ (document.querySelector('main')).append(b);                                 // no name
  });
  const found = (await scan(page)).join('\n');
  expect(found).toContain('image-alt');
  expect(found).toContain('button-name');
});

test.describe('cookie banner', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('a11y state: cookie banner (incl. contrast)', async ({ page }) => {
    await page.goto('/about.html');
    await page.locator('.consent').waitFor();
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).include('.consent').analyze();
    expect(r.violations.map(v => `${v.id}: ${v.help}`)).toEqual([]);
    await page.keyboard.press('Tab');   // reachable by keyboard (skip link first, then on through the page)
  });
});
