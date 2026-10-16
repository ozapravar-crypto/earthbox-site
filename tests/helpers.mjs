// Shared test set-up.
import { expect } from '@playwright/test';

/**
 * Skip the once-per-session intro loader and the hero film, so pages are
 * measured as a returning visitor sees them. Use as `test.beforeEach(quietStart)`.
 * @param {{ context: import('@playwright/test').BrowserContext }} fixtures
 */
export async function quietStart({ context }){
  await context.addInitScript(() => sessionStorage.setItem('earthbox-loader-seen', '1'));
  await context.route('**/*.mp4', r => r.abort());
}

/**
 * Open a Maker design link on one of its steps (the Maker's Phase 2 + 3 specs).
 * @param {import('@playwright/test').Page} page @param {string} code @param {string} step
 */
export async function openMakerAt(page, code, step){
  await page.goto(`/maker.html#${code}`);
  await page.locator(`.mk-step[data-to=${step}]`).click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', step);
}

/**
 * Journey set-up: storage cleared once per test, the cookie choice made
 * (`consent`, or none for the banner's own tests), intro skipped, film and
 * WhatsApp mocked (nothing real is sent).
 * @param {import('@playwright/test').BrowserContext} context @param {string | null} consent
 */
export async function cleanStart(context, consent){
  await context.addInitScript((c) => { if (!sessionStorage.getItem('qa')) { localStorage.clear(); if (c) localStorage.setItem('earthbox-consent', c); sessionStorage.setItem('qa', '1'); } sessionStorage.setItem('earthbox-loader-seen', '1'); }, consent);
  await context.route('**/*.mp4', r => r.abort());
  await context.route('https://wa.me/**', r => r.fulfill({ body: 'wa' }));
}
