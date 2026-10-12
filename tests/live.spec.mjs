// Live canary: checks the real earthbox.in (production discovery R5).
// Runs weekly from .github/workflows/live.yml, or by hand:
//   LIVE=1 BASE_URL=https://www.earthbox.in npx playwright test tests/live.spec.mjs --project=desktop
// Skipped in the normal suite. The hero film is blocked (it never lets the
// network go idle) and the intro + cookie banner are skipped.
import { test, expect } from '@playwright/test';

test.skip(!process.env.LIVE, 'live canary: set LIVE=1 and BASE_URL');
const SITE = 'https://www.earthbox.in';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { sessionStorage.setItem('earthbox-loader-seen', '1'); localStorage.setItem('earthbox-consent', 'denied'); });
  await context.route('**/*.mp4', r => r.abort());
});

for (const path of ['/', '/products', '/product#V1-PLT-005', '/product#MossBox', '/maker', '/care', '/blog', '/blog/designing-drainage', '/about', '/privacy']) {
  test(`live page works: ${path}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    page.on('requestfailed', r => { if (!/\.mp4/.test(r.url())) errors.push(`failed ${r.url()}`); });   // the film is blocked on purpose
    const res = await page.goto(SITE + path, { waitUntil: 'load' });
    expect(res.status()).toBe(200);
    await expect(page.locator('h1:visible').first()).toBeVisible();
    await page.waitForTimeout(1500);
    expect(errors.filter(e => !/bird-feeder/.test(e))).toEqual([]);   // known missing photo: bead site-tue
  });
}

test('live: tooling files are not served', async ({ request }) => {
  for (const p of ['/tests/smoke.spec.mjs', '/.beads/config.yaml', '/.github/workflows/qa.yml', '/package.json', '/scripts/includes.mjs']) {
    expect((await request.get(SITE + p)).status(), p).toBe(404);
  }
});

test('live: security headers and redirects', async ({ request }) => {
  const res = await request.get(SITE + '/');
  const h = res.headers();
  expect(h['strict-transport-security']).toContain('max-age=');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['content-security-policy']).toMatch(/script-src 'self'(?![^;]*unsafe-inline)/);
  const apex = await request.get('https://earthbox.in/products', { maxRedirects: 0 });
  expect(apex.status()).toBe(308);
  expect(apex.headers().location).toBe(`${SITE}/products`);
  const old = await request.get(SITE + '/about.html', { maxRedirects: 0 });
  expect(old.status()).toBe(308);
});

// After "Accept", Google Analytics must reach Google: the CSP once blocked
// its www.google.com/g/collect hits, silently losing data (12 Oct 2026).
test('live: analytics is not blocked by the CSP after Accept', async ({ page, context }) => {
  await context.addInitScript(() => localStorage.removeItem('earthbox-consent'));
  const blocked = [];
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) blocked.push(m.text().slice(0, 140)); });
  const hits = [];
  page.on('request', r => { if (/\/g\/collect/.test(r.url())) hits.push(r.url()); });
  await page.goto(SITE + '/about', { waitUntil: 'load' });
  await page.locator('.consent [data-consent=granted]').click();
  await page.waitForTimeout(4000);
  expect(blocked).toEqual([]);
  expect(hits.length).toBeGreaterThan(0);
});
