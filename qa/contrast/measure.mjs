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

const lin = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
export const luminance = (r, g, b) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);
export const contrast = (l1, l2) => { const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1]; return (a + .05) / (b + .05); };
export const hexToRgb = (h) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

const HIDE = `[data-cq-hide], [data-cq-hide] * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }
[data-cq-hide]::placeholder { color: transparent !important; }
[data-cq-hide-mark] { visibility: hidden !important; }   /* icons only: text owners keep their own background */
/* While measuring something else, the floating WhatsApp button must not sit in the shot. */
html.cq-shot .floating-wa:not(:has([data-cq-hide], [data-cq-hide-mark])) { visibility: hidden !important; }`;

export async function resolveWithPixels(page, item){
  const el = page.locator(`[data-cq="${item.cq}"]`).first();
  if (!(await el.count())) return { ...item, status: 'review', note: 'element gone before pixel check' };
  if (!(await page.locator('#cq-hide').count())) await page.addStyleTag({ content: HIDE }).then(h => h.evaluate(e => { e.id = 'cq-hide'; }));
  const attr = item.kind === 'icon' ? 'data-cq-hide-mark' : 'data-cq-hide';
  await el.evaluate((e, a) => e.setAttribute(a, ''), attr);
  await page.evaluate(() => document.documentElement.classList.add('cq-shot'));
  let buf, inked;
  try {
    await el.evaluate((e, a) => e.removeAttribute(a), attr);
    inked = await el.screenshot({ animations: 'disabled', timeout: 5000 });
    await el.evaluate((e, a) => e.setAttribute(a, ''), attr);
    buf = await el.screenshot({ animations: 'disabled', timeout: 5000 });
  }
  catch (e) { return { ...item, status: 'review', note: `screenshot failed: ${e.message.split('\n')[0]}` }; }
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
html.cq-all [data-cq-icon] { visibility: hidden !important; }`;

export async function resolveBatch(page, items){
  if (!items.length) return [];
  const geo = await page.evaluate((ids) => ids.map(id => {
    const e = document.querySelector(`[data-cq="${id}"]`);
    if (!e) return null;
    let pinned = false;
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky' || n.tagName === 'DIALOG') { pinned = true; break; }
    }
    const r = e.getBoundingClientRect();
    return { id, pinned, top: r.top + scrollY, left: r.left + scrollX, w: r.width, h: r.height };
  }), items.map(i => i.cq));

  const out = [], loose = [];
  items.forEach((it, k) => { const g = geo[k]; if (!g || g.pinned || g.h > 600) out.push(null), loose.push(it); else it._g = g; });
  const flowing = items.filter(i => i._g).sort((a, b) => a._g.top - b._g.top);

  const startY = await page.evaluate(() => scrollY);
  // Restore the scroll position (and let scroll listeners such as the header's
  // "is-scrolled" toggle catch up) before anything pinned is measured.
  const restore = async () => { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), startY); await page.waitForTimeout(150); };
  if (flowing.length) {
    const { vh, head } = await page.evaluate(() => ({ vh: innerHeight, head: Math.ceil(document.querySelector('.runhead')?.getBoundingClientRect().bottom || 0) }));
    if (!(await page.locator('#cq-all').count())) await page.addStyleTag({ content: HIDE_ALL }).then(h => h.evaluate(e => { e.id = 'cq-all'; }));
    await page.evaluate((icons) => { document.documentElement.classList.add('cq-all', 'cq-shot'); for (const id of icons) document.querySelector(`[data-cq="${id}"]`)?.setAttribute('data-cq-icon', ''); },
      flowing.filter(i => i.kind === 'icon').map(i => i.cq));
    let i = 0;
    while (i < flowing.length) {
      const y = Math.max(0, Math.floor(flowing[i]._g.top - head - 8));
      const sy = await page.evaluate((y) => { scrollTo({ top: y, behavior: 'instant' }); return scrollY; }, y);
      await page.evaluate(() => document.documentElement.classList.remove('cq-all'));
      const inked = await sharp(await page.screenshot({ animations: 'disabled' })).raw().toBuffer({ resolveWithObject: true });
      await page.evaluate(() => document.documentElement.classList.add('cq-all'));
      const shot = await sharp(await page.screenshot({ animations: 'disabled' })).raw().toBuffer({ resolveWithObject: true });
      const scale = shot.info.width / (await page.evaluate(() => innerWidth));
      let took = 0;
      for (; i < flowing.length; i++) {
        const g = flowing[i]._g, top = g.top - sy;
        if (top + g.h > vh - 2) break;                   // not fully on this screen: next chunk
        if (top < head && sy > 0) break;
        const box = { x: Math.max(0, g.left * scale), y: Math.max(0, top * scale), w: g.w * scale, h: g.h * scale };
        flowing[i]._px = crop(shot, box); flowing[i]._ink = crop(inked, box);
        took++;
      }
      if (!took) { loose.push(flowing[i]); flowing[i]._skip = true; i++; }   // couldn't fit: measure on its own
    }
    await page.evaluate(() => { document.documentElement.classList.remove('cq-all', 'cq-shot'); document.querySelectorAll('[data-cq-icon]').forEach(e => e.removeAttribute('data-cq-icon')); });
  }
  await restore();
  const done = flowing.filter(i => !i._skip).map(it => { const r = fromPixels(it, it._px, it._ink); delete r._g; delete r._px; delete r._ink; return r; });
  for (const it of loose) { delete it._g; delete it._skip; done.push(await resolveWithPixels(page, it)); }
  return done;
}

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
export function fromPixels(item, { px, w, h }, ink = null){
  const [fr, fg, fb] = hexToRgb(item.fg);
  const a = item.fg.includes('@') ? parseFloat(item.fg.split('@')[1]) : 1;
  const blend = item.flags.find(f => f.startsWith('blend:'))?.slice(6);
  const ratios = new Float32Array(px.length / 3);
  let nr = 0;
  let dk = [255, 255, 255, 2], lt = [0, 0, 0, -1];
  let mask = null;
  if (ink && ink.px.length === px.length) {
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
    ir = ir * gk * a + r * (1 - a); ig = ig * gk * a + g * (1 - a); ib = ib * gk * a + b * (1 - a);
    ratios[nr++] = contrast(luminance(ir, ig, ib), L);
  }
  if (!nr) return { ...item, status: 'review', note: 'no pixels captured' };
  const sorted = ratios.subarray(0, nr).sort();
  const p10 = sorted[Math.floor(nr * .1)];
  const odd = blend && !['normal', 'difference'].includes(blend);
  return { ...item, method: 'pixels', ratio: Math.round(p10 * 100) / 100, ratioMin: Math.round(sorted[0] * 100) / 100,
    bg: `${hex(...dk)}…${hex(...lt)} (measured under ${mask ? 'glyphs' : 'whole box'}, ${w}×${h}px)`,
    status: odd ? 'review' : p10 >= item.threshold ? 'pass' : 'fail', note: odd ? `blend mode ${blend} not modelled` : undefined };
}
