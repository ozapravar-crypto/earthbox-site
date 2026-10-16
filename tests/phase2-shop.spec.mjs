// UX audit Phase 2 · Shopping (_audits/2026-10-16_ux-ia-density-audit.md, D1 + D2).
// The cart drawer: lines, counts, breakdown, sticky footer, the email order
// form at every width, the Saved tab. The product page: buying column at the
// fold, what the price is for, related row, chamber guide, the phone bar.
// External services are mocked (Web3Forms, wa.me); nothing real is sent.
import { test, expect } from '@playwright/test';
import { encodeBuild, emptyBuild } from '../scripts/build-codec.js';
import { encodePlan } from '../scripts/care.js';

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('@playwright/test').BrowserContext} BrowserContext */

const capsule = { kind: 'product', sku: 'V1-PLT-006', material: 'petg', qty: 2 };          // ₹429 each
const kit = { kind: 'product', sku: 'KIT-MOSS', qty: 1 };                                   // on enquiry
const build = { kind: 'build', code: encodeBuild({ ...emptyBuild(), chamber: 'MossBox', substrate: null, plants: ['PLT-036'] }) };   // ₹6,000 – ₹9,000 + parts to quote
const plan = { kind: 'care', code: encodePlan({ s: 'own', d: 'once', f: 'once', g: ['Moss'], n: 3, p: '400101' }) };

/**
 * Start each page with this cart (once per test), the cookie choice made and no loader.
 * @param {BrowserContext} context
 * @param {{ cart?: object[], saved?: object[] }} [store]
 */
async function start(context, store){
  await context.addInitScript((s) => {
    if (sessionStorage.getItem('qa')) return;
    localStorage.clear(); localStorage.setItem('earthbox-consent', 'denied');
    if (s) localStorage.setItem('earthbox-cart', JSON.stringify({ cart: s.cart || [], saved: s.saved || [] }));
    sessionStorage.setItem('qa', '1'); sessionStorage.setItem('earthbox-loader-seen', '1');
  }, store || null);
  await context.route('**/*.mp4', r => r.abort());
  await context.route('https://wa.me/**', r => r.fulfill({ body: 'wa' }));
}
/** @param {Page} page */
const drawer = (page) => page.locator('dialog.ct');
/** @param {Page} page */
async function openCart(page){
  await page.goto('/about.html');
  await page.locator('.runhead-bag-btn[data-open=cart]').click();
  await expect(drawer(page)).toBeVisible();
  return drawer(page);
}
/** @param {Page} page */
const waText = async (page) => decodeURIComponent(/** @type {string} */ (await drawer(page).locator('a.cta[data-ct=send]').getAttribute('href')));

// ── Cart drawer (D1) ─────────────────────────────────────────────────
test.describe('cart drawer', () => {
  test('a line: title + price, then size · place (material) + unit price, then status; no kind label (S-10)', async ({ page, context }) => {
    await start(context, { cart: [{ kind: 'product', sku: 'V1-PLT-005', variant: 'big', material: 'asa', qty: 2 }] });
    const d = await openCart(page);
    const line = d.locator('.ct-line');
    await expect(line.locator('.ct-top .ct-title')).toHaveText('Stackable Planter');
    await expect(line.locator('.ct-top .ct-price')).toHaveText('₹3,598');
    await expect(line.locator('.ct-meta .ct-sub')).toHaveText('Big Block · Balcony (ASA)');
    await expect(line.locator('.ct-meta .ct-each')).toHaveText('₹1,799 each');
    await expect(line.locator('.ct-status')).toHaveText(/^Made to order/);
    await expect(d.locator('.ct-kind')).toHaveCount(0);
    await expect(d).not.toContainText(/Ready to order|Price on enquiry/);
    // Order: title row, meta row, status, then stepper, then actions.
    const order = await line.locator('.ct-body > *').evaluateAll(els => els.map(e => e.className.split(' ')[0]).filter(Boolean));
    expect(order.slice(0, 3)).toEqual(['ct-top', 'ct-meta', 'ct-status']);
    expect(order.indexOf('ct-qty')).toBeLessThan(order.indexOf('ct-actions'));
  });

  test('no photo → an icon, not a letter (S-10)', async ({ page, context }) => {
    await start(context, { cart: [kit, plan] });
    const d = await openCart(page);
    const marks = d.locator('.ct-thumb-mark');
    await expect(marks).toHaveCount(2);
    await expect(marks.nth(0).locator('svg.icon-package')).toHaveCount(1);
    await expect(marks.nth(1).locator('svg.icon-calendar-clock')).toHaveCount(1);
    for (const m of await marks.all()) expect((await m.innerText()).trim()).toBe('');
  });

  test('counts pieces, not a build’s parts; breakdown rows; estimate in the sticky footer (S-04, S-07, S-11)', async ({ page, context }) => {
    await start(context, { cart: [capsule, kit, build] });
    const d = await openCart(page);
    await expect(d.locator('#ct-tab-cart')).toHaveText('Cart · 4 pieces');           // 2 capsules + kit + build
    await expect(d.locator('#ct-tab-saved')).toHaveText('Saved · 0');
    const rows = d.locator('.ct-breakdown .ct-row');
    await expect(rows).toHaveText([
      'Priced pieces · 2₹858',
      'Chamber & build guide₹6,000 – ₹9,000',
      'To be quoted2 pieces',                                                     // the kit + the build, not its 2 parts
      'DeliveryMumbai · confirmed by the studio'
    ]);
    const est = d.locator('.ct-foot .ct-row--total');
    await expect(est).toHaveText('Estimate so far₹6,858 – ₹9,858 + 2 to quote');
    // The qualifier is the same size as the number (rule E3).
    const sizes = await est.locator('span').evaluateAll(els => els.map(e => getComputedStyle(e).fontSize));
    expect(new Set(sizes).size).toBe(1);
    await expect(d.locator('.ct-foot')).toContainText('Nothing is charged here.');
    await expect(d.locator('.ct-foot')).toContainText('secure payment link');
    // Sticky: Send is on screen without scrolling the list, at every width.
    await expect(d.locator('.ct-foot')).toHaveCSS('position', 'sticky');
    await expect(d.locator('a.cta[data-ct=send]')).toBeInViewport();
    await expect(d.getByText('Send by email instead')).toBeInViewport();
    expect(await waText(page)).toContain('Still to quote: 2 pieces');
  });

  test('estimate wording: all priced, and nothing priced (S-04)', async ({ page, context }) => {
    await start(context, { cart: [capsule] });
    let d = await openCart(page);
    await expect(d.locator('.ct-row--total')).toHaveText('Estimate so far₹858');
    await expect(d.locator('.ct-breakdown')).not.toContainText('To be quoted');
    await d.locator('[data-ct=remove]').click();
    await page.evaluate(() => localStorage.setItem('earthbox-cart', JSON.stringify({ cart: [{ kind: 'product', sku: 'KIT-MOSS', qty: 3 }], saved: [] })));
    d = await openCart(page);
    await expect(d.locator('.ct-row--total')).toHaveText('To be quoted3 pieces');
    await expect(d.locator('.ct-row--total')).not.toContainText('₹');
  });

  test('Send by email instead: name, phone, pincode (Mumbai hint), optional email; WhatsApp gains name + pincode (S-08, S-09)', async ({ page, context }) => {
    /** @type {Record<string, string> | undefined} */
    let body;
    await page.route('https://api.web3forms.com/**', async r => { body = r.request().postDataJSON(); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
    await start(context, { cart: [capsule] });
    const d = await openCart(page);
    const before = await waText(page);
    expect(before).not.toMatch(/Name:|Pincode:/);                                  // nothing typed: message as it was
    await d.getByText('Send by email instead').click();
    const form = d.getByRole('form', { name: 'Send order by email' });
    await expect(form).toBeVisible();
    await expect(form.getByLabel('Name')).toBeFocused();                          // focus moves into the form
    await expect(d.locator('.ct-foot')).toHaveCSS('position', 'static');           // a tall form joins the scroll
    await expect(form.locator('textarea[name=message]')).toHaveAttribute('readonly', '');
    await expect(form.locator('textarea[name=message]')).toHaveValue(/Capsule Planter · Indoors \(PETG\)/);
    // Required: name, phone, pincode. Email is optional.
    await form.getByRole('button', { name: 'Send order by email' }).click();
    expect(body).toBeUndefined();
    await form.getByLabel('Name').fill('Asha');
    await form.getByLabel('Phone').fill('98200 00000');
    const pin = form.getByLabel('Pincode');
    await pin.fill('110001');
    await expect(form.locator('.enquiry-hint')).toContainText('Outside Mumbai');
    await pin.fill('400101');
    await expect(form.locator('.enquiry-hint')).toContainText('inside our delivery area');
    await expect(pin).toHaveAccessibleDescription(/inside our delivery area/);
    const wa = await waText(page);
    expect(wa).toContain('Name: Asha');
    expect(wa).toContain('Pincode: 400101');
    expect(wa).not.toContain('98200');                                             // only name + pincode ride along
    await form.getByRole('button', { name: 'Send order by email' }).click();
    await expect(d.locator('.ct-notice')).toContainText('your order is with the studio');
    const b = /** @type {Record<string, string>} */ (body);
    expect([b.name, b.phone, b.pincode, b.email]).toEqual(['Asha', '98200 00000', '400101', '']);
    expect(b.message).toContain('Capsule Planter');
    expect(b.product).toBe('Cart · 2 pieces');
    expect(b.subject).toBe('EarthBox enquiry — Cart · 2 pieces');
    expect(b.botcheck).toBe('');
    // Sent (Phase 0, S-03): Clear cart leads, the email form isn't offered again.
    await expect(d.locator('button.cta[data-ct=clear]')).toBeVisible();
    await expect(d.locator('.enquiry-form')).toHaveCount(0);
  });

  test('what was typed survives a redraw (quantity change)', async ({ page, context }) => {
    await start(context, { cart: [capsule] });
    const d = await openCart(page);
    await d.getByText('Send by email instead').click();
    await d.getByLabel('Name').fill('Asha');
    await d.locator('[data-ct=qty][data-d="1"]').click();
    await expect(d.getByLabel('Name')).toHaveValue('Asha');
    await expect(d.locator('.enquiry-alt--order')).toHaveAttribute('open', '');
    expect(await waText(page)).toContain('Name: Asha');
  });

  test('Saved: a chamber says its guide and Coming soon once (S-19)', async ({ page, context }) => {
    await start(context, { saved: [{ kind: 'product', sku: 'MossBox', qty: 1 }] });
    await page.goto('/about.html');
    await page.locator('.runhead-bag-btn[data-open=saved]').click();
    const line = drawer(page).locator('.ct-line');
    await expect(line.locator('.ct-status')).toHaveText('Guide ₹6,000 – ₹9,000 · Coming soon');
    await expect(line).not.toContainText('On enquiry');
    expect((await line.innerText()).match(/Coming soon/g)).toHaveLength(1);
    await expect(line.locator('[data-ct=move]')).toHaveCount(0);
    await expect(line.locator('[data-ct=remove]')).toHaveCount(1);
  });

  test('Remove, then Undo, keeps focus in the drawer', async ({ page, context }) => {
    await start(context, { cart: [capsule, kit] });
    const d = await openCart(page);
    await d.locator('[data-ct=remove]').first().click();
    await expect(d.locator('.ct-line')).toHaveCount(1);
    await expect(d.locator('[data-ct=undo]')).toBeFocused();
    await d.locator('[data-ct=undo]').click();
    await expect(d.locator('.ct-line')).toHaveCount(2);
    expect(await page.evaluate(() => !!document.activeElement?.closest('dialog.ct'))).toBe(true);
  });
});

// ── Product page (D2) ────────────────────────────────────────────────
test.describe('product page', () => {
  test.beforeEach(({ context }) => start(context));

  test('heading, price and Add sit in the buying column, at the fold on desktop (S-05)', async ({ page, isMobile }) => {
    await page.goto('/product/V1-PLT-005');
    const col = page.locator('.pd-buycol');
    await expect(col.locator('h1')).toHaveText('Stackable Planter');
    await expect(page.locator('.pd-page > .pd-head')).toHaveCount(0);              // breadcrumb only above
    await expect(page.locator('.pd-page .eyebrow')).toHaveCount(0);
    await expect(page.locator('#pdPrice')).toHaveText('₹1,399');
    await expect(page.locator('#pdPriceFor')).toHaveText('Big Block · Indoors (PETG)');
    await page.locator('[data-variant="small-circle"]').click();
    await page.locator('[data-material="asa"]').click();
    await expect(page.locator('#pdPriceFor')).toHaveText('Small Circle · Balcony (ASA)');
    if (!isMobile) {
      await page.evaluate(() => scrollTo(0, 0));
      const add = /** @type {{ y: number, height: number }} */ (await page.locator('.pd-buy [data-add-line]').boundingBox());
      expect(add.y + add.height).toBeLessThanOrEqual(900);
      await expect(page.locator('#pdPrice')).toBeInViewport();
    }
  });

  test('one line under Add; the description once; lead time not repeated (S-13)', async ({ page }) => {
    await page.goto('/product/V1-PLT-005');
    await expect(page.locator('.pd-buy + .pd-lead-time')).toHaveText('Made to order · ~1 week · delivered in Mumbai');
    await expect(page.locator('.pd-short-desc')).toHaveCount(0);
    const main = await page.locator('#productDetail .pd-page--printed').innerText();
    expect(main.match(/A modular planter system/g)).toHaveLength(1);
    expect(main.match(/1 week/g)).toHaveLength(1);
    expect(main).not.toMatch(/about 1 week/);
  });

  test('WhatsApp question is in the customer’s voice (S-23)', async ({ page }) => {
    await page.goto('/product/V1-PLT-005');
    const wa = decodeURIComponent(/** @type {string} */ (await page.locator('#pdEnquiryCta').getAttribute('href')));
    expect(wa).toMatch(/^https:\/\/wa\.me\/\d+\?text=Hi, I'm looking at the Stackable Planter \(Big Block\) in PETG, listed at ₹1,399\./);
    expect(wa).toContain('earthbox.in/product/V1-PLT-005');
    expect(wa).not.toMatch(/favourites|takes about a week|Happy to answer/);
  });

  test('related row: a heading, available pieces first, a price or status on each card (S-12)', async ({ page }) => {
    await page.goto('/product/V1-PLT-005');
    const rel = page.locator('.pd-related');
    await expect(rel.getByRole('heading', { level: 2, name: 'More planters' })).toBeVisible();
    const notes = await rel.locator('.pd-related-price').allInnerTexts();
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.every(Boolean)).toBe(true);
    expect(notes[0]).toMatch(/^₹[\d,]+ · Indoors$/);                              // Capsule Planter, in the shopper's place
    const firstSoon = notes.indexOf('Coming soon');
    if (firstSoon >= 0) expect(notes.slice(firstSoon).every(n => n === 'Coming soon')).toBe(true);
  });

  test('chambers: the guide range under the heading and on every Volume II card (S-02)', async ({ page }) => {
    await page.goto('/product/MossBox');
    await expect(page.locator('.pd-head .pd-guide')).toHaveText('Guide ₹6,000 – ₹9,000 · final price on enquiry');
    await expect(page.locator('.pd-head .pd-guide')).toBeVisible();
    // Coming soon stays as in Phase 0: register interest, no Add, no lead time.
    await expect(page.locator('.pd-buy [data-add-line]')).toHaveCount(0);
    await expect(page.locator('.pd-lead-time')).toHaveCount(0);
    await page.goto('/products');
    const guides = page.locator('.box-card .box-guide');
    await expect(guides).toHaveCount(10);
    await expect(page.locator('.box-card', { hasText: 'MossBox' }).locator('.box-guide')).toHaveText('Guide ₹6,000 – ₹9,000 · final price on enquiry');
  });

  test('coming-soon printed piece: no Add, no bar, no lead time', async ({ page }) => {
    await page.goto('/product/V1-PLT-001');
    await expect(page.locator('.pd-buycol h1')).toHaveCount(1);
    await expect(page.locator('[data-add-line]')).toHaveCount(0);
    await expect(page.locator('#pdMobileCta')).toHaveCount(0);
    await expect(page.locator('.pd-lead-time')).toHaveCount(0);
    await expect(page.locator('.pd-buy #pdEnquiryCta')).toContainText('Register interest');
  });

  test('phone sticky bar: only once the real Add has scrolled away; "₹1,399 · Big Block · Indoors [Add]"', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone bar');
    await page.goto('/product/V1-PLT-005');
    const bar = page.locator('#pdMobileCta');
    const inline = page.locator('.pd-buy [data-add-line]');
    await inline.scrollIntoViewIfNeeded();
    await expect(inline).toBeInViewport();
    await expect(bar).toBeHidden();                                               // never on top of the real one
    await page.evaluate(() => { const el = /** @type {Element} */ (document.querySelector('.pd-buy')); scrollTo(0, el.getBoundingClientRect().bottom + scrollY + 200); });
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute('data-shown', 'true');
    await expect(bar.locator('.pd-mobile-what')).toHaveText('₹1,399 · Big Block · Indoors');
    await expect(bar.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    await bar.getByRole('button', { name: 'Add to cart' }).click();
    await expect(drawer(page).locator('.ct-line .ct-sub')).toHaveText('Big Block · Indoors (PETG)');
    await page.keyboard.press('Escape');
    await page.evaluate(() => scrollTo(0, 0));
    await expect(bar).toBeHidden();
  });
});
