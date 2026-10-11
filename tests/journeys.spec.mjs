// User journeys and failure paths — the behaviours smoke.spec doesn't reach.
// External services are mocked (Web3Forms, wa.me); nothing real is sent.
import { test, expect } from '@playwright/test';

const errorsOf = (page) => {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  return errs;
};
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => { if (!sessionStorage.getItem('qa')) { localStorage.clear(); sessionStorage.setItem('qa', '1'); } sessionStorage.setItem('earthbox-loader-seen', '1'); });
  await context.route('**/*.mp4', r => r.abort());
  await context.route('https://wa.me/**', r => r.fulfill({ body: 'wa' }));
});

// ── Enquiry form (Web3Forms) ─────────────────────────────────────────
async function openForm(page){
  await page.goto('/product.html#V1-PLT-005');
  const wrap = page.locator('.enquiry-alt').first();
  await wrap.locator('summary').click();
  return wrap;
}
test.describe('enquiry form', () => {
  test.skip(({ isMobile }) => isMobile, 'the email form is the desktop route; phones use WhatsApp');

  test('success: thanks the visitor and hides the form', async ({ page }) => {
    let body;
    await page.route('https://api.web3forms.com/**', r => { body = r.request().postDataJSON(); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    const f = await openForm(page);
    await f.locator('input[name=name]').fill('QA');
    await f.locator('input[name=email]').fill('qa@example.com');
    await f.locator('button[type=submit]').click();
    await expect(f.locator('.enquiry-status')).toContainText('Thank you');
    await expect(f.locator('form')).toBeHidden();
    expect(body.product).toContain('Stackable');            // the message carries what was asked about
    expect(body.botcheck).toBe('');
  });

  test('server error: says so, offers email, lets them retry', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false,"message":"down"}' }));
    const f = await openForm(page);
    await f.locator('input[name=name]').fill('QA');
    await f.locator('input[name=email]').fill('qa@example.com');
    await f.locator('button[type=submit]').click();
    await expect(f.locator('.enquiry-status')).toContainText('aayush.lilani@gmail.com');
    await expect(f.locator('button[type=submit]')).toBeEnabled();
  });

  test('offline: network failure is reported, not swallowed', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', r => r.abort('internetdisconnected'));
    const f = await openForm(page);
    await f.locator('input[name=name]').fill('QA');
    await f.locator('input[name=email]').fill('qa@example.com');
    await f.locator('button[type=submit]').click();
    await expect(f.locator('.enquiry-status')).toContainText('aayush.lilani@gmail.com');
  });

  test('invalid input is not sent', async ({ page }) => {
    let sent = 0;
    await page.route('https://api.web3forms.com/**', r => { sent++; r.fulfill({ status: 200, body: '{"success":true}' }); });
    const f = await openForm(page);
    await f.locator('input[name=email]').fill('not-an-email');
    await f.locator('button[type=submit]').click();
    await page.waitForTimeout(400);
    expect(sent).toBe(0);
  });
});

// ── Product page ─────────────────────────────────────────────────────
test('price, WhatsApp message and cart line follow the chosen size + material', async ({ page, isMobile }) => {
  const errs = errorsOf(page);
  await page.goto('/product.html#V1-PLT-005');
  await page.locator('[data-variant="small-circle"]').click();
  await page.locator('[data-material="asa"]').click();
  await expect(page.locator('#pdPrice')).toHaveText('₹799');
  const wa = decodeURIComponent(await page.locator('#pdEnquiryCta').getAttribute('href'));
  expect(wa).toContain('Stackable Planter (Small Circle) in ASA');
  expect(wa).toContain('₹799');
  await page.locator(isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]').click();
  await expect(page.locator('dialog.ct .ct-line--fixed .ct-sub')).toContainText('Small Circle · ASA');
  await expect(page.locator('dialog.ct .ct-price').first()).toHaveText('₹799');
  expect(errs).toEqual([]);
});

// ── Catalogue search ─────────────────────────────────────────────────
test('catalogue search: results, empty state, close with Escape', async ({ page }) => {
  await page.goto('/products.html');
  await page.locator('#catalogueSearchBtn').click();
  await page.fill('#cat-search', 'moss');
  await expect(page.locator('#searchResultsList > *').first()).toBeVisible();
  await page.fill('#cat-search', 'zzqx');
  await expect(page.locator('#searchEmpty')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#catalogueSearchOverlay')).toBeHidden();
});

// ── Theme ────────────────────────────────────────────────────────────
test('theme choice survives a reload and another page', async ({ page, isMobile }) => {
  await page.goto('/index.html');
  const before = await page.locator('html').getAttribute('data-theme');
  if (isMobile) { await page.locator('.hamburger').click(); await page.locator('.theme-toggle-mobile').click(); }
  else await page.locator('.runhead .theme-toggle').click();
  const after = await page.locator('html').getAttribute('data-theme');
  expect(after).not.toBe(before);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', after);
  await page.goto('/about.html');
  await expect(page.locator('html')).toHaveAttribute('data-theme', after);
});

// ── Keyboard ─────────────────────────────────────────────────────────
test('cart drawer by keyboard: opens, takes focus, Escape returns focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard journey');
  await page.goto('/products.html');
  const btn = page.locator('[data-open=cart]');
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog.ct')).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement.closest('dialog.ct'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog.ct')).toBeHidden();
  expect(await page.evaluate(() => document.activeElement?.dataset.open)).toBe('cart');
});

test('guided search by keyboard: Escape closes and returns focus', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard journey');
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();
  await page.locator('.mk-step[data-to=plants]').click();
  const open = page.locator('[data-act=guide]');
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mkGuide')).toBeVisible();
  expect(await page.evaluate(() => !!document.activeElement.closest('#mkGuide'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mkGuide')).toBeHidden();
  expect(await page.evaluate(() => document.activeElement?.dataset.act)).toBe('guide');
});

// ── Cart storage ─────────────────────────────────────────────────────
test('cart stays in step across two tabs', async ({ context, isMobile }) => {
  const a = await context.newPage(), b = await context.newPage();
  await a.goto('/product.html#V1-PLT-006');
  await b.goto('/about.html');
  await a.locator(isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]').click();
  await expect(b.locator('[data-cart-count]').first()).toHaveText('1');
});

test('private mode (storage throws): the cart still works on the page', async ({ page, isMobile }) => {
  const errs = errorsOf(page);
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError'); }; });
  await page.goto('/product.html#V1-PLT-006');
  await page.locator(isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]').click();
  await expect(page.locator('dialog.ct .ct-line')).toHaveCount(1);
  expect(errs).toEqual([]);
});

test('tampered cart storage is cleaned, not crashed on', async ({ page }) => {
  const errs = errorsOf(page);
  await page.addInitScript(() => localStorage.setItem('earthbox-cart', '{"cart":[{"kind":"product","sku":"NOPE"},{"kind":"build","code":"c=<script>"},"x",{"kind":"product","sku":"V1-PLT-006","material":"petg","qty":"9999"}],"saved":"nope"}'));
  await page.goto('/products.html');
  await expect(page.locator('[data-cart-count]').first()).toHaveText('20');   // one valid line, qty clamped to 20
  expect(errs).toEqual([]);
});

// ── Maker ────────────────────────────────────────────────────────────
test('Maker: a design survives a reload (resume)', async ({ page }) => {
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();
  await page.locator('.mk-step[data-to=review]').click();
  await page.reload();
  await expect(page.locator('#mkResume')).toBeVisible({ timeout: 15_000 });   // the Maker is the heaviest page
});

test('Maker: a shared link opens the same design; a bad link is ignored safely', async ({ page }) => {
  const errs = errorsOf(page);
  await page.goto('/maker.html#c=MossBox&s=studio&p=PLT-036,PLT-037&n=QA%20World');
  await expect(page.locator('.mk-sum')).toContainText('2 plants', { timeout: 15_000 });
  await page.goto('/maker.html#c=NotAChamber&p=<img>');
  await expect(page.locator('#maker')).toBeVisible();
  expect(errs).toEqual([]);
});

test('Maker: if 3D files fail to load, the drawing preview is shown', async ({ page }) => {
  const errs = errorsOf(page);
  await page.route('**/scripts/vendor/three*', r => r.abort());
  await page.route('**/*.glb', r => r.abort());
  await page.goto('/maker.html#c=DarkBox&s=SOIL-001&p=PLT-041');
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(page.locator('#mkPreview svg').first()).toBeVisible();
  expect(errs).toEqual([]);
});

test('Maker: plant models failing falls back to drawn plants, no errors', async ({ page }) => {
  const errs = errorsOf(page);
  await page.route('**/*.glb', r => r.abort());
  await page.goto('/maker.html#c=DarkBox&s=SOIL-001&p=PLT-041');
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(page.locator('#mkPreview canvas, #mkPreview svg').first()).toBeVisible();
  expect(errs).toEqual([]);
});

// ── Routing ──────────────────────────────────────────────────────────
test('unknown product link shows "not found" with a way back', async ({ page }) => {
  await page.goto('/product.html#DOES-NOT-EXIST');
  await expect(page.locator('#pdNotFound')).toBeVisible();
  await expect(page.locator('#pdNotFound a')).toHaveAttribute('href', /products\.html/);
});
