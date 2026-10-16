// UX Phase 3 · the Maker's remaining steps (UX audit section B).
// Chamber: readable "what it grows" with real plant names, availability per
// card, no "Choose" badge, and "Help me choose a chamber" (M-15).
// Foundation: "Recommended", "Suits …" on every option, an unsuited option
// that is reachable and says why, one price wording (M-16).
// Your space owns every answer and light is sent (M-11). Continue returns to
// the last step (M-18). Undo stays until dismissed (M-21). "cactus" finds
// succulents (M-22). Recipe cards say "from ₹x" (M-24).
import { test, expect } from '@playwright/test';
import { quietStart, openMakerAt } from './helpers.mjs';

/** @typedef {import('@playwright/test').Page} Page */

test.beforeEach(quietStart);

const panel = (/** @type {Page} */ page) => page.locator('#mkPanelBody');
const live = (/** @type {Page} */ page) => page.locator('#mkLive');
const openAt = openMakerAt;
/** @param {Page} page */
const saved = (page) => page.evaluate(() => /** @type {{ code: string, space: Record<string, unknown>, at?: string }} */ (JSON.parse(String(localStorage.getItem('earthbox-maker')))));

test('Chamber: what it grows in body text with real plants, availability per card, "Selected" only', async ({ page }) => {
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036', 'chamber');
  const body = panel(page);
  const moss = body.locator('.mk-chamber[data-id=MossBox]'), bite = body.locator('.mk-chamber[data-id=BiteBox]');
  await expect(moss.locator('.mk-grows')).toHaveText('The carpet collection: Pillow Moss, Java Moss, Sheet Moss… · up to 5');
  await expect(bite.locator('.mk-grows')).toContainText('Venus Flytrap, Cape Sundew');
  await expect(body.locator('.mk-chamber[data-id=WaterBox] .mk-grows')).toContainText('up to 5');   // 5 fit, not 8 (M-23)
  await expect(body.locator('.mk-chamber[data-id=LabBox] .mk-grows')).toHaveText('Any plant group: all 45 on our list');
  await expect(body.locator('.mk-chamber[data-id=SporeBox] .mk-grows')).toContainText('Mushroom cultures');
  const style = await moss.locator('.mk-grows').evaluate(el => { const c = getComputedStyle(el); return { size: parseFloat(c.fontSize), tt: c.textTransform }; });
  expect(style.size).toBeGreaterThanOrEqual(14);
  expect(style.tt).toBe('none');
  await expect(moss.locator('.mk-climate')).toHaveText('Climate 18 – 28 °C · 80 – 100 % humidity');
  await expect(body.locator('.mk-avail')).toHaveCount(10);
  await expect(bite.locator('.mk-avail')).toHaveText('Coming soon · made to order');   // volumeTwo.status
  await expect(body.locator('.mk-check')).toHaveCount(1);                              // no "Choose" on the others
  await expect(moss.locator('.mk-check')).toHaveText('Selected');
});

test('Chamber: "Help me choose a chamber" reuses guided search and offers the chambers that fit', async ({ page }) => {
  await page.goto('/maker.html');
  await page.locator('[data-act=start]').click();
  const help = panel(page).getByRole('button', { name: 'Not sure? Help me choose a chamber' });
  await help.click();
  const g = page.locator('#mkGuide');
  await expect(g).toBeVisible();
  await expect(g.locator('.mk-gd-head .caption')).toContainText('Choose a chamber');
  await g.locator('input[name=gd-look][value=minimal]').check({ force: true });
  await g.locator('[data-act=gd-next]').click();                                       // room: skip
  await g.locator('[data-act=gd-next]').click();
  await g.locator('input[name=gd-light][value=bright]').check({ force: true });
  while (await g.locator('[data-act=gd-next]').count()) await g.locator('[data-act=gd-next]').click();
  await expect(g.locator('[data-act=gd-apply]')).toHaveText(/Suggest a chamber/);
  await g.locator('[data-act=gd-apply]').click();
  await expect(g).toBeHidden();
  const sg = panel(page).locator('.mk-suggest');
  await expect(sg).toContainText('Your answers suit the Fire or Aero chambers.');
  await expect(sg.getByRole('button', { name: 'Choose Fire' })).toBeFocused();
  await expect(live(page)).toHaveText('Your answers suit the Fire or Aero chambers.');
  await sg.getByRole('button', { name: 'Choose Fire' }).click();
  await expect(panel(page).locator('.mk-chamber[data-id=FireBox]')).toHaveAttribute('aria-pressed', 'true');
  expect((await saved(page)).space.light).toBe('bright');                              // the same answers as Your space (M-11)
});

test('Foundation: "Recommended", "Suits …" on both, an unsuited mix is reachable and says why', async ({ page }) => {
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036', 'foundation');
  const body = panel(page);
  const studio = body.locator('[data-act=substrate][data-id=studio]'), aroid = body.locator('[data-act=substrate][data-id=SOIL-001]');
  await expect(studio.locator('.mk-tag')).toHaveText('Recommended');
  await expect(studio.locator('.mk-suits')).toHaveText('Suits every chamber with soil.');
  await expect(aroid.locator('.mk-why')).toHaveText('Suits Earth, Air and Dark plants, not the Moss chamber.');
  await expect(body.locator('.mk-card-price')).toHaveText(['Quoted on enquiry', 'Quoted on enquiry']);
  await expect(aroid).toHaveJSProperty('disabled', false);                             // aria-disabled, not disabled
  await expect(aroid).toHaveAttribute('aria-disabled', 'true');
  await expect(aroid).toHaveAccessibleDescription('Suits Earth, Air and Dark plants, not the Moss chamber.');
  await aroid.focus();
  await expect(aroid).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(live(page)).toHaveText('Suits Earth, Air and Dark plants, not the Moss chamber.');
  await expect(aroid).toHaveAttribute('aria-pressed', 'false');
  await expect(studio).toHaveAttribute('aria-pressed', 'true');
  // A Dark chamber takes it.
  await page.goto('/maker#c=DarkBox&s=studio&p=PLT-041');
  await page.locator('.mk-step[data-to=foundation]').click();
  await expect(aroid.locator('.mk-suits')).toHaveText('Suits Earth, Air and Dark plants.');
  await aroid.click();
  await expect(aroid).toHaveAttribute('aria-pressed', 'true');
});

test('Your space owns every answer: light and care are editable here, shown on Review and sent', async ({ page }) => {
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036&n=QA', 'space');
  const form = panel(page).locator('.mk-space');
  await expect(form.locator('legend')).toHaveText(['Where will it live?', 'What light does the space get?', 'How much care are you happy to give?', 'Who else lives there?', 'How grown should it arrive?']);
  await form.locator('.mk-choice').filter({ hasText: 'Low light' }).click();
  await form.locator('.mk-choice').filter({ hasText: 'Easy care' }).click();
  await expect(form.locator('input[name=light][value=low]')).toBeChecked();
  await expect.poll(async () => (await saved(page)).space).toMatchObject({ light: 'low', care: 'Easy' });
  await page.locator('.mk-step[data-to=review]').click();
  await expect(panel(page).locator('.mk-group').filter({ hasText: 'Your space' })).toContainText('Low light · Easy care');
  const href = await panel(page).locator('[data-key=send]').getAttribute('href');
  expect(decodeURIComponent(String(href))).toContain('Light there: Low light');
  expect(decodeURIComponent(String(href))).toContain('Care wanted: Easy');
});

test('Your space: an older save keeps its guided light answer, now in Your space', async ({ page }) => {
  await page.goto('/maker.html');
  await page.evaluate(() => localStorage.setItem('earthbox-maker', JSON.stringify({ code: 'c=MossBox&s=studio&p=PLT-036', space: { room: 'Study', household: [], maturity: '', note: '', care: '' },
    disc: { q: '', view: 'list', sort: 'recommended', f: { groups: [], forms: [], fit: true }, g: { look: '', light: 'indirect', roles: [] } } })));
  await page.reload();
  await page.locator('[data-act=resume]').click();
  await page.locator('.mk-step[data-to=space]').click();
  await expect(panel(page).locator('input[name=light][value=indirect]')).toBeChecked();
  await expect(panel(page).locator('input[name=room][value=Study]')).toBeChecked();
});

test('Resume: Continue says what the design is and returns to the last step visited', async ({ page }) => {
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe][data-id=misty-forest]').click();              // Moss, 3 plants → Plants
  await page.locator('[data-act=next]').click();                                       // → Your space
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'space');
  await page.reload();
  const resume = page.locator('[data-act=resume]');
  await expect(resume).toHaveText(/^Continue: Moss · 3 plants/, { timeout: 15_000 });
  await resume.click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'space');
  // A step that's no longer reachable falls back to the furthest one.
  await page.evaluate(() => { const s = JSON.parse(String(localStorage.getItem('earthbox-maker'))); localStorage.setItem('earthbox-maker', JSON.stringify({ ...s, code: 'c=MossBox', at: 'space' })); });
  await page.reload();
  await expect(resume).toHaveText(/^Continue: Moss/);
  await resume.click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'foundation');
});

test('Undo after a chamber switch stays until dismissed or the step changes, and is announced', async ({ page }) => {
  test.slow();   // software 3D on CI
  await openAt(page, 'c=DarkBox&s=studio&p=PLT-041', 'plants');
  const body = panel(page);
  await body.locator('[data-act=explore]').click();
  await body.locator('[data-act=switch][data-id=PLT-008]').click();
  await expect(live(page)).toContainText('Undo is available.');
  await body.locator('.mk-add[data-id=PLT-009]').click();                              // another change: Undo stays
  await expect(page.locator('[data-act=undo]')).toBeVisible();
  await page.locator('[data-act=dismiss]').click();
  await expect(page.locator('.mk-notice')).toHaveCount(0);
  await expect(body.locator('.mk-title')).toBeFocused();
  // A new switch, then a step change: gone.
  await body.locator('[data-act=switch][data-id=PLT-041]').click();
  await expect(page.locator('[data-act=undo]')).toBeVisible();
  await page.locator('[data-act=next]').click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'space');
  await expect(page.locator('[data-act=undo]')).toHaveCount(0);
});

test('Plant search: "cactus" finds the succulents', async ({ page }) => {
  await openAt(page, 'c=LabBox&s=studio&p=PLT-001', 'plants');
  await panel(page).locator('[data-key=q]').fill('cactus');
  const rows = panel(page).locator('.mk-plant-row');
  await expect(rows.filter({ hasText: 'Haworthia Fasciata' })).toHaveCount(1);
  await expect(rows.filter({ hasText: 'Burro' })).toHaveCount(1);
});

test('Recipe cards: "from" the chamber\'s guide price', async ({ page }) => {
  await page.goto('/maker.html');
  await expect(page.locator('[data-act=recipe][data-id=misty-forest] .mk-card-price')).toHaveText('from ₹6,000');
  await expect(page.locator('[data-act=recipe][data-id=zen-minimal] .mk-card-price')).toHaveText('from ₹4,000');
});
