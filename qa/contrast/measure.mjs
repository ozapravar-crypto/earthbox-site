// ─────────────────────────────────────────────────────────────────────
// qa/contrast/measure.mjs · Node side of the contrast audit
//
// resolveWithPixels(): for an item the stylesheet can't settle (photo or
// gradient behind it, blend mode, overlap), hide just that element's ink,
// screenshot its box, and compute the contrast of the ink against EVERY
// pixel that was actually behind it. Reports the 10th-percentile (worst
// tenth) ratio, so a few anti-aliased edge pixels don't decide it but a
// bright patch of photo under part of a word does.
// ─────────────────────────────────────────────────────────────────────

import sharp from 'sharp';

/** @typedef {import('@playwright/test').Page} Page */
/** @typedef {import('./scan.js').Finding} Finding */
/** @typedef {{ data: Buffer, info: import('sharp').OutputInfo }} Raw  a decoded screenshot */
/** @typedef {{ px: Uint8Array, w: number, h: number }} Crop  RGB pixels of one box */
/** @typedef {{ id: number, pinned: boolean, top: number, left: number, w: number, h: number }} Geo */
/** @typedef {Finding & { _g?: Geo, _px?: Crop, _ink?: Crop, _skip?: boolean }} Item  a finding plus batch scratch fields */

const lin = (/** @type {number} */ v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
/** @type {(r: number, g: number, b: number) => number} */
export const luminance = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
/** @type {(l1: number, l2: number) => number} */
export const contrast = (l1, l2) => { const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1]; return (a + .05) / (b + .05); };
/** @type {(h: string) => number[]} */
export const hexToRgb = (h) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
/** @type {(r: number, g: number, b: number, _l?: number) => string} */
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

const HIDE = `[data-cq-hide], [data-cq-hide] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }
[data-cq-hide]::placeholder { color: transparent !important; }
[data-cq-hide-mark] { visibility: hidden !important; }   /* icons only: text owners keep their own background */
/* While measuring something else, the floating WhatsApp button must not sit in the shot. */
html.cq-shot .floating-wa:not(:has([data-cq-hide], [data-cq-hide-mark])) { visibility: hidden !important; }`;

/** @param {Page} page @param {Finding} item  a 'review' row (it has fg and threshold) */
export async function resolveWithPixels(page, item){
  if (item.kind === 'focus-ring') return ringPixels(page, item);
  const el = page.locator(`[data-cq="${item.cq}"]`).first();
  if (!(await el.count())) return { ...item, status: 'review', note: 'element gone before pixel check' };
  if (!(await page.locator('#cq-hide').count())) await page.addStyleTag({ content: HIDE }).then(h => h.evaluate(e => { /** @type {Element} */ (e).id = 'cq-hide'; }));
  const attr = item.kind === 'icon' ? 'data-cq-hide-mark' : 'data-cq-hide';
  await el.evaluate((e, a) => e.setAttribute(a, ''), attr);
  await page.evaluate(() => document.documentElement.classList.add('cq-shot'));
  /** @type {Buffer} */
  let buf;
  /** @type {Buffer} */
  let inked;
  try {
    // Shoot the element's screen area, not the element: a hidden icon can't be
    // screenshotted by locator (it waits for visibility and times out).
    await el.evaluate((e, a) => e.removeAttribute(a), attr);
    // Centre it (not just "into view"), so bottom bars don't sit over it.
    // Scrolling moves it out from under the pointer, so a hovered control is
    // hovered again (its fill sweep would otherwise vanish before the shot).
    const hovered = await el.evaluate(e => !!e.closest(':hover') && e.closest('a,button,summary,label')?.matches(':hover')).catch(() => false);
    await el.evaluate(e => { if (!e.closest('[style*="position: fixed"]')) e.scrollIntoView({ block: 'center', behavior: 'instant' }); }).catch(() => {});
    if (hovered) await el.hover({ force: true, timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(80);
    const box = await el.boundingBox();
    if (!box || box.width < 1 || box.height < 1) throw new Error('no box');
    const clip = { x: box.x, y: box.y, width: box.width, height: box.height };
    inked = await page.screenshot({ clip, animations: 'disabled', timeout: 5000 });
    await el.evaluate((e, a) => e.setAttribute(a, ''), attr);
    buf = await page.screenshot({ clip, animations: 'disabled', timeout: 5000 });
  }
  catch (e) { return { ...item, status: 'review', note: `screenshot failed: ${/** @type {Error} */ (e).message.split('\n')[0]}` }; }
  finally {
    await el.evaluate((e, a) => e.removeAttribute(a), attr).catch(() => {});
    await page.evaluate(() => document.documentElement.classList.remove('cq-shot')).catch(() => {});
  }

  const A = await sharp(inked).raw().toBuffer({ resolveWithObject: true });
  const B = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  const all = { x: 0, y: 0, w: B.info.width, h: B.info.height };
  return fromPixels(item, crop(B, all), crop(A, all));
}

// Batched version for a whole state: hide every piece of ink on the page at
// once, take one viewport screenshot per screenful, and read each item's
// backdrop from it. Items inside fixed/sticky boxes or dialogs (whose
// position changes with scrolling) go through resolveWithPixels one by one.
const HIDE_ALL = `html.cq-all body * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }
html.cq-all body *::placeholder { color: transparent !important; }
html.cq-all [data-cq-icon] { visibility: hidden !important; }
html.cq-shot .floating-wa:not(:has([data-cq-hide], [data-cq-hide-mark])) { visibility: hidden !important; }`;

/** @param {Page} page @param {Item[]} items  'review' rows */
export async function resolveBatch(page, items){
  if (!items.length) return [];
  const geo = await page.evaluate((ids) => ids.map(id => {
    const e = document.querySelector(`[data-cq="${id}"]`);
    if (!e) return null;
    let pinned = false;
    for (let n = /** @type {Element | null} */ (e); n?.nodeType === 1; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky' || n.tagName === 'DIALOG') { pinned = true; break; }
    }
    const r = e.getBoundingClientRect();
    return { id, pinned, top: r.top + scrollY, left: r.left + scrollX, w: r.width, h: r.height };
  }), items.map(i => i.cq));

  /** @type {null[]} */
  const out = [];
  /** @type {Item[]} */
  const loose = [];
  items.forEach((it, k) => { const g = geo[k]; if (!g || g.pinned || g.h > 600 || it.kind === 'focus-ring') out.push(null), loose.push(it); else it._g = g; });
  const flowing = /** @type {(Item & { _g: Geo })[]} */ (items.filter(i => i._g)).sort((a, b) => a._g.top - b._g.top);

  const startY = await page.evaluate(() => scrollY);
  // Restore the scroll position (and let scroll listeners such as the header's
  // "is-scrolled" toggle catch up) before anything pinned is measured.
  const restore = async () => { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), startY); await page.waitForTimeout(150); };
  if (flowing.length) {
    // Usable band of the viewport: below the fixed header and above any fixed or
    // sticky bar along the bottom (the Maker's action bar covered buttons on phones).
    const { vh, head } = await page.evaluate(() => {
      let foot = innerHeight;
      for (const x of [innerWidth * .25, innerWidth * .5, innerWidth * .75])
        for (const e of document.elementsFromPoint(x, innerHeight - 4)) {
          const p = getComputedStyle(e).position;
          if ((p === 'fixed' || p === 'sticky') && !e.classList.contains('floating-wa')) { foot = Math.min(foot, e.getBoundingClientRect().top); break; }
        }
      return { vh: Math.floor(foot), head: Math.ceil(document.querySelector('.runhead')?.getBoundingClientRect().bottom || 0) };
    });
    if (!(await page.locator('#cq-all').count())) await page.addStyleTag({ content: HIDE_ALL }).then(h => h.evaluate(e => { /** @type {Element} */ (e).id = 'cq-all'; }));
    await page.evaluate((icons) => { document.documentElement.classList.add('cq-all', 'cq-shot'); for (const id of icons) document.querySelector(`[data-cq="${id}"]`)?.setAttribute('data-cq-icon', ''); },
      flowing.filter(i => i.kind === 'icon').map(i => i.cq));
    let i = 0;
    while (i < flowing.length) {
      // Already fully on screen? Measure in place: scrolling would end a hover
      // (the pointer stops being over the control) and change what's measured.
      const cur = await page.evaluate(() => scrollY), g0 = flowing[i]._g;
      const onScreen = g0.top - cur >= (cur > 0 ? head : 0) && g0.top - cur + g0.h <= vh - 2;
      const y = onScreen ? cur : Math.max(0, Math.floor(g0.top - head - 8));
      const sy = onScreen ? cur : await page.evaluate((y) => { scrollTo({ top: y, behavior: 'instant' }); return scrollY; }, y);
      await page.evaluate(() => document.documentElement.classList.remove('cq-all'));
      const inked = await sharp(await page.screenshot({ animations: 'disabled' })).raw().toBuffer({ resolveWithObject: true });
      await page.evaluate(() => document.documentElement.classList.add('cq-all'));
      const shot = await sharp(await page.screenshot({ animations: 'disabled' })).raw().toBuffer({ resolveWithObject: true });
      const scale = shot.info.width / (await page.evaluate(() => innerWidth));
      let took = 0;
      const start = i;
      for (; i < flowing.length; i++) {
        const g = flowing[i]._g, top = g.top - sy;
        if (top + g.h > vh - 2) break;                   // not fully on this screen: next chunk
        if (top < head && sy > 0) break;
      }
      // Is each item really the topmost thing at its spot on this screen? A
      // sticky panel (the Maker's preview on phones) can sit over it. 14 of 30
      // phone items were measured against the preview before this check.
      const ids = flowing.slice(start, i).map(it => it.cq);
      const clear = await page.evaluate((ids) => ids.map(id => {
        const e = /** @type {Element} */ (document.querySelector(`[data-cq="${id}"]`)), r = e.getBoundingClientRect();
        return [[.5, .5], [.15, .5], [.85, .5]].every(([fx, fy]) => {
          const t = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
          return t && (t === e || e.contains(t) || t.contains(e));
        });
      }), ids);
      for (let k = start; k < i; k++) {
        if (!clear[k - start]) { loose.push(flowing[k]); flowing[k]._skip = true; continue; }
        const g = flowing[k]._g, top = g.top - sy;
        const box = { x: Math.max(0, g.left * scale), y: Math.max(0, top * scale), w: g.w * scale, h: g.h * scale };
        flowing[k]._px = crop(shot, box); flowing[k]._ink = crop(inked, box);
        took++;
      }
      if (i > start) took = Math.max(took, 1);          // progress was made even if every item went to the single path
      if (!took) { loose.push(flowing[i]); flowing[i]._skip = true; i++; }   // couldn't fit: measure on its own
    }
    await page.evaluate(() => { document.documentElement.classList.remove('cq-all', 'cq-shot'); document.querySelectorAll('[data-cq-icon]').forEach(e => e.removeAttribute('data-cq-icon')); });
  }
  await restore();
  /** @type {Finding[]} */
  const done = [];
  for (const it of flowing.filter(i => !i._skip)) {
    const r = fromPixels(/** @type {Item} */ (it), /** @type {Crop} */ (it._px), it._ink); delete r._g; delete r._px; delete r._ink;
    // A batch FAIL is only a candidate: confirm it with the precise per-element
    // shot (batch and single disagreed on 2 of 120 items in testing).
    if (r.status === 'fail') { const it2 = /** @type {Item} */ ({ ...it }); delete it2._g; delete it2._px; delete it2._ink; const s = await resolveWithPixels(page, it2); done.push({ ...s, note: s.status === 'fail' ? 'confirmed by a per-element shot' : `batch said ${String(r.ratio)}:1; per-element shot ${String(s.ratio)}:1` }); continue; }
    done.push(r);
  }
  for (const it of loose) { delete it._g; delete it._skip; done.push(await resolveWithPixels(page, it)); }
  return done;
}

/** @param {Raw} shot @param {{ x: number, y: number, w: number, h: number }} box @returns {Crop} */
function crop({ data, info }, { x, y, w, h }){
  const x0 = Math.round(x), y0 = Math.round(y), x1 = Math.min(info.width, Math.round(x + w)), y1 = Math.min(info.height, Math.round(y + h));
  const px = new Uint8Array(Math.max(0, x1 - x0) * Math.max(0, y1 - y0) * 3);   // typed: the machine may be short of memory
  let k = 0;
  for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const o = (yy * info.width + xx) * info.channels; px[k++] = data[o]; px[k++] = data[o + 1]; px[k++] = data[o + 2]; }
  return { px, w: x1 - x0, h: y1 - y0 };
}

// Contrast of the item's ink against each backdrop pixel (shared maths).
// `ink` is the same box with the text drawn: pixels that differ are where the
// glyphs sit, and only the backdrop under those counts. (Without the mask,
// empty space around short words would decide the ratio.) If the ink can't
// be seen at all (same colour as everything behind it), fall back to all
// pixels — which then correctly fails.
/**
 * @template {Finding} T
 * @param {T} item  a measured row (it has fg and threshold)
 * @param {Crop} backdrop
 * @param {Crop | null} [ink]
 */
export function fromPixels(item, { px, w, h }, ink = null){
  const fgHex = /** @type {string} */ (item.fg), threshold = /** @type {number} */ (item.threshold);
  const [fr, fg, fb] = hexToRgb(fgHex);
  const a = fgHex.includes('@') ? parseFloat(fgHex.split('@')[1]) : 1;
  const blend = item.flags.find(f => f.startsWith('blend:'))?.slice(6);
  const op = item.opAbove ?? 1;
  const ink0 = item.inkCss ? hexToRgb(item.inkCss).map(v => v * (item.grain ?? 1)) : [fr, fg, fb];
  const bg0 = item.bgCss ? hexToRgb(item.bgCss).map(v => v * (item.grain ?? 1)) : [0, 0, 0];
  const ratios = new Float32Array(px.length / 3);
  let nr = 0;
  /** @type {[number, number, number, number]} */
  let dk = [255, 255, 255, 2];
  /** @type {[number, number, number, number]} */
  let lt = [0, 0, 0, -1];   // darkest, lightest: r, g, b, luminance
  /** @type {Uint8Array | null} */
  let mask = null;
  if (ink?.px.length === px.length) {
    mask = new Uint8Array(px.length / 3);
    let n = 0;
    for (let i = 0, k = 0; i < px.length; i += 3, k++)
      if (Math.max(Math.abs(px[i] - ink.px[i]), Math.abs(px[i + 1] - ink.px[i + 1]), Math.abs(px[i + 2] - ink.px[i + 2])) > 24) { mask[k] = 1; n++; }
    if (n < 6) mask = null;
  }
  for (let i = 0, k = 0; i < px.length; i += 3, k++) {
    if (mask && !mask[k]) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2], L = luminance(r, g, b);
    if (L < dk[3]) dk = [r, g, b, L];
    if (L > lt[3]) lt = [r, g, b, L];
    let [ir, ig, ib] = blend === 'difference' ? [Math.abs(r - fr), Math.abs(g - fg), Math.abs(b - fb)] : [fr, fg, fb];
    const gk = item.grain ?? 1;                          // the grain darkens the ink as it darkens the backdrop
    if (op < .999) {
      // Ancestor opacity over the background box: this pixel P = op·bg + (1−op)·B,
      // and the ink there = op·ink + (1−op)·B, so ink = P + op·(ink − bg).
      ir = r + op * (ink0[0] - bg0[0]); ig = g + op * (ink0[1] - bg0[1]); ib = b + op * (ink0[2] - bg0[2]);
    } else {
      ir = ir * gk * a + r * (1 - a); ig = ig * gk * a + g * (1 - a); ib = ib * gk * a + b * (1 - a);
    }
    ir = Math.min(255, Math.max(0, ir)); ig = Math.min(255, Math.max(0, ig)); ib = Math.min(255, Math.max(0, ib));
    ratios[nr++] = contrast(luminance(ir, ig, ib), L);
  }
  if (!nr) return { ...item, status: 'review', note: 'no pixels captured' };
  const sorted = ratios.subarray(0, nr).sort();
  const p10 = sorted[Math.floor(nr * .1)];
  const odd = blend && !['normal', 'difference'].includes(blend);
  return { ...item, method: 'pixels', ratio: Math.round(p10 * 100) / 100, ratioMin: Math.round(sorted[0] * 100) / 100,
    bg: `${hex(...dk)}…${hex(...lt)} (measured under ${mask ? 'glyphs' : 'whole box'}, ${w}×${h}px)`,
    status: odd ? 'review' : p10 >= threshold ? 'pass' : mask ? 'fail' : 'review',
    note: odd ? `blend mode ${blend} not modelled` : !mask && p10 < threshold ? 'glyphs could not be isolated; whole-box measurement is not conclusive' : undefined };
}

// Focus ring: shoot the control's box plus the ring area with the ring drawn
// and with it transparent; the pixels that differ are the ring, measured
// against whatever is really behind them (photo, band, page).
/** @param {Page} page @param {Finding} item */
async function ringPixels(page, item){
  const el = page.locator(`[data-cq-ring="${item.cq}"]`).first();
  if (!(await el.count())) return { ...item, status: 'review', note: 'focused element gone' };
  await el.evaluate(e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));   // the scan restores scroll; bring the ring back on screen
  await page.waitForTimeout(100);
  // ponytail: a ring element with no box (or a page without a viewport) throws here, uncaught.
  const box = /** @type {NonNullable<Awaited<ReturnType<typeof el.boundingBox>>>} */ (await el.boundingBox());
  const pad = await el.evaluate(e => { const c = getComputedStyle(e); return parseFloat(c.outlineOffset) + parseFloat(c.outlineWidth) + 2; });
  const vp = /** @type {{ width: number, height: number }} */ (page.viewportSize());
  const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad);
  const clip = { x, y, width: Math.min(vp.width - x, box.width + 2 * pad), height: Math.min(vp.height - y, box.height + 2 * pad) };
  await page.evaluate(() => document.documentElement.classList.add('cq-shot'));
  try {
    const inked = await page.screenshot({ clip, animations: 'disabled' });
    await el.evaluate(e => e.style.setProperty('outline-color', 'transparent', 'important'));
    const bare = await page.screenshot({ clip, animations: 'disabled' });
    const A = await sharp(inked).raw().toBuffer({ resolveWithObject: true });
    const B = await sharp(bare).raw().toBuffer({ resolveWithObject: true });
    const all = { x: 0, y: 0, w: B.info.width, h: B.info.height };
    return fromPixels(item, crop(B, all), crop(A, all));
  } catch (e) {
    return { ...item, status: 'review', note: `ring screenshot failed: ${/** @type {Error} */ (e).message.split('\n')[0]}` };
  } finally {
    await el.evaluate(e => e.style.removeProperty('outline-color')).catch(() => {});
    await page.evaluate(() => document.documentElement.classList.remove('cq-shot')).catch(() => {});
  }
}
