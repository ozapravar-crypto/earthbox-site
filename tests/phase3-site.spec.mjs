// UX audit Phase 3 · Home, the catalogue, Care and polish
// (_audits/2026-10-16_ux-ia-density-audit.md: D5, C-02/06/09/10/11,
// S-16/17/18/20/21/24/25/26/27/28/29/30).
// External services are mocked (Web3Forms, wa.me); nothing real is sent.
import { test, expect } from '@playwright/test';
import { volumeOne } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';
import { coverage } from '../data/care.js';
import { encodePlan } from '../scripts/care.js';

/** @typedef {import('@playwright/test').Page} Page */

test.beforeEach(async ({ context }, info) => {
  // Clean storage once per test; the cookie choice made, except in the banner tests.
  const consent = info.titlePath.some(t => t.includes('cookie banner')) ? null : 'denied';
  await context.addInitScript((c) => {
    if (sessionStorage.getItem('qa')) return;
    localStorage.clear(); if (c) localStorage.setItem('earthbox-consent', c);
    sessionStorage.setItem('qa', '1'); sessionStorage.setItem('earthbox-loader-seen', '1');
  }, consent);
  await context.route('**/*.mp4', r => r.abort());
  await context.route('https://wa.me/**', r => r.fulfill({ body: 'wa' }));
});

const soon = volumeOne.filter(p => p.status === 'coming-soon');
const packets = volumeOne.filter(p => p.category === 'plant-packets');

// ── Home (D5) ────────────────────────────────────────────────────────
test.describe('home', () => {
  test('C-02: the catalogue tease is 4 orderable pieces, the finish named, counts from data, one way in', async ({ page }) => {
    await page.goto('/');
    const tease = page.locator('#catalogue-tease');
    const cards = tease.locator('.v1-card');
    await expect(cards).toHaveCount(4);
    await expect(tease.locator('.v1-card--soon')).toHaveCount(0);
    for (const amount of await tease.locator('.v1-card-amount').all()) await expect(amount).toHaveText(/^₹[\d,]+$/);
    await expect(tease.locator('.v1-card-add')).toHaveCount(4);                       // same card as the catalogue
    await expect(tease.locator('.v1-preview-caption')).toHaveText(/^Prices for Indoors: PETG/);
    await expect(tease.locator('[data-catalogue-count]'))
      .toHaveText(`${volumeOne.length} pieces · ${soon.length} coming soon${volumeTwo.boxes.length ? ' · chambers on enquiry' : ''}`);
    await expect(tease.locator('[data-place]')).toHaveCount(0);                       // no place switch on Home
    await expect(tease.getByRole('link', { name: 'View full catalogue' })).toHaveAttribute('href', '/products');
    // The tease follows a place chosen on the catalogue, and says so.
    await page.goto('/products');
    await page.locator('[data-place=balcony]').click();
    await page.goto('/');
    await expect(tease.locator('.v1-preview-caption')).toHaveText(/^Prices for Balcony: ASA/);
  });

  test('C-06: no unsourced rating or count; one proof row in the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.trust-strip')).toHaveCount(0);
    const main = page.locator('main');
    await expect(main).not.toContainText('Customer rating');
    await expect(main).not.toContainText('★');
    await expect(main).not.toContainText('Pieces delivered');
    await expect(page.locator('.hero-proof')).toHaveCount(1);
    await expect(page.locator('.hero-proof li')).toHaveText(['Handcrafted in Mumbai', 'Made to order', 'Delivered within Mumbai']);
  });

  test('C-10/C-11 + D5: no lone "02"; "Price", not "Disposition"; sections in the new order', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.mi-num')).toHaveCount(0);
    await expect(page.locator('.maker-invite')).not.toContainText(/\b02\b/);
    await expect(page.locator('.mi-spec dt')).toHaveText(['Chambers', 'Plants', 'Price']);
    await expect(page.locator('main')).not.toContainText('Disposition');
    const order = await page.locator('main > section').evaluateAll(els => els.map(e => e.id));
    expect(order).toEqual(['top', 'catalogue-tease', 'maker-invite', 'film', 'care', 'principles']);
    // Principles and Purpose are one band, with the way to About.
    const band = page.locator('#principles');
    await expect(band.locator('#purpose')).toHaveCount(1);
    await expect(band.locator('h2')).toHaveCount(1);
    await expect(band.getByRole('link', { name: 'More about the studio' })).toHaveAttribute('href', '/about');
    // The botanical art stays.
    await expect(band.locator('.principle-icon .art')).toHaveCount(5);
  });

  test('C-11: no internal brand note in any footer; "By enquiry only" is kept', async ({ page }) => {
    for (const path of ['/', '/products', '/care', '/about', '/blog/designing-drainage']) {
      await page.goto(path);
      const footer = page.locator('footer.colophon');
      await expect(footer).not.toContainText('speaks softly');
      await expect(footer).toContainText('By enquiry only');
    }
  });
});

// ── Cookie banner (C-09) ─────────────────────────────────────────────
test.describe('cookie banner', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('C-09: compact on phones, equal choices, Privacy link, WhatsApp lifted clear of it', async ({ page, isMobile }) => {
    await page.goto('/');
    const banner = page.locator('.consent');
    await expect(banner).toBeVisible();
    const accept = banner.getByRole('button', { name: 'Accept' }), decline = banner.getByRole('button', { name: 'Decline' });
    expect(await accept.getAttribute('class')).toBe(await decline.getAttribute('class'));
    expect(await accept.getAttribute('class')).toContain('cta-secondary');
    await expect(banner.getByRole('link', { name: 'Privacy' })).toBeVisible();
    const b = /** @type {{ x: number, y: number, width: number, height: number }} */ (await banner.boundingBox());
    if (isMobile) expect(b.height).toBeLessThanOrEqual(110);                           // one compact row, ~96 px (was 170)
    for (const btn of [accept, decline]) expect((/** @type {{ height: number }} */ (await btn.boundingBox())).height).toBeGreaterThanOrEqual(44);
    // WhatsApp never sits under the banner.
    const wa = page.locator('.floating-wa');
    await expect.poll(async () => {
      const w = /** @type {{ x: number, y: number, width: number, height: number }} */ (await wa.boundingBox());
      const overlap = w.x < b.x + b.width && b.x < w.x + w.width && w.y < b.y + b.height && b.y < w.y + w.height;
      return overlap;
    }).toBe(false);
    // Choosing puts it back in its corner.
    const before = /** @type {{ y: number }} */ (await wa.boundingBox()).y;
    await decline.click();
    await expect(banner).toHaveCount(0);
    if (isMobile) await expect.poll(async () => (/** @type {{ y: number }} */ (await wa.boundingBox())).y).toBeGreaterThan(before);
  });
});

// ── Catalogue ────────────────────────────────────────────────────────
test.describe('catalogue', () => {
  test('S-16: "Prices for: <place>" stays in the sticky bar after scrolling, and follows the choice', async ({ page }) => {
    await page.goto('/products');
    const bar = page.locator('#barPlace');
    await expect(bar).toHaveText('Prices for: Indoors');
    await page.locator('[data-place=window]').click();
    await expect(bar).toHaveText('Prices for: Sunny window');
    await page.locator('#cat-plant-packets').scrollIntoViewIfNeeded();
    await expect(page.locator('.place-switch')).not.toBeInViewport();
    await expect(bar).toBeInViewport();
    await expect(bar).toBeVisible();
    // Volume II has no places: the line goes with Volume I.
    await page.locator('#tab-2').click();
    await expect(bar).toBeHidden();
    await page.locator('#tab-1').click();
    await expect(bar).toBeVisible();
  });

  test('S-17/S-28: no grey fillers, no category price chips, one status per card; Plant Packets fold behind "Show all"', async ({ page }) => {
    await page.goto('/products');
    await expect(page.locator('.v1-cat-price')).toHaveCount(0);
    const bg = await page.locator('.v1-grid').first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgba(0, 0, 0, 0)');                                                  // empty cells stay paper
    // One status signal on a coming-soon card: its badge (no faded photo, no second label).
    const card = page.locator('.v1-card--soon').first();
    await expect(card.locator('.badge')).toHaveCount(1);
    expect(await card.locator('.v1-card-img').evaluate(el => getComputedStyle(el).opacity)).toBe('1');
    // Plant Packets: one row, then a native disclosure with a 44 px summary.
    const cat = page.locator('#cat-plant-packets');
    const more = cat.locator('details.v1-more');
    const summary = more.locator('summary');
    await expect.poll(async () => (await summary.innerText()).toLowerCase()).toBe(`show all ${packets.length}`);   // innerText: what's on screen
    expect((/** @type {{ height: number }} */ (await summary.boundingBox())).height).toBeGreaterThanOrEqual(44);
    await expect(more).not.toHaveAttribute('open', '');
    const visible = () => cat.locator('.v1-card:visible').count();
    expect(await visible()).toBeLessThanOrEqual(4);
    expect(await visible()).toBeGreaterThan(0);
    await summary.click();
    await expect(more).toHaveAttribute('open', '');
    await expect.poll(async () => (await summary.innerText()).toLowerCase()).toBe('show fewer');
    expect(await visible()).toBe(packets.length);
    // Keyboard: the summary is a real control.
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(more).not.toHaveAttribute('open', '');
  });

  test('S-18: search finds materials and places, shows a price or status, orderable pieces first', async ({ page }) => {
    await page.goto('/products');
    await page.locator('#catalogueSearchBtn').click();
    const results = page.locator('#searchResultsList > a.search-result');
    await page.fill('#cat-search', 'asa');
    await expect(results.first()).toBeVisible();
    await expect(results.first().locator('.search-result-price')).toHaveText(/^₹[\d,]+ · Balcony$/);   // priced for the place searched
    await page.fill('#cat-search', 'balcony');
    await expect(results.first().locator('.search-result-price')).toHaveText(/· Balcony$/);
    await page.fill('#cat-search', 'planter');
    await expect(results.first()).toBeVisible();
    const kinds = await results.evaluateAll(els => els.map(e => (e.querySelector('.search-result-price') ? 'price' : e.querySelector('.badge') ? 'status' : 'none')));
    expect(kinds).not.toContain('none');                                                  // every result says one or the other
    expect(kinds.indexOf('status')).toBeGreaterThan(kinds.lastIndexOf('price'));            // available first
    await expect(results.filter({ hasText: 'Coming soon' }).first()).toBeVisible();
  });

  test('S-27: on phones the category header stacks and keeps clear of the WhatsApp button', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout');
    await page.goto('/products');
    const wa = /** @type {{ x: number }} */ (await page.locator('.floating-wa').boundingBox());
    for (const h of await page.locator('.v1-cat-header').all()) {
      expect(await h.evaluate(el => getComputedStyle(el).display)).toBe('block');
      for (const part of await h.locator('.v1-cat-title, .v1-cat-desc').all()) {
        const r = /** @type {{ x: number, width: number }} */ (await part.boundingBox());
        expect(r.x + r.width).toBeLessThanOrEqual(wa.x);
      }
    }
  });
});

// ── Care ─────────────────────────────────────────────────────────────
test.describe('care', () => {
  test('S-20: a plan link for a piece that isn\'t orderable says so and never shows another piece as if it were that one', async ({ page }) => {
    const plan = encodePlan({ s: 'piece', r: 'V1-PP-001', d: '12m', f: 'monthly', g: [] });      // Tradescantia: coming soon
    await page.goto(`/care#${plan}`);
    const planner = page.locator('#carePlanner');
    await expect(planner.locator('[data-care-blocked]')).toContainText('Tradescantia is coming soon');
    const chosen = await planner.locator('select[name=r]').inputValue();
    expect(volumeOne.find(p => p.sku === chosen)?.status).toBe('available');
    await planner.getByRole('button', { name: 'Add visits to cart' }).click();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('earthbox-cart') || '{}'));
    expect(new URLSearchParams(stored.cart[0].code).get('r')).toBe(chosen);                // the plan is for the piece on screen
    await page.keyboard.press('Escape');                                                    // the cart opened on add
    // Choosing clears the notice.
    await planner.getByText('My own plants', { exact: true }).click();
    await expect(planner.locator('[data-care-blocked]')).toHaveCount(0);
  });

  test('S-21: plant groups in plain words first; asked for kits, not for visits', async ({ page }) => {
    await page.goto('/care');
    const planner = page.locator('#carePlanner');
    await planner.getByText('My own plants').click();
    await expect(planner.getByRole('checkbox', { name: /^Mosses \(Moss\)/ })).toBeVisible();
    await expect(planner.getByRole('checkbox', { name: /^Carnivorous plants \(Bite\)/ })).toBeVisible();
    await planner.getByText('Visits from the studio').click();
    await expect(planner.locator('.care-groups')).toHaveCount(0);
    await planner.getByText('A refill kit').click();
    await planner.getByRole('checkbox', { name: /^Mosses/ }).check();
    await expect(planner.locator('.care-kit h3')).toHaveText(['Moss refill kit']);
  });

  test('S-24/S-30: pincode has a plain hint and a coverage note; the piece option names only what can be chosen', async ({ page }) => {
    await page.goto('/care');
    const planner = page.locator('#carePlanner');
    await expect(planner.locator('input[name=s][value=piece] ~ small')).toHaveText('A planter or plant support you bought from us.');
    await expect(planner).not.toContainText('A chamber');
    await planner.getByText('Visits from the studio').click();
    const pin = planner.locator('input[name=p]');
    expect(await pin.getAttribute('placeholder')).toBeNull();                              // nothing that looks filled in
    await expect(pin).toHaveAttribute('aria-describedby', 'carePinNote');
    const note = planner.locator('#carePinNote');
    await expect(note).toHaveText(coverage.note.empty);
    await pin.fill('400101');
    await expect(note).toHaveText(coverage.note.inside);
    await pin.fill('110001');
    await expect(note).toHaveText(coverage.note.outside);
  });
});

// ── Product pages and forms (polish) ─────────────────────────────────
test('S-25: on a chamber page the long text comes after the photo', async ({ page }) => {
  await page.goto('/product/MossBox');
  await expect(page.locator('.pd-intro')).toHaveCount(1);
  const after = await page.locator('.pd-page--box').evaluate(el => {
    const photo = /** @type {Element} */ (el.querySelector('.pd-hero-frame')), text = /** @type {Element} */ (el.querySelector('.pd-intro'));
    return !!(photo.compareDocumentPosition(text) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(after).toBe(true);
});

test('S-26: the vivarium page shows its status above the button, and an email route', async ({ page, isMobile }) => {
  await page.goto('/product/VIV-III');
  const body = page.locator('.pd-page--vivarium .pd-body');
  const statusFirst = await body.evaluate(el => {
    const s = /** @type {Element} */ (el.querySelector('.pd-viv-status')), cta = /** @type {Element} */ (el.querySelector('a.pd-cta'));
    return !!(s.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(statusFirst).toBe(true);
  await expect(body.locator('.pd-viv-status .badge')).toHaveText('Research phase');
  await expect(body.locator('.enquiry-alt')).toHaveCount(1);
  if (!isMobile) await expect(body.locator('.enquiry-alt summary')).toBeVisible();          // the email route is the desktop one, as elsewhere
});

test('S-29: form errors are words in the status line, not browser pop-ups', async ({ page }) => {
  let sent = 0;
  await page.route('https://api.web3forms.com/**', async r => { sent++; await r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
  await page.addInitScript(() => {
    /** @type {Window & { __popups?: number }} */ (window).__popups = 0;
    HTMLFormElement.prototype.reportValidity = function(){ /** @type {Window & { __popups?: number }} */ (window).__popups = (/** @type {Window & { __popups?: number }} */ (window).__popups || 0) + 1; return false; };
  });
  await page.goto('/care#business');
  const f = page.locator('#careBusiness');
  const status = page.locator('.care-biz .enquiry-status');
  await f.getByRole('button', { name: 'Ask for a quote' }).click();
  await expect(status).toHaveText('Please add your company.');
  await expect(f.locator('[name=company]')).toHaveAttribute('aria-invalid', 'true');
  await expect(f.locator('[name=company]')).toBeFocused();
  await f.locator('[name=company]').fill('QA Café');
  await f.locator('[name=name]').fill('QA');
  await f.locator('[name=email]').fill('not-an-email');
  await f.getByRole('button', { name: 'Ask for a quote' }).click();
  await expect(status).toHaveText('That email doesn’t look right: please check it.');
  await expect(f.locator('[name=company]')).not.toHaveAttribute('aria-invalid', 'true');
  await expect(f.locator('[name=email]')).toBeFocused();
  expect(sent).toBe(0);
  expect(await page.evaluate(() => /** @type {Window & { __popups?: number }} */ (window).__popups)).toBe(0);
  // The native checks stay as the fallback.
  await expect(f.locator('[name=company]')).toHaveAttribute('required', '');
});
