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
