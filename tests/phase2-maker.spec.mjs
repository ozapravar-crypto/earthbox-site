// UX Phase 2 · the Maker's Plants and Review steps (UX audit D3, D4).
// Plants: a short list where 8 or fewer plants fit (M-06), explore mode with
// the full tools (M-08, M-10), "Added ✓" and why "Full" (M-09), a thin
// preview strip and the count in the bar on phones (M-05).
// Review: what happens next (M-07), one main action (M-13), Edit leads
// back to Review (M-14), and a recipe's name goes with its chamber (M-12).
import { test, expect } from '@playwright/test';
import { quietStart } from './helpers.mjs';

/** @typedef {import('@playwright/test').Page} Page */

test.beforeEach(quietStart);

const panel = (/** @type {Page} */ page) => page.locator('#mkPanelBody');
/** Open a design link on a step. @param {Page} page @param {string} code @param {string} step */
async function openAt(page, code, step){
  await page.goto(`/maker.html#${code}`);
  await page.locator(`.mk-step[data-to=${step}]`).click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', step);
}

test('Plants, simple mode: the chamber\'s own plants straight away, no search tools', async ({ page }) => {
  await openAt(page, 'c=DarkBox&s=SOIL-001&p=PLT-041', 'plants');
  const body = panel(page);
  await expect(body.locator('.mk-title')).toHaveText('Choose up to 5 plants');
  await expect(body.locator('.mk-line')).toHaveText('These grow in the Dark chamber’s climate. Plants are quoted on enquiry.');
  await expect(body.locator('.mk-plant-row')).toHaveCount(5);
  await expect(body.locator('.mk-plant-row').first().locator('.mk-card-meta')).not.toContainText('Dark');   // group implied: shape only
  for (const sel of ['[data-key=q]', '[data-act=guide]', '[data-act=view]', '.mk-refine', '[data-act=fit]']) await expect(body.locator(sel)).toHaveCount(0);
  await expect(body.locator('.mk-ratings')).toHaveCount(1);                                          // one note (M-25)
  await expect(body).not.toContainText('Not rated yet');
  await expect(body.getByRole('button', { name: 'Explore plants from other chambers (40 more)' })).toBeVisible();
});

test('Plants: "Explore" opens every tool, with a visible climate line, named map pins and Use <chamber> + Undo', async ({ page }) => {
  test.slow();   // software 3D on CI
  await openAt(page, 'c=DarkBox&s=studio&p=PLT-041', 'plants');               // studio's foundation suits Fire too
  const body = panel(page);
  await body.locator('[data-act=explore]').click();
  await expect(body.locator('[data-key=q]')).toBeFocused();
  await expect(body.locator('[data-act=guide]')).toBeVisible();
  await expect(body.locator('.mk-views [data-act=view]')).toHaveCount(2);
  await expect(body.locator('.mk-refine > summary')).toHaveText('Filter');
  await expect(body.locator('.mk-refine input[type=checkbox]')).toHaveCount(0);                      // the switch left the fold (M-08)
  const fit = body.locator('.mk-fit-line');
  await expect(fit).toContainText('Showing plants for every climate');
  await expect(body.locator('.mk-plant-row')).toHaveCount(45);
  await fit.getByRole('button', { name: 'Only the Dark chamber' }).click();
  await expect(fit).toContainText('Showing plants for the Dark chamber');
  await expect(body.locator('.mk-plant-row')).toHaveCount(5);
  await fit.getByRole('button', { name: 'Show all climates' }).click();
  await expect(body.locator('.mk-plant-row')).toHaveCount(45);

  // Map pins carry their names (M-10).
  await body.locator('[data-act=view][data-id=map]').click();
  await expect(body.locator('.mk-pin[data-id=PLT-041] .mk-pin-name')).toHaveText('Syngonium Dark Maria');
  await expect(body.locator('.mk-pin[data-id=PLT-041]')).toHaveAccessibleName(/^Syngonium Dark Maria\s*, added$/);
  await body.locator('[data-act=view][data-id=list]').click();

  // Out-of-climate row: Use <chamber>, then Undo.
  await body.locator('[data-act=switch][data-id=PLT-008]').click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'plants');
  await expect(page.locator('.mk-notice')).toContainText('Switched to the Fire chamber and added');
  await page.locator('[data-act=undo]').click();
  await expect(page.locator('.mk-bar .mk-sum')).toContainText('Dark');

  // And back to the short list.
  await body.getByRole('button', { name: 'Back to the 5 Dark plants' }).click();
  await expect(body.locator('.mk-title')).toHaveText('Choose up to 5 plants');
});

test('Plants: the Lab chamber opens in explore mode, and "Loosen one" still rescues an empty search', async ({ page }) => {
  await openAt(page, 'c=LabBox&s=studio&p=PLT-001', 'plants');
  const body = panel(page);
  await expect(body.locator('.mk-title')).toHaveText('Add plants');
  await expect(body.locator('.mk-fit-line')).toContainText('every group grows in it');
  await expect(body.locator('[data-act=fit]')).toHaveCount(0);                                       // a switch that would change nothing
  await expect(body.locator('[data-act=simple]')).toHaveCount(0);
  await body.locator('[data-key=q]').fill('zzzz');
  await expect(body.locator('.mk-none')).toContainText('No plant matches');
  await body.locator('.mk-relax button').first().click();
  await expect(body.locator('.mk-plant-row')).toHaveCount(45);
});

test('Plants: a chosen plant reads "Added ✓" but is still named "Add …"; "Full" says why', async ({ page }) => {
  await openAt(page, 'c=BiteBox&s=studio&p=PLT-031,PLT-032,PLT-033', 'plants');
  const body = panel(page);
  const added = body.locator('.mk-add[data-id=PLT-031]');
  await expect(added.locator('[aria-hidden=true]').first()).toHaveText('Added');
  await expect(added).toHaveAccessibleName('Add Venus Flytrap');
  await expect(added).toHaveAttribute('aria-pressed', 'true');
  await expect(body.locator('#mkFull')).toHaveCount(0);
  await body.locator('.mk-add[data-id=PLT-034]').click();
  await expect(page.locator('#mkLive')).toHaveText(/4 of 4 plants\. Chamber full: remove one to add another\.$/);
  await expect(body.locator('#mkFull')).toHaveText('Chamber full: remove one to add another.');
  const full = body.locator('.mk-add[data-id=PLT-035]');
  await expect(full).toBeDisabled();
  await expect(full.locator('[aria-hidden=true]')).toHaveText('Full');
  await expect(full).toHaveAccessibleName('Add North American Pitcher Plant');
  await expect(full).toHaveAttribute('aria-describedby', 'mkFull');
  await expect(page.locator('.mk-bar .mk-count')).toContainText('4 of 4 plants · chamber full');
});

test('Plants: the count and the chosen plants live in the bottom bar', async ({ page }) => {
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036,PLT-037', 'plants');
  const bar = page.locator('#mkBar');
  await expect(bar.locator('.mk-count')).toContainText('2 of 5 plants');
  await expect(bar.locator('.mk-sum')).toContainText('Moss · ₹6,000 – ₹9,000 · plants quoted');
  const toggle = bar.getByRole('button', { name: 'View / remove' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(bar.locator('#mkTray')).toBeHidden();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(bar.locator('#mkTray li')).toHaveCount(2);
});

test('Plants on a phone: the preview is a thin strip until "View 3D"; desktop has no toggle', async ({ page, isMobile }) => {
  test.slow();   // software 3D on CI
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036', 'plants');
  const fig = page.locator('#mkPreview'), toggle = page.locator('#mkViewToggle');
  await expect(fig.locator('figcaption')).toContainText('indicative');
  if (!isMobile) { await expect(toggle).toBeHidden(); return; }
  const h = async () => (await fig.boundingBox())?.height ?? 0;
  expect(await h()).toBeLessThanOrEqual(100);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(h).toBeGreaterThan(200);
  await expect(fig.locator('figcaption')).toContainText('indicative');
  await toggle.click();
  await expect.poll(h).toBeLessThanOrEqual(100);
  // The list now starts in the top half of the screen.
  const first = await panel(page).locator('.mk-plant-row').first().boundingBox();
  expect(first?.y ?? 999).toBeLessThan(/** @type {number} */ (page.viewportSize()?.height) / 2);
});

test('Plants: explore mode is saved; old saves open on their tools only if they had used them', async ({ page }) => {
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe]').first().click();                      // Misty Forest: Moss
  await panel(page).locator('[data-act=explore]').click();
  await page.reload();
  await page.locator('[data-act=resume]').click();
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(panel(page).locator('[data-key=q]')).toBeVisible();

  // A save from before explore mode, with a search typed: back to the tools.
  const old = (/** @type {object | undefined} */ disc) => ({ code: 'c=MossBox&s=studio&p=PLT-036', space: {}, disc });
  await page.evaluate(v => localStorage.setItem('earthbox-maker', JSON.stringify(v)), old({ q: 'moss', view: 'list', sort: 'recommended', f: { groups: [], forms: [], fit: true }, g: { look: '', light: '', roles: [] } }));
  await page.reload();
  await page.locator('[data-act=resume]').click();
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(panel(page).locator('[data-key=q]')).toHaveValue('moss');
  // An untouched old save: the short list.
  await page.evaluate(v => localStorage.setItem('earthbox-maker', JSON.stringify(v)), old(undefined));
  await page.reload();
  await page.locator('[data-act=resume]').click();
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(panel(page).locator('.mk-title')).toHaveText('Choose up to 5 plants');
});

test('Review: made to order, what happens next, then one main action, the sends, Care, and text links', async ({ page }) => {
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036&n=QA', 'review');
  const body = panel(page);
  await expect(body.locator('.mk-title')).toHaveText('Review your world');
  const chamber = body.locator('.mk-group').first();
  await expect(chamber).toContainText('Made to order · availability confirmed with your quote');
  await expect(chamber).not.toContainText('lead time');                         // not in stock: lead time comes with the quote (M-07)
  await expect(body.locator('.mk-next li')).toHaveText([
    'Send the design.',
    'The studio replies with a quote, availability and lead time.',
    'You confirm and get a payment link; nothing is charged until then.'
  ]);
  await expect(body.locator('.cta:not(.cta-secondary)')).toHaveCount(1);       // one main button (M-13)
  await expect(body.locator('[data-key=send]')).toHaveText(/Send just this design on WhatsApp/);
  await expect(body.locator('[data-key=copy]')).toHaveClass(/ct-link/);
  await expect(body.locator('[data-key=reset]')).toHaveClass(/ct-link/);
  // Reading order (the email form is folded away on phones, so not by position).
  const order = await body.evaluate(el => { const all = [...el.querySelectorAll('*')];
    return ['[data-key=cart]', '[data-key=send]', '.enquiry-alt', '.mk-care', '[data-key=copy]', '[data-key=reset]'].map(s => all.indexOf(/** @type {Element} */ (el.querySelector(s)))); });
  expect(order.every((n, i) => n >= 0 && (i === 0 || n > /** @type {number} */ (order[i - 1])))).toBe(true);
});

test('Review: Edit leads back to Review', async ({ page }) => {
  await openAt(page, 'c=MossBox&s=studio&p=PLT-036&n=QA', 'review');
  await panel(page).locator('[data-key=edit-plants]').click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'plants');
  await panel(page).locator('.mk-add[data-id=PLT-037]').click();
  const next = page.locator('[data-act=next]');
  await expect(next).toHaveText('Back to review');
  await next.click();
  await expect(page.locator('#maker')).toHaveAttribute('data-stage', 'review');
  await expect(panel(page).locator('.mk-title')).toBeFocused();
  // Through the step bar instead, the usual sequence.
  await page.locator('.mk-step[data-to=plants]').click();
  await expect(next).toHaveText('Continue');
});

test('Review: a recipe\'s name is cleared when its chamber changes, and Undo brings it back', async ({ page }) => {
  await page.goto('/maker.html');
  await page.locator('[data-act=recipe][data-id=tiny-jungle]').click();
  await page.locator('.mk-step[data-to=chamber]').click();
  await page.locator('[data-act=chamber][data-id=FireBox]').click();
  await expect(page.locator('.mk-notice')).toContainText('The recipe name “Tiny Jungle” was cleared.');
  const code = () => page.evaluate(() => String(JSON.parse(String(localStorage.getItem('earthbox-maker'))).code));
  expect(await code()).not.toContain('n=');
  await page.locator('[data-act=undo]').click();
  await expect(page.locator('.mk-bar .mk-sum')).toContainText('Dark');
  expect(await code()).toContain('n=Tiny');
  await page.locator('.mk-step[data-to=review]').click();
  await expect(panel(page).locator('.mk-name input')).toHaveValue('Tiny Jungle');   // its own chamber: kept
});
