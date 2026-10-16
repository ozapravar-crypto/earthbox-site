// Scroll motion (scripts/motion-scroll.js): smooth scroll, parallax, text
// fade in/out. The rest of the suite runs with reduced motion, so these
// tests turn motion on explicitly, and also check it stays off when asked.
import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'desktop: smooth scroll is mouse/trackpad only (phones checked below)');

/** @typedef {NonNullable<Window['__earthboxLenis']>} Lenis */

/**
 * @param {import('@playwright/test').Browser} browser @param {import('@playwright/test').TestInfo} info
 * @param {import('@playwright/test').BrowserContextOptions} [opts]
 */
const open = async (browser, info, opts = {}) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, baseURL: info.project.use.baseURL, reducedMotion: 'no-preference', ...opts });
  await page.addInitScript(() => { sessionStorage.setItem('earthbox-loader-seen', '1'); localStorage.setItem('earthbox-consent', 'denied'); });
  await page.route('**/*.mp4', r => r.abort());
  return page;
};
/** @param {import('@playwright/test').Page} page @param {number} at */
const toHeading = (page, at) => page.evaluate((at) => {
  const h = /** @type {Element} */ (document.querySelector('#principles h2'));
  /** @type {Lenis} */ (window.__earthboxLenis).scrollTo(scrollY + h.getBoundingClientRect().top - innerHeight * at, { immediate: true });
}, at);

test('smooth scroll: a wheel turn glides instead of jumping', async ({ browser }, info) => {
  const page = await open(browser, info);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/\blenis\b/);
  await page.mouse.move(700, 450);
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(60);
  const early = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1200);
  const settled = await page.evaluate(() => scrollY);
  expect(early).toBeGreaterThan(0);
  expect(early).toBeLessThan(settled * .8);                 // still easing after 60 ms
  await page.close();
});

test('parallax: images drift as they cross the screen, inside their frame', async ({ browser }, info) => {
  const page = await open(browser, info);
  await page.goto('/');
  await page.waitForFunction(() => window.__earthboxLenis);
  const hero = page.locator('.hero-bg img');
  await page.waitForTimeout(300);
  const a = await hero.evaluate(el => el.style.transform);
  await page.evaluate(() => /** @type {Lenis} */ (window.__earthboxLenis).scrollTo(400, { immediate: true }));
  await page.waitForTimeout(300);
  const b = await hero.evaluate(el => el.style.transform);
  expect(a).toMatch(/scale\(/);
  expect(b).not.toBe(a);
  await page.close();
});

test('text fades in from the bottom, holds in the middle, fades under the header', async ({ browser }, info) => {
  const page = await open(browser, info);
  await page.goto('/');
  await page.waitForFunction(() => window.__earthboxLenis);           // smooth scroll loads after first paint
  const h = page.locator('#principles h2');
  const op = async () => +(await h.evaluate(el => el.style.opacity || '1'));
  await toHeading(page, .92); await page.waitForTimeout(300);
  expect(await op()).toBeLessThan(.7);
  await toHeading(page, .5); await page.waitForTimeout(300);
  expect(await op()).toBe(1);
  await toHeading(page, -.05); await page.waitForTimeout(300);
  expect(await op()).toBeLessThan(1);
  // never on commercial or form text
  await page.goto('/product#V1-PLT-005');
  await expect(page.locator('#pdPrice')).toBeVisible();
  expect(await page.locator('.pd-page h1, #pdPrice').evaluateAll(els => els.map(e => e.style.opacity))).toEqual(['', '']);
  await page.close();
});

test('smooth scroll pauses while a drawer is open', async ({ browser }, info) => {
  const page = await open(browser, info);
  await page.goto('/product#V1-PLT-006');
  await page.locator('.pd-buy [data-add-line]').click();
  await expect(page.locator('html')).toHaveClass(/lenis-stopped/);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/);
  await page.close();
});

test('off for reduced motion, and no smoothing on touch phones', async ({ browser }, info) => {
  const rm = await open(browser, info, { reducedMotion: 'reduce' });
  await rm.goto('/');
  await rm.waitForTimeout(500);
  await expect(rm.locator('html')).not.toHaveClass(/\blenis\b/);
  expect(await rm.locator('.hero-bg img').evaluate(el => el.style.transform)).toBe('');
  expect(await rm.locator('main h2').evaluateAll(els => els.some(e => e.style.opacity))).toBe(false);
  await rm.close();
  const phone = await open(browser, info, { viewport: { width: 412, height: 839 }, hasTouch: true, isMobile: true });
  await phone.goto('/');
  await phone.waitForTimeout(500);
  await expect(phone.locator('html')).not.toHaveClass(/\blenis\b/);
  await phone.close();
});
