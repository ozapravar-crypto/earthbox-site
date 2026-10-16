// Visual regression: key pages and states compared with committed baselines
// (tests/visual.spec.mjs-snapshots/). Moving or live parts are masked: the
// home film, the 3D canvas, the custom cursor. Update after an intended
// design change: npx playwright test tests/visual.spec.mjs --update-snapshots
import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { sessionStorage.setItem('earthbox-loader-seen', '1'); localStorage.setItem('earthbox-theme', 'light'); });
  await context.route('**/*.mp4', r => r.abort());
});

/** @typedef {import('@playwright/test').Page} Page */

/** @param {Page} page */
async function settle(page){
  await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}
    .cursor-ring,.cursor-dot{display:none!important}` });
  // Wait for the page to finish: JS-rendered lists (Journal grid, catalogue)
  // and web fonts. A baseline once caught the Journal before either arrived.
  await page.waitForLoadState('networkidle');
  // networkidle can fire before the page scripts finish under load (a capture
  // once showed "Loading…" with no Saved/Cart). Wait for the scripts' marks,
  // then for the page to stop changing for 600 ms (at most 4 s).
  await page.waitForFunction(() => document.querySelector('[data-cart-count]') && ![...document.querySelectorAll('.caption')].some(e => e.textContent.includes('Loading') && e.checkVisibility()));
  await page.evaluate(() => /** @type {Promise<void>} */ (new Promise(done => { let t = /** @type {ReturnType<typeof setTimeout> | undefined} */ (undefined); const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => { mo.disconnect(); done(); }, 600); }); mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true }); t = setTimeout(() => { mo.disconnect(); done(); }, 600); setTimeout(() => { mo.disconnect(); done(); }, 4000); })));   // ponytail: 4 s cap, the Maker's 3D preview never goes quiet (canvas is masked)
  await page.evaluate(() => document.querySelectorAll('.reveal,.reveal-line,.reveal-clip').forEach(e => e.classList.add('in')));
  // fonts.ready resolves even when a font fails to arrive, which once
  // captured a page in system fonts (Google Fonts, before self-hosting). Load each site face explicitly, and fail
  // loudly rather than compare against the wrong typeface.
  const missing = await page.evaluate(async () => {
    const faces = ['400 1em "Oranienbaum"', '400 1em "Liter"', '400 1em "Quattrocento Sans"', 'italic 400 1em "Quattrocento Sans"'];
    await Promise.all(faces.map(f => document.fonts.load(f).catch(() => [])));
    await Promise.all([...document.images].filter(i => !i.complete && i.loading !== 'lazy').map(i => i.decode().catch(() => {})));
    // fonts.check() is true when no face is registered at all, so also
    // require a face of each family to have actually loaded.
    const loaded = new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.style === 'italic' ? 'italic ' : ''}${f.family.replace(/"/g, '')}`));
    return faces.filter(f => !loaded.has(f.replace(/ ?400 1em /, ' ').replace(/"/g, '').trim()));
  });
  expect(missing, 'site fonts must be loaded before a visual comparison').toEqual([]);
  await page.waitForTimeout(500);
}
const mask = (/** @type {Page} */ page) => [page.locator('video'), page.locator('canvas')];
/** @type {{ maxDiffPixelRatio: number, animations: 'disabled' }} */
const shot = { maxDiffPixelRatio: 0.01, animations: 'disabled' };

const PAGES = [
  ['home', '/index.html'], ['catalogue', '/products.html'], ['product', '/product.html#V1-PLT-005'],
  ['chamber', '/product.html#MossBox'], ['maker-start', '/maker.html'], ['journal', '/blog.html'],
  ['article', '/blog/designing-drainage.html'], ['about', '/about.html'], ['not-found', '/product.html#NOPE'],
  ['care', '/care.html'], ['page-404', '/this-page-does-not-exist']
];
for (const [name, path] of PAGES) {
  test(`visual: ${name} (first screen)`, async ({ page }) => {
    if (name === 'maker-start') test.slow();
    await page.goto(path);
    await settle(page);
    if (name === 'maker-start') {   // the recipe stills redraw once their plant models arrive; wait for them, then settle again
      await page.waitForFunction(() => performance.getEntriesByType('resource').some(e => /plants3d\/moss-/.test(e.name)), null, { timeout: 30000 });
      await settle(page);
    }
    await expect(page).toHaveScreenshot(`${name}.png`, { ...shot, mask: mask(page) });
  });
}

/** @type {[string, string, (p: Page) => Promise<void>][]} */
const STATES = [
  ['cart-drawer', '/product.html#V1-PLT-006', async p => { await p.locator('.pd-buy [data-add-line], #pdMobileCta [data-add-line]').first().click(); }],
  ['maker-plants', '/maker.html', async p => { await p.locator('[data-act=recipe]').first().click(); await p.locator('.mk-step[data-to=plants]').click(); }],
  ['guided-search', '/maker.html', async p => { await p.locator('[data-act=recipe]').first().click(); await p.locator('.mk-step[data-to=plants]').click(); await p.locator('[data-act=guide]').click(); }],
  ['maker-review', '/maker.html', async p => { await p.locator('[data-act=recipe]').first().click(); await p.locator('.mk-step[data-to=review]').click(); }],
  ['care-visits', '/care.html', async p => { const c = p.locator('#carePlanner'); await c.getByText('Visits from the studio').click(); await c.locator('.care-result').scrollIntoViewIfNeeded(); }],
  ['product-points', '/product#SporeBox', async p => { await p.locator('.pd-point').nth(1).click(); await p.locator('[data-points]').scrollIntoViewIfNeeded(); }],
  ['cart-suggestions', '/maker#c=MossBox&s=studio&p=PLT-036', async p => { await p.locator('.mk-step[data-to=review]').click(); await p.locator('[data-key=cart]').click(); }]
];
for (const [name, path, setup] of STATES) {
  test(`visual state: ${name}`, async ({ page }) => {
    if (path.includes('maker')) test.slow();   // software 3D on CI (bead: Maker CI speed)
    await page.goto(path);
    await settle(page);
    await setup(page);
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`, { ...shot, mask: mask(page) });
  });
}

test.describe('cookie banner', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('visual state: cookie banner', async ({ page }) => {
    await page.goto('/about.html');
    await settle(page);
    await expect(page.locator('.consent')).toHaveScreenshot('cookie-banner.png', shot);
  });
});

test('visual: privacy page', async ({ page }) => {
  await page.goto('/privacy.html');
  await settle(page);
  await expect(page).toHaveScreenshot('privacy.png', { ...shot, mask: mask(page) });
});

test('visual: footer (shared on every page)', async ({ page }) => {
  await page.goto('/about.html');
  await settle(page);
  await expect(page.locator('footer.colophon')).toHaveScreenshot('footer.png', shot);
});
