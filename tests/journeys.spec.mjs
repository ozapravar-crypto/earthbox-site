// User journeys and failure paths — the behaviours smoke.spec doesn't reach.
// External services are mocked (Web3Forms, wa.me); nothing real is sent.
import { test, expect } from '@playwright/test';

const errorsOf = (page) => {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  return errs;
};
test.beforeEach(async ({ context }, info) => {
  // Start clean; cookie choice already made, except in the cookie tests.
  const consent = info.titlePath.includes('cookie choice') ? null : 'denied';
  await context.addInitScript((c) => { if (!sessionStorage.getItem('qa')) { localStorage.clear(); if (c) localStorage.setItem('earthbox-consent', c); sessionStorage.setItem('qa', '1'); } sessionStorage.setItem('earthbox-loader-seen', '1'); }, consent);
  await context.route('**/*.mp4', r => r.abort());
  await context.route('https://wa.me/**', r => r.fulfill({ body: 'wa' }));
});

// ── Enquiry form (Web3Forms) ─────────────────────────────────────────
async function openForm(page){
  await page.goto('/product.html#V1-PLT-005');
  await page.locator('.pd-other-ways > summary').click();          // folded under "Other ways to order"
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
  await expect(page.locator('#pdNotFound a')).toHaveAttribute('href', '/products');
});

// ── Cookie choice (consent.js) ───────────────────────────────────────
// Google Analytics must not load until "Accept". Fresh visitor = no choice.
test.describe('cookie choice', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  const gaHits = (page) => { const hits = []; page.route('https://www.googletagmanager.com/**', r => { hits.push(r.request().url()); r.fulfill({ body: '' }); }); return hits; };

  test('no analytics before a choice; Accept loads it and is remembered', async ({ page }) => {
    const hits = gaHits(page);
    await page.goto('/about.html');
    const banner = page.locator('.consent');
    await expect(banner).toBeVisible();
    await page.waitForTimeout(500);
    expect(hits).toEqual([]);
    await banner.getByRole('button', { name: 'Accept' }).click();
    await expect(banner).toBeHidden();
    await expect.poll(() => hits.length).toBeGreaterThan(0);
    await page.goto('/products.html');
    await expect(page.locator('.consent')).toHaveCount(0);
    await expect.poll(() => hits.length).toBeGreaterThan(1);
  });

  test('Decline: analytics never loads, on any page; the privacy page can reopen the choice', async ({ page }) => {
    const hits = gaHits(page);
    await page.goto('/index.html');
    await page.locator('.consent').getByRole('button', { name: 'Decline' }).click();
    await page.goto('/blog/designing-drainage.html');
    await expect(page.locator('.consent')).toHaveCount(0);
    await page.goto('/privacy.html');
    await page.waitForTimeout(500);
    expect(hits).toEqual([]);
    await page.locator('[data-consent-reset]').click();
    await expect(page.locator('.consent')).toBeVisible();
  });

  test('private mode (storage blocked): the banner still works and nothing breaks', async ({ page }) => {
    const errs = errorsOf(page);
    await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('QuotaExceededError'); }; });
    await page.goto('/about.html');
    await page.locator('.consent').getByRole('button', { name: 'Decline' }).click();
    await expect(page.locator('.consent')).toBeHidden();
    expect(errs).toEqual([]);
  });
});

// ── Care (care.html, CARE-PLAN.md) ───────────────────────────────────
const cartDrawer = (page) => page.locator('dialog.ct');
const openCart = async (page, isMobile) => { if (!(await cartDrawer(page).isVisible())) await page.locator(isMobile ? '.runhead-bag [data-open=cart], [data-open=cart]' : '[data-open=cart]').first().click(); };

test('Care: a refill kit for a chamber goes in the cart as a kit line', async ({ page, isMobile }) => {
  const errs = errorsOf(page);
  await page.goto('/care.html');
  const planner = page.locator('#carePlanner');
  await planner.locator('select[name=r]').selectOption('MossBox');
  await expect(planner.locator('.care-kit h3')).toHaveText(['Moss refill kit']);
  await planner.getByRole('button', { name: 'Add kit to cart' }).click();
  await openCart(page, isMobile);
  await expect(cartDrawer(page).locator('.ct-line')).toHaveCount(1);
  await expect(cartDrawer(page).locator('.ct-title')).toHaveText('Moss refill kit');
  expect(errs).toEqual([]);
});

test('Care: visits for my own plants → plan in cart and in the order message', async ({ page, isMobile }) => {
  const errs = errorsOf(page);
  await page.goto('/care.html');
  const planner = page.locator('#carePlanner');
  await planner.getByText('My own plants').click();
  await planner.locator('input[name=n]').fill('8');
  await planner.getByText('Bite', { exact: true }).click();
  await planner.getByText('Visits from the studio').click();
  await planner.getByLabel('6 months').check();
  await planner.getByLabel('Every 2 weeks').check();
  await planner.locator('input[name=p]').fill('400101');
  await expect(planner.locator('.care-summary')).toContainText('12 visits');
  await expect(planner.locator('.care-price')).toHaveText('On enquiry');     // no rate set yet
  await planner.getByRole('button', { name: 'Add visits to cart' }).click();
  await openCart(page, isMobile);
  const line = cartDrawer(page).locator('.ct-line');
  await expect(line).toHaveCount(1);
  await expect(line.locator('.ct-title')).toHaveText('Care visits · 8 of my own plants');
  await expect(line.locator('.ct-qty')).toHaveCount(0);                         // a plan has no quantity
  const wa = decodeURIComponent(await cartDrawer(page).locator('[data-ct=send]').getAttribute('href'));
  expect(wa).toContain('6 months, every 2 weeks (12 visits) · Bite · pincode 400101');
  expect(errs).toEqual([]);
});

test('Care: a custom box from the Maker is quoted, and its plan opens prefilled', async ({ page }) => {
  await page.goto('/maker.html#c=MossBox&s=studio&p=PLT-036&n=QA%20World');
  await page.locator('.mk-step[data-to=review]').click();
  const care = page.locator('.mk-care');
  await expect(care.getByRole('button', { name: 'Add Moss refill kit' })).toBeVisible();
  await care.getByRole('link', { name: 'Plan care visits' }).click();
  await expect(page).toHaveURL(/\/care#s=custom/);
  const planner = page.locator('#carePlanner');
  await expect(planner.locator('input[name=s][value=custom]')).toBeChecked();
  await expect(planner.locator('select[name=r] option:checked')).toHaveText('QA World');
  await expect(planner.locator('.care-price')).toHaveText('Quoted by the studio');
});

test('Care: product page offers the matching kit and a prefilled visit plan', async ({ page }) => {
  await page.goto('/product.html#MossBox');
  const block = page.locator('.pd-care');
  await expect(block.getByRole('button', { name: 'Add Moss refill kit' })).toBeVisible();
  await expect(block.getByRole('link', { name: 'Plan care visits' })).toHaveAttribute('href', /^\/care#s=piece.*r=MossBox/);
});

test('Cart suggests the matching kit and visits; adding the kit removes it from the list', async ({ page, isMobile }) => {
  await page.goto('/product.html#MossBox');
  await page.locator(isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]').first().click();
  const sug = cartDrawer(page).locator('.ct-suggest');
  await expect(sug.locator('.ct-suggest-name')).toHaveText(['Moss refill kit', 'Care visits']);
  await sug.getByRole('button', { name: /Add/ }).click();
  await expect(cartDrawer(page).locator('.ct-line')).toHaveCount(2);
  await expect(sug.locator('.ct-suggest-name')).toHaveText(['Care visits']);
});

test.describe('Care business form', () => {
  test.skip(({ isMobile }) => isMobile, 'same form on phones; network paths checked once');
  test('sends company details in the message; errors and invalid input handled', async ({ page }) => {
    let body;
    await page.route('https://api.web3forms.com/**', r => { body = r.request().postDataJSON(); r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    await page.goto('/care.html#business');
    const f = page.locator('#careBusiness');
    await f.getByRole('button', { name: 'Ask for a quote' }).click();
    expect(body).toBeUndefined();                                   // required fields empty: nothing sent
    await f.locator('[name=company]').fill('Blue Tokai Andheri');
    await f.locator('[name=name]').fill('QA');
    await f.locator('[name=email]').fill('qa@example.com');
    await f.locator('[name=site]').selectOption('Café or restaurant');
    await f.locator('[name=size]').fill('30 plants');
    await f.locator('[name=often]').selectOption('Every month');
    await f.locator('[name=pin]').fill('400053');
    await f.getByRole('button', { name: 'Ask for a quote' }).click();
    await expect(page.locator('.care-biz .enquiry-status')).toContainText('Thank you');
    expect(body.product).toBe('Care · business');
    expect(body.message).toContain('Company: Blue Tokai Andheri');
    expect(body.message).toContain('Visits wanted: Every month');
    expect(body.message).toContain('Pincode: 400053');
  });
  test('server error: says so and offers email', async ({ page }) => {
    await page.route('https://api.web3forms.com/**', r => r.fulfill({ status: 500, contentType: 'application/json', body: '{"success":false}' }));
    await page.goto('/care.html#business');
    const f = page.locator('#careBusiness');
    for (const [n, v] of [['company', 'X'], ['name', 'QA'], ['email', 'qa@example.com']]) await f.locator(`[name=${n}]`).fill(v);
    await f.getByRole('button', { name: 'Ask for a quote' }).click();
    await expect(page.locator('.care-biz .enquiry-status')).toContainText('aayush.lilani@gmail.com');
  });
});

// ── Product points under the photo (site-kry) ────────────────────────
test('points: hover opens one panel, leaving closes; keyboard and tap work', async ({ page, isMobile }) => {
  await page.goto('/product#SporeBox');
  const w = page.locator('[data-points]');
  const pts = w.locator('.pd-point'), panels = w.locator('.pd-point-panel');
  await expect(pts).toHaveCount(3);
  await expect(panels.first()).toBeHidden();                         // default: nothing open
  await w.scrollIntoViewIfNeeded();
  // Layout height of the points area (transforms from reveal animations don't count).
  const below = () => w.evaluate(e => e.offsetHeight);
  const y0 = await below();
  if (isMobile) {
    await pts.nth(0).tap();
    await expect(panels.nth(0)).toBeVisible();
    await pts.nth(2).tap();                                          // tap another: switches
    await expect(panels.nth(2)).toBeVisible();
    await expect(panels.nth(0)).toBeHidden();
    await pts.nth(2).tap();                                          // tap again: closes
    await expect(panels.nth(2)).toBeHidden();
  } else {
    await pts.nth(1).hover();
    await expect(panels.nth(1)).toBeVisible();
    await expect(panels.nth(1)).toContainText('humidity');
    await expect(pts.nth(1)).toHaveAttribute('aria-expanded', 'true');
    await page.mouse.move(5, 5);                                     // leave: back to default
    await expect(panels.nth(1)).toBeHidden();
    await pts.nth(0).focus();
    await page.keyboard.press('Tab');                                // keyboard: focus opens the next
    await expect(panels.nth(1)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panels.nth(1)).toBeHidden();
  }
  for (const i of [0, 1, 2]) {                                       // the longest panel must fit the reserved space too
    await pts.nth(i).click();
    expect(Math.abs(await below() - y0), `opening point ${i + 1} never moves the page`).toBeLessThan(2);
  }
});

// ── Icon/label semantics (iconography audit Phase 2, items 2–5) ──────
test('product size + material are radio groups: announced choice, arrow keys', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard');
  await page.goto('/product#V1-PLT-005');
  const sizes = page.getByRole('radiogroup', { name: 'Size / Variant' });
  await expect(sizes.getByRole('radio')).toHaveCount(3);          // Stackable Planter: 3 sizes
  const first = sizes.getByRole('radio').first();
  await expect(first).toHaveAttribute('aria-checked', 'true');
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(sizes.getByRole('radio').nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(sizes.getByRole('radio').nth(1)).toBeFocused();
  await expect(first).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('radiogroup', { name: 'Material' })).toBeVisible();
});

test('toggles keep their name; the state is pressed/checked', async ({ page, isMobile }) => {
  await page.goto('/product#V1-PLT-006');
  const save = page.locator('.pd-buy .save-btn');
  if (!isMobile) {
    await expect(save).toHaveAttribute('aria-pressed', 'false');
    await save.click();
    await expect(save).toHaveAttribute('aria-pressed', 'true');
    await expect(save).toContainText('Save');                      // label doesn't flip to "Saved"
    await expect(page.locator('.runhead .theme-toggle')).toHaveAttribute('aria-label', 'Dark mode');
  }
  await page.goto('/maker#c=MossBox&s=studio&p=PLT-036');
  await page.locator('.mk-step[data-to=plants]').click();
  const add = page.locator('.mk-add[data-id="PLT-036"]');
  await expect(add).toHaveAttribute('aria-pressed', 'true');
  await expect(add).toHaveAccessibleName(/^Add /);                  // was "Remove …" while showing "Added"
});

test('catalogue volume tabs: real ids, arrow keys move and select', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard');
  await page.goto('/products');
  const tabs = page.getByRole('tab');
  await expect(page.getByRole('tabpanel').first()).toHaveAttribute('aria-labelledby', 'tab-1');
  await expect(page.locator('#tab-1')).toHaveCount(1);
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toBeFocused();
});

// ── Icons, PR B (audit items 8–12) ───────────────────────────────────
test('header: heart + bag, counts hidden at zero, read as "Cart 1 items"', async ({ page, isMobile }) => {
  await page.goto('/product#V1-PLT-006');
  const cart = page.locator('.runhead-bag-btn[data-open=cart]');
  await expect(cart.locator('.icon-shopping-bag')).toHaveCount(1);
  await expect(page.locator('.runhead-bag-btn[data-open=saved] .icon-heart')).toHaveCount(1);
  await expect(cart.locator('[data-cart-count]')).toBeHidden();               // 0 → nothing shown
  await page.locator(isMobile ? '#pdMobileCta [data-add-line]' : '.pd-buy [data-add-line]').click();
  await page.keyboard.press('Escape');
  await expect(cart.locator('[data-cart-count]')).toHaveText('1');
  await expect(cart).toHaveAccessibleName(/^Cart\s*1\s*items$/);
  const labelWidth = (await cart.locator('.rb-label').boundingBox()).width;      // icon-only on phones, still read aloud
  if (isMobile) expect(labelWidth).toBeLessThanOrEqual(1); else expect(labelWidth).toBeGreaterThan(10);
});

test('close and remove are one "x" icon with a name; no ESC text', async ({ page, isMobile }) => {
  await page.goto('/products');
  await page.locator('#catalogueSearchBtn').click();
  const close = page.locator('#catalogueSearchClose');
  await expect(close).toHaveAccessibleName('Close search');
  await expect(close.locator('.icon-x')).toHaveCount(1);
  await expect(close).not.toContainText('ESC');
  await page.keyboard.press('Escape');                                          // the key still closes
  await expect(page.locator('#catalogueSearchOverlay')).toBeHidden();
  if (isMobile) { await page.locator('.hamburger').click(); await expect(page.locator('.mobile-nav-close .icon-x')).toBeVisible(); }
});

test('links that open elsewhere say so', async ({ page }) => {
  await page.goto('/product#V1-PLT-005');
  await expect(page.locator('#pdEnquiryCta .icon-arrow-up-right')).toHaveCount(1);
  const social = page.locator('footer .colo-social a').first();
  await expect(social).toHaveAccessibleName(/opens in a new tab/);
  await page.goto('/blog/designing-drainage');
  await expect(page.locator('a.back-link .icon-arrow-left')).toHaveCount(1);
});

// ── PR C (audit items 13–19) ─────────────────────────────────────────
test('product: one primary action; WhatsApp + email folded under "Other ways to order"', async ({ page, isMobile }) => {
  await page.goto('/product#V1-PLT-005');
  const fold = page.locator('.pd-buy ~ .pd-other-ways').first();
  await expect(fold.locator('#pdEnquiryCta')).toBeHidden();                 // folded by default
  await fold.locator(':scope > summary').click();
  await expect(fold.getByRole('link', { name: /Ask a question on WhatsApp/ })).toBeVisible();
  if (!isMobile) await expect(fold.locator('.enquiry-alt summary')).toContainText('Prefer email?');
});

test('phone sticky bar shows the price and follows the choice', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone bar');
  await page.goto('/product#V1-PLT-005');
  const price = page.locator('#pdMobilePrice');
  await expect(price).toHaveText(await page.locator('#pdPrice').innerText());
  await page.locator('[data-variant="small-circle"]').click();
  await page.locator('[data-material="asa"]').click();
  await expect(price).toHaveText('₹799');
});

test('cart: a Maker design shows its chamber drawing, not a letter', async ({ page }) => {
  await page.goto('/maker#c=MossBox&s=studio&p=PLT-036&n=QA');
  await page.locator('.mk-step[data-to=review]').click();
  await page.locator('[data-key=cart]').click();
  await expect(page.locator('dialog.ct .ct-line--custom .ct-thumb img')).toHaveAttribute('src', /assets\/boxes\/moss\.svg$/);
});

// When the 3D view arrives it must not rebuild the Maker's buttons: on slow
// phones a tap landed on a button replaced mid-press and did nothing (CI
// flake site-ktu, 12 Oct 2026). Delay 3D, tag the button, let 3D arrive.
test('Maker: the 3D view arriving late does not rebuild buttons', async ({ page }) => {
  await page.route('**/scripts/maker-3d.js', async r => { await new Promise(res => setTimeout(res, 2500)); await r.continue(); });
  await page.goto('/maker#c=MossBox&s=studio&p=PLT-036');
  await page.locator('.mk-step[data-to=plants]').click();
  const guide = page.locator('[data-act=guide]');
  await guide.evaluate(el => { el.dataset.qaSame = '1'; });
  await expect(page.locator('#mkPreview canvas')).toBeVisible({ timeout: 15_000 });   // 3D arrived
  await expect(guide).toHaveAttribute('data-qa-same', '1');                         // same element, not rebuilt
  await guide.click();
  await expect(page.locator('#mkGuide')).toBeVisible();
});
