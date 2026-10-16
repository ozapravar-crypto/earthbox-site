// ─────────────────────────────────────────────────────────────────────
// cart.js · cart + saved list (every page)
//
// The site still takes no payment. The cart collects what a visitor wants,
// tallies what can be tallied, and sends the whole order to the studio,
// which confirms stock, delivery and the final total, then sends a
// payment link. Swap `orderText` → a checkout call once Razorpay exists.
//
// Three kinds of line, because the catalogue has three kinds of price:
//   fixed   · Volume I pieces with a price per size × material → qty × price
//   enquiry · no price (coming soon pieces, Elemental chambers) → "On enquiry",
//             with the chamber's published range shown as a guide
//   custom  · a Maker build → one row per component (chamber, foundation,
//             plants), each priced or "on enquiry", summed into a build total
// Care (/care) adds two line types that land in those kinds:
//   refill kits are ordinary product lines (KIT-…, priced or on enquiry);
//   a visit plan is {kind:'care', code} → fixed when the studio has set a
//   per-visit rate, else on enquiry; custom boxes are always quoted.
//
// Lines are stored as ids only and resolved against data on every read, so
// a price change in data/ shows up in carts already saved, and anything
// unknown (old SKU, edited storage) is dropped. Rules are checked by
// cart.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne, materials, photoPath } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';
import { substrates } from '../data/maker.js';
import { kits } from '../data/care.js';
import { decodePlan, encodePlan, planPrice, planSummary, refLabel } from './care.js';
import { suggest } from './pairings.js';
import { decodeBuild, encodeBuild, chamberOf, plantOf, isSoilless } from './build-codec.js';
import { enquiryAltHTML, ENQUIRY_PHONE } from './enquiry-form.js';
import { SITE } from '../data/site.js';
import { esc, rupees, track, art } from './util.js';
import { icon } from '../data/icons.js';

const STORE = 'earthbox-cart';
const MAX_QTY = 20;

// "₹8,000 – ₹12,000" → [8000, 12000]
export const parseRange = (s) => {
  const n = String(s || '').replace(/,/g, '').match(/\d+/g);
  return n ? [+n[0], +n[n.length - 1]] : null;
};
const num = (v) => (typeof v === 'number' && v > 0 ? v : null);


// ═══ RULES (pure) ═════════════════════════════════════════════════════

export const emptyCart = () => ({ cart: [], saved: [] });

// A line's identity: the same piece in another size or material is a new line.
export const keyOf = (l) => l.kind === 'build' ? `build:${l.code}` : l.kind === 'care' ? `care:${l.code}`
  : [l.sku, l.variant, l.material].filter(Boolean).join('|');
const ONE_OFF = (l) => l.kind === 'build' || l.kind === 'care';   // no quantity

// Line (ids) → everything the drawer and the order message need.
export function resolve(l, list = 'cart'){
  if (l.kind === 'build') {
    const b = decodeBuild(l.code);
    if (!b) return null;
    const ch = chamberOf(b), sub = substrates.find(s => s.id === b.substrate);
    const parts = [
      { label: `${ch.name} chamber`, price: null, range: parseRange(ch.price), note: ch.price },
      isSoilless(ch.sku) ? { label: 'No foundation, soil-free', price: 0, note: '—' }
        : { label: sub ? sub.name : 'Foundation · studio’s choice', price: num(sub?.price) },
      ...b.plants.map(id => ({ label: plantOf(id).name, price: num(plantOf(id).price) }))
    ];
    return { kind: 'custom', key: keyOf(l), qty: 1, title: b.name || `${ch.name} world`, sub: 'Custom build · Maker',
      // The chamber's own line art, not a letter (audit K4): botanical art, not an icon.
      href: `/maker#${encodeBuild(b)}`, img: ch.illustration ? `/assets/boxes/${ch.illustration}` : null, parts, status: `Made to order · ${ch.lead}` };
  }
  if (l.kind === 'care') {
    const plan = decodePlan(l.code);
    if (!plan) return null;
    const price = planPrice(plan);
    return { kind: price ? 'fixed' : 'enquiry', care: true, key: keyOf(l), qty: 1, title: `Care visits · ${refLabel(plan)}`,
      sub: planSummary(plan), href: `/care#${encodePlan(plan)}`, img: null, unit: price,
      status: plan.s === 'custom' ? 'Quoted for custom boxes' : 'Mumbai · studio confirms dates' };
  }
  const kit = kits.find(k => k.sku === l.sku);
  if (kit) return { kind: kit.price ? 'fixed' : 'enquiry', care: true, key: keyOf(l), qty: l.qty, title: kit.name,
    sub: kit.for, href: '/care', img: null, unit: kit.price, status: 'Studio confirms contents · about 1 week' };
  const p = volumeOne.find(x => x.sku === l.sku);
  // Coming-soon pieces can't be ordered yet (UX audit S-01, 16 Oct 2026), as
  // with chambers: an old cart line is dropped; the Saved list keeps them.
  if (p && list === 'cart' && p.status === 'coming-soon') return null;
  if (p) {
    const variant = p.variants?.find(v => v.id === l.variant);
    if (p.variants?.length && !variant) return null;
    const table = p.pricing ? (variant ? p.pricing[variant.id] : p.pricing) : null;
    if (table && !table[l.material]) return null;
    const mat = materials.find(m => m.id === l.material);
    return { kind: table ? 'fixed' : 'enquiry', key: keyOf(l), qty: l.qty, title: p.name,
      sub: [variant?.name, mat?.name].filter(Boolean).join(' · ') || 'Volume I',
      href: `/product/${encodeURIComponent(p.sku)}`, img: p.photo ? photoPath(p, '300') : null,
      unit: table ? table[l.material] : null,
      cartable: p.status !== 'coming-soon',
      status: p.status === 'coming-soon' ? 'Coming soon' : 'Made to order · about 1 week' };
  }
  // Coming-soon chambers never resolve, so they can't be added and any old
  // cart line is dropped (studio decision, 12 Oct 2026). Saved list keeps them.
  const box = volumeTwo.boxes.find(x => x.sku === l.sku);
  if (box && list === 'cart' && volumeTwo.status === 'Coming soon') return null;
  if (box) return { kind: 'enquiry', cartable: volumeTwo.status !== 'Coming soon', key: keyOf(l), qty: l.qty, title: `${box.name} chamber`, sub: `Elemental Box · ${box.edition}`,
    href: `/product/${encodeURIComponent(box.sku)}`, img: box.photo ? `/assets/boxes/${box.photo}` : null,
    unit: null, range: parseRange(box.price), note: box.price, status: `${volumeTwo.status} · ${box.lead}` };
  return null;
}

// A build's own total: priced parts summed, the chamber range carried, the rest counted.
export function buildTotal(r){
  const fixed = r.parts.reduce((s, p) => s + (p.price || 0), 0);
  const range = r.parts.find(p => p.range)?.range || [0, 0];
  return { low: fixed + range[0], high: fixed + range[1], quoted: r.parts.filter(p => p.price === null && !p.range).length };
}

// The whole cart. `fixed` is exact; low/high add the guide ranges; `quoted`
// counts lines (or build parts) the studio still has to price.
export function totals(lines){
  let fixed = 0, low = 0, high = 0, quoted = 0, items = 0;
  for (const r of lines) {
    items += r.qty;
    if (r.kind === 'fixed') { fixed += r.unit * r.qty; continue; }
    if (r.kind === 'custom') { const t = buildTotal(r); low += t.low; high += t.high; quoted += t.quoted; continue; }
    if (r.range) { low += r.range[0] * r.qty; high += r.range[1] * r.qty; } else quoted += r.qty;
  }
  return { items, fixed, low: fixed + low, high: fixed + high, ranged: high > 0, quoted };
}

// Untrusted storage → only lines that still resolve, qty clamped, no duplicates.
export function clean(raw){
  const out = emptyCart();
  for (const list of ['cart', 'saved']) {
    const seen = new Set();
    for (const l of Array.isArray(raw?.[list]) ? raw[list] : []) {
      if (!l || typeof l !== 'object') continue;
      const line = ONE_OFF(l)
        ? { kind: l.kind, code: String(l.code || '') }
        : { kind: 'product', sku: String(l.sku || ''), variant: l.variant || null, material: l.material || null,
            qty: Math.min(MAX_QTY, Math.max(1, parseInt(l.qty, 10) || 1)) };
      if (!resolve(line, list) || seen.has(keyOf(line))) continue;
      seen.add(keyOf(line)); out[list].push(line);
    }
  }
  return out;
}

export function add(state, list, line){
  if (!resolve(line, list)) return state;   // e.g. a coming-soon chamber can be saved, not carted
  const s = structuredClone(state), k = keyOf(line);
  const hit = s[list].find(l => keyOf(l) === k);
  if (hit && list === 'cart' && hit.kind === 'product') hit.qty = Math.min(MAX_QTY, hit.qty + (line.qty || 1));
  else if (!hit) s[list].push(ONE_OFF(line) ? line : { qty: 1, ...line });
  return s;
}
export const remove = (state, list, key) => ({ ...state, [list]: state[list].filter(l => keyOf(l) !== key) });
export function setQty(state, key, qty){
  const s = structuredClone(state);
  const l = s.cart.find(x => keyOf(x) === key);
  if (l && l.kind === 'product') l.qty = Math.min(MAX_QTY, Math.max(1, qty));
  return s;
}
export function move(state, from, key){
  const l = state[from].find(x => keyOf(x) === key);
  if (!l || !resolve(l, from === 'cart' ? 'saved' : 'cart')) return state;   // never lose a line it can't move
  return add(remove(state, from, key), from === 'cart' ? 'saved' : 'cart', l);
}

export function orderText(lines){
  const t = totals(lines);
  const out = ['Hi Aayush, I’d like to order from EarthBox.', ''];
  lines.forEach((r, i) => {
    if (r.kind === 'custom') {
      out.push(`${i + 1}. ${r.title} (custom build)`);
      r.parts.forEach(p => out.push(`   · ${p.label}: ${p.price ? rupees(p.price) : p.note || 'on enquiry'}`));
      out.push(`   Design: ${SITE}${r.href}`);
    } else {
      const price = r.kind === 'fixed' ? `${rupees(r.unit)}${r.qty > 1 ? ` × ${r.qty} = ${rupees(r.unit * r.qty)}` : ''}`
        : r.note ? `on enquiry (guide ${r.note})` : 'on enquiry';
      out.push(`${i + 1}. ${r.title}${r.sub ? ` · ${r.sub}` : ''}${r.qty > 1 && r.kind !== 'fixed' ? ` × ${r.qty}` : ''}: ${price}`);
    }
  });
  out.push('');
  if (t.fixed) out.push(`Priced items: ${rupees(t.fixed)}`);
  if (t.ranged) out.push(`Estimate incl. chamber ranges: ${rupees(t.low)} – ${rupees(t.high)}`);
  if (t.quoted) out.push(`Still to quote: ${t.quoted} item${t.quoted > 1 ? 's' : ''}`);
  out.push('', 'Could you confirm the total, delivery and lead time?');
  return out.join('\n');
}


// ═══ UI ═══════════════════════════════════════════════════════════════
// Browser-only below. Links are root-absolute so the drawer works under /blog/ too.
// Other scripts call addLine() and listen for nothing:
// the header counts and the drawer redraw from storage on every change.

let state = emptyCart();
const read = () => { try { state = clean(JSON.parse(localStorage.getItem(STORE) || 'null')); } catch { state = emptyCart(); } };
const write = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode: lives for this page only */ } };

let dlg, tab = 'cart', lastFocus;
// One-line status at the top of the drawer. `undo` holds the whole previous
// state, so Undo works the same for remove, clear and move.
let notice = null;

function addLine(list, line, { open = true } = {}){
  state = add(state, list, line);
  write(); refresh();
  track(list === 'cart' ? 'cart_add' : 'saved_add', { kind: line.kind, sku: line.sku || line.kind });
  if (open) openDrawer(list);
}
const has = (list, line) => state[list].some(l => keyOf(l) === keyOf(line));


function priceCell(r){
  if (r.kind === 'fixed') return `<span class="ct-price">${rupees(r.unit * r.qty)}</span>${r.qty > 1 ? `<span class="ct-each">${rupees(r.unit)} each</span>` : ''}`;
  return `<span class="ct-price ct-price--enquiry">On enquiry</span>${r.note ? `<span class="ct-each">Guide ${esc(r.note)}</span>` : ''}`;
}

function lineHTML(r, list){
  const k = esc(r.key);
  const thumb = r.img ? `<img src="${esc(r.img)}" alt="" width="72" height="72" loading="lazy">`
    : `<span class="ct-thumb-mark" aria-hidden="true">${r.kind === 'custom' ? 'M' : r.care ? 'C' : 'E'}</span>`;
  const qty = list === 'cart' && r.kind !== 'custom' && !r.key.startsWith('care:') ? `
      <div class="ct-qty" role="group" aria-label="Quantity of ${esc(r.title)}">
        <button type="button" data-ct="qty" data-k="${k}" data-d="-1" ${r.qty <= 1 ? 'disabled' : ''} aria-label="One fewer">−</button>
        <output aria-live="polite">${r.qty}</output>
        <button type="button" data-ct="qty" data-k="${k}" data-d="1" ${r.qty >= MAX_QTY ? 'disabled' : ''} aria-label="One more">+</button>
      </div>` : '';
  const parts = r.kind === 'custom' ? (() => {
    const t = buildTotal(r);
    return `<ul class="ct-parts">${r.parts.map(p => `<li><span>${esc(p.label)}</span><span>${p.price ? rupees(p.price) : p.price === 0 ? '—' : esc(p.note || 'On enquiry')}</span></li>`).join('')}
      <li class="ct-parts-total"><span>Build estimate</span><span>${t.high ? `${rupees(t.low)} – ${rupees(t.high)}` : '—'}${t.quoted ? ` + ${t.quoted} quoted` : ''}</span></li></ul>`;
  })() : '';
  return `<li class="ct-line ct-line--${r.kind}">
    <a class="ct-thumb" href="${esc(r.href)}" tabindex="-1" aria-hidden="true">${thumb}</a>
    <div class="ct-body">
      <span class="ct-kind caption">${r.care ? 'Care' : { fixed: 'Ready to order', enquiry: 'Price on enquiry', custom: 'Custom build' }[r.kind]}</span>
      <a class="ct-title" href="${esc(r.href)}">${esc(r.title)}</a>
      <span class="ct-sub">${esc(r.sub)} · ${esc(r.status)}</span>
      ${parts}
      ${qty}
      <div class="ct-actions">
        ${r.kind === 'custom' ? `<a class="ct-link" href="${esc(r.href)}">Edit design</a>` : r.key.startsWith('care:') ? `<a class="ct-link" href="${esc(r.href)}">Change plan</a>` : ''}
        ${list === 'saved' && r.cartable === false ? '<span class="ct-sub">Coming soon · not yet in the cart</span>'
          : `<button type="button" class="ct-link" data-ct="move" data-from="${list}" data-k="${k}">${list === 'cart' ? 'Save for later' : 'Move to cart'}</button>`}
        <button type="button" class="ct-link" data-ct="remove" data-from="${list}" data-k="${k}">Remove<span class="u-sr-only"> ${esc(r.title)}</span></button>
      </div>
    </div>
    ${r.kind === 'custom' ? '' : `<div class="ct-cost">${list === 'cart' ? priceCell(r) : r.kind === 'fixed' ? `<span class="ct-price">${rupees(r.unit)}</span>` : '<span class="ct-price ct-price--enquiry">On enquiry</span>'}</div>`}
  </li>`;
}

// "Goes with your order": at most two, from plain rules (pairings.js).
function suggestHTML(){
  const list = suggest(state.cart);
  if (!list.length) return '';
  return `<section class="ct-suggest" aria-labelledby="ct-suggest-title">
    <h3 id="ct-suggest-title" class="caption">Goes with your order</h3>
    <ul>${list.map(s => `<li>
      <span class="ct-suggest-text"><span class="ct-suggest-name">${esc(s.title)}</span><span class="ct-suggest-why">${esc(s.reason)}</span></span>
      ${s.line ? `<button type="button" class="ct-link" data-add-line='${esc(JSON.stringify(s.line))}'>Add<span class="u-sr-only"> ${esc(s.title)}</span></button>`
        : `<a class="ct-link" href="${esc(s.href)}">${s.href.startsWith('/care') ? 'Plan visits' : 'View'}<span class="u-sr-only"> ${esc(s.title)}</span></a>`}
    </li>`).join('')}</ul>
  </section>`;
}

const waHref = (text) => `https://wa.me/${ENQUIRY_PHONE}?text=${encodeURIComponent(text)}`;
// The cart as it was when last sent (memory only). While it's unchanged, the
// main action is Clear cart, not another send (UX audit S-03).
let sentKey = null;
const isSent = () => sentKey === JSON.stringify(state.cart);

function summaryHTML(lines){
  const t = totals(lines), text = orderText(lines);
  const row = (a, b, cls = '') => `<p class="ct-row ${cls}"><span>${a}</span><span>${b}</span></p>`;
  return `<div class="ct-summary">
    ${t.fixed ? row('Priced items', rupees(t.fixed)) : ''}
    ${t.ranged ? row('Chambers &amp; builds (guide)', `${rupees(t.low - t.fixed)} – ${rupees(t.high - t.fixed)}`) : ''}
    ${t.quoted ? row('On enquiry', `${t.quoted} item${t.quoted > 1 ? 's' : ''}, quoted by the studio`) : ''}
    ${row('Estimated total', t.ranged ? `${rupees(t.low)} – ${rupees(t.high)}` : t.fixed ? rupees(t.fixed) : 'On enquiry', 'ct-row--total')}
    ${t.quoted && (t.fixed || t.ranged) ? `<p class="ct-note">+ ${t.quoted} item${t.quoted > 1 ? 's' : ''} on enquiry, added when the studio quotes.</p>` : ''}
    <p class="ct-note">Nothing is charged here. The studio confirms the final total, delivery within Mumbai and lead time, then sends you a secure payment link.</p>
    ${isSent() ? `
    <button type="button" class="cta cta-block" data-ct="clear">Clear cart</button>
    <p class="ct-note">Didn't open? <a class="ct-link" data-ct="send" href="${waHref(text)}" target="_blank" rel="noopener">Send again on WhatsApp</a></p>` : `
    ${sentKey ? '<p class="ct-note">Changed since you sent it.</p>' : ''}
    <a class="cta cta-block" data-ct="send" href="${waHref(text)}" target="_blank" rel="noopener">Send order on WhatsApp ${icon('arrow-up-right', { size: 'xs' })}</a>
    ${enquiryAltHTML(`Cart · ${t.items} item${t.items > 1 ? 's' : ''}`, text)}`}
  </div>`;
}

function drawerHTML(){
  const lines = { cart: state.cart.map(l => resolve(l, 'cart')), saved: state.saved.map(l => resolve(l, 'saved')) };
  const count = (l) => l === 'cart' ? state.cart.reduce((n, x) => n + (x.qty || 1), 0) : state.saved.length;
  const tabBtn = (id, label) => `<button type="button" role="tab" id="ct-tab-${id}" aria-controls="ct-panel" aria-selected="${tab === id}" data-ct="tab" data-tab="${id}" ${tab === id ? '' : 'tabindex="-1"'}>${label} <span>(${count(id)})</span></button>`;
  const list = lines[tab];
  const empty = tab === 'cart'
    ? `${art('system-cart-empty', 'ct-art')}<p class="ct-empty">Your cart is empty.</p><p class="ct-note">Add pieces from the <a href="/products">catalogue</a>, or design your own in the <a href="/maker">Maker</a>.</p>`
    : `${art('system-saved-empty', 'ct-art')}<p class="ct-empty">Nothing saved yet.</p><p class="ct-note">Use “Save” on any piece or design to keep it here.</p>`;
  return `<header class="ct-head">
      <h2 id="ct-title" class="caption">Your selection</h2>
      <button type="button" class="ct-close" data-ct="close" aria-label="Close">${icon('x', { size: 'md' })}</button>
    </header>
    <div class="ct-tabs" role="tablist" aria-labelledby="ct-title">${tabBtn('cart', 'Cart')}${tabBtn('saved', 'Saved')}</div>
    <div class="ct-panel" id="ct-panel" role="tabpanel" aria-labelledby="ct-tab-${tab}">
      <p class="ct-notice" role="status">${notice ? `${esc(notice.text)}
        ${notice.undo ? '<button type="button" class="ct-link" data-ct="undo">Undo</button>' : ''}
        ${notice.clear ? '<button type="button" class="ct-link" data-ct="clear">Clear cart</button>' : ''}` : ''}</p>
      ${list.length ? `<ul class="ct-lines">${list.map(r => lineHTML(r, tab)).join('')}</ul>` : empty}
      ${tab === 'cart' && list.length ? suggestHTML() + summaryHTML(list) : ''}
    </div>`;
}

function refresh(){
  const n = state.cart.reduce((s, x) => s + (x.qty || 1), 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = n || ''; });   // hidden at 0
  document.querySelectorAll('[data-saved-count]').forEach(el => { el.textContent = state.saved.length || ''; });
  document.querySelectorAll('[data-save-line]').forEach(btn => {
    const on = has('saved', JSON.parse(btn.dataset.saveLine));
    btn.setAttribute('aria-pressed', on);   // the label stays "Save"; the heart fills (iconography audit P2)
  });
  if (dlg?.open) {
    const focusKey = document.activeElement?.closest('[data-ct]') && [document.activeElement.dataset.ct, document.activeElement.dataset.k, document.activeElement.dataset.d, document.activeElement.dataset.tab].join();
    dlg.innerHTML = drawerHTML();
    const back = focusKey && [...dlg.querySelectorAll('[data-ct]')].find(el => [el.dataset.ct, el.dataset.k, el.dataset.d, el.dataset.tab].join() === focusKey && !el.disabled);
    (back || dlg.querySelector('.ct-notice button') || dlg.querySelector('[role=tab][aria-selected=true]')).focus();
  }
}

let lastUndo = null;
// After sending, the order is with the studio but the cart stays until the
// visitor clears it, in case WhatsApp didn't open or they want to resend.
function sent(method){
  track('cart_send', { method, items: state.cart.length });
  sentKey = JSON.stringify(state.cart);
  notice = { text: method === 'whatsapp' ? '✓ Sent to the studio on WhatsApp. They usually reply within a day with the final price and delivery.'
    : '✓ Thank you, your order is with the studio. They usually reply within a day with the final price and delivery.' };
  refresh();
}

function openDrawer(which = 'cart'){
  notice = null;
  tab = which; lastFocus = document.activeElement;
  dlg.innerHTML = drawerHTML();
  if (!dlg.open) dlg.showModal();
  dlg.querySelector(`#ct-tab-${tab}`).focus();
  track('cart_open', { tab });
}

export function initCart(){
  const runhead = document.querySelector('.runhead');
  if (!runhead) return;
  read();

  const btns = document.createElement('div');
  btns.className = 'runhead-bag';
  // Heart + bag (audit item 10): the word shows ≥1081px, icon-only below;
  // the count shows only when there's something. Read as "Cart 2 items".
  btns.innerHTML = `<button type="button" class="runhead-bag-btn" data-open="saved">${icon('heart', { size: 'md' })}<span class="rb-label">Saved</span> <span class="rb-count" data-saved-count></span><span class="u-sr-only"> items</span></button>
    <button type="button" class="runhead-bag-btn" data-open="cart">${icon('shopping-bag', { size: 'md' })}<span class="rb-label">Cart</span> <span class="rb-count" data-cart-count></span><span class="u-sr-only"> items</span></button>`;
  // Right column = cart buttons + theme toggle, so the header stays a 3-column grid.
  const end = document.createElement('div');
  end.className = 'runhead-end';
  const toggle = runhead.querySelector('.theme-toggle-desktop');
  runhead.insertBefore(end, toggle);
  end.append(btns, ...(toggle ? [toggle] : []));
  btns.addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openDrawer(b.dataset.open); });

  dlg = document.createElement('dialog');
  dlg.className = 'ct'; dlg.id = 'cartDrawer';
  dlg.setAttribute('aria-labelledby', 'ct-title');
  document.body.appendChild(dlg);

  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return dlg.close();   // backdrop
    const b = e.target.closest('[data-ct]');
    if (!b) return;
    const { ct, k, from } = b.dataset;
    if (ct === 'close') return dlg.close();
    if (ct === 'send') { sent('whatsapp'); return; }   // let the link open
    if (ct === 'tab') { tab = b.dataset.tab; notice = null; return refresh(); }
    const before = state, title = k && resolve(state[from || 'cart'].find(x => keyOf(x) === k), from || 'cart')?.title;
    notice = null;
    if (ct === 'qty') { const l = state.cart.find(x => keyOf(x) === k); state = setQty(state, k, l.qty + +b.dataset.d); }
    if (ct === 'remove') { state = remove(state, from, k); notice = { text: `Removed ${title}.`, undo: before }; }
    if (ct === 'move') { state = move(state, from, k); notice = { text: `${title} moved to ${from === 'cart' ? 'Saved' : 'your cart'}.`, undo: before }; }
    if (ct === 'clear') { state = { ...state, cart: [] }; notice = { text: 'Cart cleared.', undo: before }; }
    if (ct === 'undo') state = lastUndo || state;
    lastUndo = notice?.undo || null;
    write(); refresh();
  });
  // Arrow keys between the two tabs (WAI-ARIA tabs pattern).
  dlg.addEventListener('keydown', (e) => {
    if (!e.target.matches('[role=tab]') || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    tab = tab === 'cart' ? 'saved' : 'cart'; refresh();
  });
  dlg.addEventListener('enquiry:sent', () => sent('form'));
  dlg.addEventListener('close', () => lastFocus?.focus?.());

  // Any page can carry add/save buttons: data-add-line / data-save-line = JSON line.
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add-line]'), save = e.target.closest('[data-save-line]');
    if (add) addLine('cart', JSON.parse(add.dataset.addLine));
    if (save) {
      const line = JSON.parse(save.dataset.saveLine);
      if (has('saved', line)) { state = remove(state, 'saved', keyOf(line)); write(); refresh(); }
      else addLine('saved', line, { open: false });
    }
  });
  // Another tab changed the cart.
  window.addEventListener('storage', (e) => { if (e.key === STORE) { read(); refresh(); } });
  refresh();
}

// Pages call this after rendering new buttons so their Save state is right.
export const syncCartButtons = () => refresh();
