// Shared test set-up.

/**
 * Skip the once-per-session intro loader and the hero film, so pages are
 * measured as a returning visitor sees them. Use as `test.beforeEach(quietStart)`.
 * @param {{ context: import('@playwright/test').BrowserContext }} fixtures
 */
export async function quietStart({ context }){
  await context.addInitScript(() => sessionStorage.setItem('earthbox-loader-seen', '1'));
  await context.route('**/*.mp4', r => r.abort());
}
