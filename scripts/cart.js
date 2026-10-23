// ─────────────────────────────────────────────────────────────────────
// cart.js · cart + saved list (every page)
//
// The site still takes no payment. The cart collects what a visitor wants,
// tallies what can be tallied, and sends the whole order to the studio,
// which confirms stock, delivery and the final total, then sends a
// payment link. Swap `orderText` → a checkout call once Razorpay exists.
//
// Two kinds of line, because the catalogue has two kinds of price:
//   fixed   · Volume I pieces with a price per size × material → qty × price
//   enquiry · no price (coming soon pieces, Elemental chambers) → "On enquiry",
//             with the chamber's published range shown as a guide
// Care (/care) adds two line types that land in those kinds:
//   refill kits are ordinary product lines (KIT-…, priced or on enquiry);
//   a visit plan is {kind:'care', code} → fixed when the studio has set a
//   per-visit rate, else on enquiry.
//
// Lines are stored as ids only and resolved against data on every read, so
// a price change in data/ shows up in carts already saved, and anything
// unknown (old SKU, edited storage, a retired custom build) is dropped.
// Rules are checked by cart.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne, materials, photoPath, places } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';
import { kits } from '../data/care.js';
import { decodePlan, encodePlan, planPrice, planSummary, refLabel } from './care.js';
import { suggest } from './pairings.js';
import { enquiryAltHTML, ENQUIRY_PHONE } from './enquiry-form.js';
import { esc, rupees, track, art } from './util.js';
import { icon } from '../data/icons.js';
import { SITE_ACCOUNTS } from '../data/site.js';

/**
 * @typedef {import('../data/volume-one.js').PriceTable} PriceTable
 *
 * @typedef {'cart' | 'saved'} List
 * @typedef {{ kind: 'product', sku: string, variant?: string | null, material?: string | null, qty: number }} ProductLine
 * @typedef {{ code: string, sku?: undefined, qty?: number }} CodeLineBase
 * @typedef {CodeLineBase & { kind: 'care' }} CodeLine  a care plan; no quantity
 * @typedef {ProductLine | CodeLine} Line  a stored line: ids only
 * @typedef {CodeLine | (Omit<ProductLine, 'qty'> & { qty?: number })} NewLine  a line being added (qty defaults to 1)
 * @typedef {{ cart: Line[], saved: Line[] }} CartState
 *
 * @typedef {{ key: string, qty: number, title: string, sub: string, href: string, img: string | null, status: string,
 *   care?: boolean, cartable?: boolean, range?: [number, number] | null, note?: string }} RowBase
 * @typedef {RowBase & { kind: 'fixed', unit: number }} FixedRow
 * @typedef {RowBase & { kind: 'enquiry', unit: null }} EnquiryRow
 * @typedef {FixedRow | EnquiryRow} Row  a resolved line: what the drawer and the order message show
 */

const STORE = 'earthbox-cart';
// account.js keeps this hint in step with the session cookie (which JS can't read).
const signedIn = () => { try { return localStorage.getItem('earthbox-signed-in') === '1'; } catch { return false; } };
const MAX_QTY = 20;

// "₹8,000 – ₹12,000" → [8000, 12000]
/**
 * @param {string | null | undefined} s
 * @returns {[number, number] | null}
 */
export const parseRange = (s) => {
  const n = String(s || '').replace(/,/g, '').match(/\d+/g);
  return n ? [+n[0], +n[n.length - 1]] : null;
};

// ═══ RULES (pure) ═════════════════════════════════════════════════════

/** @returns {CartState} */
export const emptyCart = () => ({ cart: [], saved: [] });

// A line's identity: the same piece in another size or material is a new line.
/** @param {NewLine} l */
export const keyOf = (l) => l.kind === 'care' ? `care:${l.code}`
  : [l.sku, l.variant, l.material].filter(Boolean).join('|');
/**
 * @param {{ kind?: unknown }} l
 * @returns {l is CodeLine}
 */
const ONE_OFF = (l) => l.kind === 'care';   // no quantity

// Line (ids) → everything the drawer and the order message need.
/**
 * @param {NewLine} l  a stored line, or one being added (qty may be unset)
 * @param {List} [list]
 * @returns {Row | null}
 */
export function resolve(l, list = 'cart'){
  if (l.kind === 'care') {
    const plan = decodePlan(l.code);
    if (!plan) return null;
    const price = planPrice(plan);
    return /** @type {FixedRow | EnquiryRow} */ ({ kind: price ? 'fixed' : 'enquiry', care: true, key: keyOf(l), qty: 1, title: `Care visits · ${refLabel(plan)}`,
      sub: planSummary(plan), href: `/care#${encodePlan(plan)}`, img: null, unit: price,
      status: 'Mumbai · studio confirms dates' });
  }
  // Stored lines always carry qty; a line still being added may not, and
  // add() only checks that it resolves.
  const kit = kits.find(k => k.sku === l.sku);
  if (kit) return /** @type {FixedRow | EnquiryRow} */ ({ kind: kit.price ? 'fixed' : 'enquiry', care: true, key: keyOf(l), qty: /** @type {number} */ (l.qty), title: kit.name,
    sub: kit.for, href: '/care', img: null, unit: kit.price, status: 'Studio confirms contents · about 1 week' });
  const p = volumeOne.find(x => x.sku === l.sku);
  // Coming-soon pieces can't be ordered yet (UX audit S-01, 16 Oct 2026), as
  // with chambers: an old cart line is dropped; the Saved list keeps them.
  if (p && list === 'cart' && p.status === 'coming-soon') return null;
  if (p) {
    const variant = p.variants?.find(v => v.id === l.variant);
    if (p.variants?.length && !variant) return null;
    const table = /** @type {Record<string, number> | null} */ (p.pricing ? (variant ? /** @type {Record<string, PriceTable>} */ (p.pricing)[variant.id] : p.pricing) : null);
    const material = /** @type {string} */ (l.material);   // a missing material finds no price
    if (table && !table[material]) return null;
    const mat = materials.find(m => m.id === l.material), place = places.find(x => x.material === l.material);
    // "Big Block · Balcony (ASA)": the size, then the place the material is for (UX audit D1).
    const finish = mat && (place ? `${place.name} (${mat.name})` : mat.name);
    return /** @type {FixedRow | EnquiryRow} */ ({ kind: table ? 'fixed' : 'enquiry', key: keyOf(l), qty: /** @type {number} */ (l.qty), title: p.name,
      sub: [variant?.name, finish].filter(Boolean).join(' · ') || 'Volume I',
      href: `/product/${encodeURIComponent(p.sku)}`, img: p.photo ? photoPath(p, '300') : null,
      unit: table ? table[material] : null,
      cartable: p.status !== 'coming-soon',
      status: p.status === 'coming-soon' ? 'Coming soon' : 'Made to order · about 1 week' });
  }
  // Coming-soon chambers never resolve, so they can't be added and any old
  // cart line is dropped (studio decision, 12 Oct 2026). Saved list keeps them.
  const box = volumeTwo.boxes.find(x => x.sku === l.sku);
  if (box && list === 'cart' && volumeTwo.status === 'Coming soon') return null;
  if (box) return { kind: 'enquiry', cartable: volumeTwo.status !== 'Coming soon', key: keyOf(l), qty: /** @type {number} */ (l.qty), title: `${box.name} chamber`, sub: `Elemental Box · ${box.edition}`,
    href: `/product/${encodeURIComponent(box.sku)}`, img: box.photo ? `/assets/boxes/${box.photo}` : null,
    // A lead time only for what can be ordered (UX audit rule E4).
    unit: null, range: parseRange(box.price), note: box.price, status: volumeTwo.status === 'Coming soon' ? volumeTwo.status : `${volumeTwo.status} · ${box.lead}` };
  return null;
}

// The whole cart. `fixed` is exact; low/high add the guide ranges; `quoted`
// counts lines the studio still has to price.
// `priced` = pieces with an exact price, `toQuote` = pieces the studio still
// prices (UX audit S-07).
/** @param {Row[]} lines */
export function totals(lines){
  let fixed = 0, low = 0, high = 0, quoted = 0, items = 0, priced = 0, toQuote = 0;
  for (const r of lines) {
    items += r.qty;
    if (r.kind === 'fixed') { fixed += r.unit * r.qty; priced += r.qty; continue; }
    if (r.range) { low += r.range[0] * r.qty; high += r.range[1] * r.qty; } else { quoted += r.qty; toQuote += r.qty; }
  }
  return { items, fixed, low: fixed + low, high: fixed + high, ranged: high > 0, quoted, priced, toQuote };
}

/** @param {number} n */
export const pieces = (n) => `${n} piece${n === 1 ? '' : 's'}`;

// The one estimate line (UX audit S-04, rule E3): it says how firm it is, in
// the same words wherever it shows.
//   "Estimate so far ₹9,598 – ₹12,598 + 3 to quote" · all priced: "Estimate so far ₹9,598"
//   nothing priced: "To be quoted · 3 pieces", no rupee figure.
/**
 * @param {ReturnType<typeof totals>} t
 * @returns {{ label: string, value: string }}
 */
export function estimateLine(t){
  if (!t.fixed && !t.ranged) return { label: 'To be quoted', value: pieces(t.toQuote || t.items) };
  const amount = t.ranged && t.high !== t.low ? `${rupees(t.low)} – ${rupees(t.high)}` : rupees(t.low);
  return { label: 'Estimate so far', value: `${amount}${t.toQuote ? ` + ${t.toQuote} to quote` : ''}` };
}

// Untrusted storage → only lines that still resolve, qty clamped, no duplicates.
/** @param {unknown} raw */
export function clean(raw){
  const out = emptyCart();
  for (const list of /** @type {const} */ (['cart', 'saved'])) {
    const seen = new Set();
    const got = /** @type {{ [list: string]: unknown } | null | undefined} */ (raw)?.[list];
    for (const item of Array.isArray(got) ? /** @type {unknown[]} */ (got) : []) {
      if (!item || typeof item !== 'object') continue;
      const l = /** @type {Record<string, unknown>} */ (item);
      // variant and material are kept as given: resolve() drops ones it can't price.
      /** @type {Line} */
      const line = ONE_OFF(l)
        ? { kind: l.kind, code: String(l.code || '') }
        : { kind: 'product', sku: typeof l.sku === 'string' ? l.sku : '', variant: /** @type {string | null} */ (l.variant || null), material: /** @type {string | null} */ (l.material || null),
            qty: Math.min(MAX_QTY, Math.max(1, parseInt(/** @type {string} */ (l.qty), 10) || 1)) };
      if (!resolve(line, list) || seen.has(keyOf(line))) continue;
      seen.add(keyOf(line)); out[list].push(line);
    }
  }
  return out;
}

/**
 * @param {CartState} state
 * @param {List} list
 * @param {NewLine} line
 */
export function add(state, list, line){
  if (!resolve(line, list)) return state;   // e.g. a coming-soon chamber can be saved, not carted
  const s = structuredClone(state), k = keyOf(line);
  const hit = s[list].find(l => keyOf(l) === k);
  if (hit && list === 'cart' && hit.kind === 'product') hit.qty = Math.min(MAX_QTY, hit.qty + (line.qty || 1));
  else if (!hit) s[list].push(ONE_OFF(line) ? line : { qty: 1, ...line });
  return s;
}
/**
 * @param {CartState} state
 * @param {List} list
 * @param {string} key
 * @returns {CartState}
 */
export const remove = (state, list, key) => ({ ...state, [list]: state[list].filter(l => keyOf(l) !== key) });
/**
 * @param {CartState} state
 * @param {string} key
 * @param {number} qty
 */
export function setQty(state, key, qty){
  const s = structuredClone(state);
  const l = s.cart.find(x => keyOf(x) === key);
  if (l?.kind === 'product') l.qty = Math.min(MAX_QTY, Math.max(1, qty));
  return s;
}
/**
 * @param {CartState} state
 * @param {List} from
 * @param {string} key
 */
export function move(state, from, key){
  const l = state[from].find(x => keyOf(x) === key);
  if (!l || !resolve(l, from === 'cart' ? 'saved' : 'cart')) return state;   // never lose a line it can't move
  return add(remove(state, from, key), from === 'cart' ? 'saved' : 'cart', l);
}

// `contact` is what the visitor typed in the email form, if anything: the
// WhatsApp message carries their name and pincode too (UX audit S-09).
/**
 * @param {Row[]} lines
 * @param {{ name?: string, pincode?: string }} [contact]
 */
export function orderText(lines, contact = {}){
  const t = totals(lines);
  const out = ['Hi Aayush, I’d like to order from EarthBox.', ''];
  lines.forEach((r, i) => {
    const price = r.kind === 'fixed' ? `${rupees(r.unit)}${r.qty > 1 ? ` × ${r.qty} = ${rupees(r.unit * r.qty)}` : ''}`
      : r.note ? `on enquiry (guide ${r.note})` : 'on enquiry';
    out.push(`${i + 1}. ${r.title}${r.sub ? ` · ${r.sub}` : ''}${r.qty > 1 && r.kind !== 'fixed' ? ` × ${r.qty}` : ''}: ${price}`);
  });
  out.push('');
  if (t.fixed) out.push(`Priced items: ${rupees(t.fixed)}`);
  if (t.ranged) out.push(`Estimate incl. chamber ranges: ${rupees(t.low)} – ${rupees(t.high)}`);
  if (t.toQuote) out.push(`Still to quote: ${pieces(t.toQuote)}`);
  const name = contact.name?.trim(), pin = contact.pincode?.trim();
  if (name || pin) out.push('', ...(name ? [`Name: ${name}`] : []), ...(pin ? [`Pincode: ${pin}`] : []));
  out.push('', 'Could you confirm the total, delivery and lead time?');
  return out.join('\n');
}


// ═══ UI ═══════════════════════════════════════════════════════════════
// Browser-only below. Links are root-absolute so the drawer works under /blog/ too.
// Other scripts call addLine() and listen for nothing:
// the header counts and the drawer redraw from storage on every change.

let state = emptyCart();
const read = () => { try { state = clean(JSON.parse(localStorage.getItem(STORE) || 'null')); } catch { state = emptyCart(); } };
const write = () => {
  try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode: lives for this page only */ }
  document.dispatchEvent(new Event('cart:change'));   // account.js pushes it to the signed-in account
};

/** @type {HTMLDialogElement | undefined} set by initCart; stays unset on a page without the header */
let dlg;
/** @type {List} */
let tab = 'cart';
/** @type {(Element & { focus?: () => void }) | null} the focused element can be one without focus() */
let lastFocus;
// One-line status at the top of the drawer. `undo` holds the whole previous
// state, so Undo works the same for remove, clear and move.
/** @type {{ text: string, undo?: CartState, clear?: boolean } | null} */
let notice = null;

/**
 * @param {List} list
 * @param {NewLine} line
 * @param {{ open?: boolean }} [opts]
 */
function addLine(list, line, { open = true } = {}){
  state = add(state, list, line);
  write(); refresh();
  track(list === 'cart' ? 'cart_add' : 'saved_add', { kind: line.kind, sku: line.sku || line.kind });
  if (open) openDrawer(list);
}
/**
 * @param {List} list
 * @param {NewLine} line
 */
const has = (list, line) => state[list].some(l => keyOf(l) === keyOf(line));


// Lines read top-down (UX audit D1, S-10): title + price, then what it is
// ("Big Block · Balcony (ASA)") + the unit price, then the status on its own
// quiet line. No kind label: the price already says how firm it is.
/**
 * @param {Row} r
 * @param {List} list
 */
function lineHTML(r, list){
  const k = esc(r.key);
  // Icons, not letters, where there's no photo (S-10): a visit plan, a kit.
  const thumb = r.img ? `<img src="${esc(r.img)}" alt="" width="72" height="72" loading="lazy">`
    : `<span class="ct-thumb-mark" aria-hidden="true">${icon(r.key.startsWith('care:') ? 'calendar-clock' : 'package', { size: 'lg' })}</span>`;
  const qty = list === 'cart' && !r.key.startsWith('care:') ? `
      <div class="ct-qty" role="group" aria-label="Quantity of ${esc(r.title)}">
        <button type="button" data-ct="qty" data-k="${k}" data-d="-1" ${r.qty <= 1 ? 'disabled' : ''} aria-label="One fewer">−</button>
        <output aria-live="polite">${r.qty}</output>
        <button type="button" data-ct="qty" data-k="${k}" data-d="1" ${r.qty >= MAX_QTY ? 'disabled' : ''} aria-label="One more">+</button>
      </div>` : '';
  // A coming-soon piece in Saved: its guide and its status, said once (S-19).
  const soon = list === 'saved' && r.cartable === false;
  const price = soon ? ''
    : r.kind === 'fixed' ? `<span class="ct-price">${rupees(list === 'cart' ? r.unit * r.qty : r.unit)}</span>`
    : '<span class="ct-price ct-price--enquiry">On enquiry</span>';
  const each = r.kind === 'fixed' ? `<span class="ct-each">${rupees(r.unit)} each</span>`
    : r.note && !soon ? `<span class="ct-each">Guide ${esc(r.note)}</span>` : '';
  const status = soon && r.note ? `Guide ${esc(r.note)} · ${esc(r.status)}` : esc(r.status);
  return `<li class="ct-line ct-line--${r.kind}">
    <a class="ct-thumb" href="${esc(r.href)}" tabindex="-1" aria-hidden="true">${thumb}</a>
    <div class="ct-body">
      <div class="ct-top"><a class="ct-title" href="${esc(r.href)}">${esc(r.title)}</a>${price}</div>
      <div class="ct-meta"><span class="ct-sub">${esc(r.sub)}</span>${each}</div>
      <span class="ct-status">${status}</span>
      ${qty}
      <div class="ct-actions">
        ${r.key.startsWith('care:') ? `<a class="ct-link" href="${esc(r.href)}">Change plan</a>` : ''}
        ${soon ? '' : `<button type="button" class="ct-link" data-ct="move" data-from="${list}" data-k="${k}">${list === 'cart' ? 'Save for later' : 'Move to cart'}</button>`}
        <button type="button" class="ct-link" data-ct="remove" data-from="${list}" data-k="${k}">Remove<span class="u-sr-only"> ${esc(r.title)}</span></button>
      </div>
    </div>
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

/** @param {string} text */
const waHref = (text) => `https://wa.me/${ENQUIRY_PHONE}?text=${encodeURIComponent(text)}`;
// The cart as it was when last sent (memory only). While it's unchanged, the
// main action is Clear cart, not another send (UX audit S-03).
/** @type {string | null} */
let sentKey = null;
const isSent = () => sentKey === JSON.stringify(state.cart);
// What the visitor typed in the email form (memory only): the drawer redraws
// on every change, and the WhatsApp message carries name + pincode (S-09).
/** @type {import('./enquiry-form.js').Contact} */
const contact = {};
let emailOpen = false;

// Breakdown, in the scrolling list (S-04): each kind of certainty on its own row.
/** @param {ReturnType<typeof totals>} t */
function breakdownHTML(t){
  /**
   * @param {string} a
   * @param {string} b
   */
  const row = (a, b) => `<p class="ct-row"><span>${a}</span><span>${b}</span></p>`;
  return `<div class="ct-breakdown">
    ${t.fixed ? row(`Priced pieces · ${t.priced}`, rupees(t.fixed)) : ''}
    ${t.ranged ? row('Chamber guide', `${rupees(t.low - t.fixed)} – ${rupees(t.high - t.fixed)}`) : ''}
    ${t.toQuote ? row('To be quoted', pieces(t.toQuote)) : ''}
    ${row('Delivery', 'Mumbai · confirmed by the studio')}
  </div>`;
}

// Sticky footer (S-11): the estimate and the send routes stay in reach
// however long the list is. Email is a quiet link at every width (S-08).
/** @param {Row[]} lines */
function footHTML(lines){
  const t = totals(lines), text = orderText(lines), est = estimateLine(t);
  return `<div class="ct-summary ct-foot">
    <p class="ct-row ct-row--total"><span>${est.label}</span><span>${est.value}</span></p>
    <p class="ct-note">Nothing is charged here. The studio confirms the final total, delivery within Mumbai and lead time, then sends you a secure payment link.</p>
    ${isSent() ? `
    <button type="button" class="cta cta-block" data-ct="clear">Clear cart</button>
    <p class="ct-note">Didn't open? <a class="ct-link" data-ct="send" href="${waHref(orderText(lines, contact))}" target="_blank" rel="noopener">Send again on WhatsApp</a></p>` : `
    ${sentKey ? '<p class="ct-note">Changed since you sent it.</p>' : ''}
    <a class="cta cta-block" data-ct="send" href="${waHref(orderText(lines, contact))}" target="_blank" rel="noopener">Send order on WhatsApp ${icon('arrow-up-right', { size: 'xs' })}</a>
    ${enquiryAltHTML(`Cart · ${pieces(t.items)}`, text, { order: true, values: contact })}`}
  </div>`;
}

// clean() kept only lines that resolve, so none is null here.
/** @param {List} list */
const rows = (list) => /** @type {Row[]} */ (state[list].map(l => resolve(l, list)));

function drawerHTML(){
  const lines = { cart: rows('cart'), saved: rows('saved') };
  /** @param {List} l */
  const count = (l) => l === 'cart' ? state.cart.reduce((n, x) => n + (x.qty || 1), 0) : state.saved.length;
  /**
   * @param {List} id
   * @param {string} label
   */
  // "Cart · 5 pieces | Saved · 2" (UX audit D1).
  const tabBtn = (id, label) => `<button type="button" role="tab" id="ct-tab-${id}" aria-controls="ct-panel" aria-selected="${tab === id}" data-ct="tab" data-tab="${id}" ${tab === id ? '' : 'tabindex="-1"'}>${label} <span>· ${id === 'cart' ? pieces(count(id)) : count(id)}</span></button>`;
  const list = lines[tab];
  const empty = tab === 'cart'
    ? `${art('system-cart-empty', 'ct-art')}<p class="ct-empty">Your cart is empty.</p><p class="ct-note">Add pieces from the <a href="/products">catalogue</a>.</p>`
    : `${art('system-saved-empty', 'ct-art')}<p class="ct-empty">Nothing saved yet.</p><p class="ct-note">Use “Save” on any piece to keep it here.</p>`;
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
      ${tab === 'cart' && list.length ? suggestHTML() + breakdownHTML(totals(list)) + footHTML(list) : ''}
    </div>`;
}

// Draw the drawer, keeping the email form open if the visitor opened it.
/** @param {HTMLDialogElement} d */
function paint(d){
  d.innerHTML = drawerHTML();
  if (emailOpen) d.querySelector('.enquiry-alt--order')?.setAttribute('open', '');
}

function refresh(){
  const n = state.cart.reduce((s, x) => s + (x.qty || 1), 0);
  document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = String(n || ''); });   // hidden at 0
  document.querySelectorAll('[data-saved-count]').forEach(el => { el.textContent = String(state.saved.length || ''); });
  /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-save-line]')).forEach(btn => {
    const on = has('saved', JSON.parse(/** @type {string} */ (btn.dataset.saveLine)));
    btn.setAttribute('aria-pressed', String(on));   // the label stays "Save"; the heart fills (iconography audit P2)
  });
  if (dlg?.open) {
    const active = /** @type {HTMLElement | null} */ (document.activeElement);
    const focusKey = active?.closest('[data-ct]') && [active.dataset.ct, active.dataset.k, active.dataset.d, active.dataset.tab].join();
    paint(dlg);
    const back = focusKey && [.../** @type {NodeListOf<HTMLElement & { disabled?: boolean }>} */ (dlg.querySelectorAll('[data-ct]'))].find(el => [el.dataset.ct, el.dataset.k, el.dataset.d, el.dataset.tab].join() === focusKey && !el.disabled);
    // A tab is always there to fall back on.
    /** @type {HTMLElement} */ (back || dlg.querySelector('.ct-notice button') || dlg.querySelector('[role=tab][aria-selected=true]')).focus();
  }
}

/** @type {CartState | null} */
let lastUndo = null;
// After sending, the order is with the studio but the cart stays until the
// visitor clears it, in case WhatsApp didn't open or they want to resend.
/** @param {'whatsapp' | 'form'} method */
function sent(method){
  track('cart_send', { method, items: state.cart.length });
  sentKey = JSON.stringify(state.cart);
  notice = { text: method === 'whatsapp' ? '✓ Sent to the studio on WhatsApp. They usually reply within a day with the final price and delivery.'
    : '✓ Thank you, your order is with the studio. They usually reply within a day with the final price and delivery.' };
  refresh();
}

/** @param {List} [which] */
function openDrawer(which = 'cart'){
  notice = null;
  tab = which; lastFocus = document.activeElement;
  const d = /** @type {HTMLDialogElement} */ (dlg);   // only reached from buttons initCart wired up
  emailOpen = false;
  paint(d);
  if (!d.open) d.showModal();
  /** @type {HTMLElement} */ (d.querySelector(`#ct-tab-${tab}`)).focus();
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
  btns.innerHTML = `${SITE_ACCOUNTS ? `<a class="runhead-bag-btn" href="/account" data-account-link>${icon('user', { size: 'md' })}<span class="rb-label">${signedIn() ? 'Account' : 'Sign in'}</span></a>` : ''}<button type="button" class="runhead-bag-btn" data-open="saved">${icon('heart', { size: 'md' })}<span class="rb-label">Saved</span> <span class="rb-count" data-saved-count></span><span class="u-sr-only"> items</span></button>
    <button type="button" class="runhead-bag-btn" data-open="cart">${icon('shopping-bag', { size: 'md' })}<span class="rb-label">Cart</span> <span class="rb-count" data-cart-count></span><span class="u-sr-only"> items</span></button>`;
  // Right column = cart buttons + theme toggle, so the header stays a 3-column grid.
  const end = document.createElement('div');
  end.className = 'runhead-end';
  const toggle = runhead.querySelector('.theme-toggle-desktop');
  runhead.insertBefore(end, toggle);
  end.append(btns, ...(toggle ? [toggle] : []));
  btns.addEventListener('click', (e) => { const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-open]')); if (b) openDrawer(/** @type {List} */ (b.dataset.open)); });

  const drawer = document.createElement('dialog');
  dlg = drawer;
  drawer.className = 'ct'; drawer.id = 'cartDrawer';
  drawer.setAttribute('aria-labelledby', 'ct-title');
  document.body.appendChild(drawer);

  drawer.addEventListener('click', (e) => {
    if (e.target === drawer) return drawer.close();   // backdrop
    const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-ct]'));
    if (!b) return;
    // k and from are on line buttons only (not close, tab, clear, undo).
    const { ct, k, from } = /** @type {{ ct?: string, k?: string, from?: List }} */ (b.dataset);
    if (ct === 'close') return drawer.close();
    if (ct === 'send') { sent('whatsapp'); return; }   // let the link open
    if (ct === 'tab') { tab = /** @type {List} */ (b.dataset.tab); notice = null; return refresh(); }
    const before = state, title = k && resolve(/** @type {Line} */ (state[from || 'cart'].find(x => keyOf(x) === k)), from || 'cart')?.title;
    notice = null;
    if (ct === 'qty') { const l = /** @type {ProductLine} */ (state.cart.find(x => keyOf(x) === k)); state = setQty(state, /** @type {string} */ (k), l.qty + +/** @type {string} */ (b.dataset.d)); }
    if (ct === 'remove') { state = remove(state, /** @type {List} */ (from), /** @type {string} */ (k)); notice = { text: `Removed ${String(title)}.`, undo: before }; }
    if (ct === 'move') { state = move(state, /** @type {List} */ (from), /** @type {string} */ (k)); notice = { text: `${String(title)} moved to ${from === 'cart' ? 'Saved' : 'your cart'}.`, undo: before }; }
    if (ct === 'clear') { state = { ...state, cart: [] }; notice = { text: 'Cart cleared.', undo: before }; }
    if (ct === 'undo') state = lastUndo || state;
    lastUndo = notice?.undo || null;
    write(); refresh();
  });
  // Arrow keys between the two tabs (WAI-ARIA tabs pattern).
  drawer.addEventListener('keydown', (e) => {
    if (!/** @type {Element} */ (e.target).matches('[role=tab]') || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    tab = tab === 'cart' ? 'saved' : 'cart'; refresh();
  });
  drawer.addEventListener('enquiry:sent', () => sent('form'));
  // Typing in the email form: remember it, and put name + pincode in the
  // WhatsApp message too (S-09). Only what was typed; nothing is invented.
  drawer.addEventListener('input', (e) => {
    const el = /** @type {HTMLInputElement} */ (e.target);
    if (!el.closest('.enquiry-alt--order') || !['name', 'phone', 'pincode', 'email'].includes(el.name)) return;
    contact[/** @type {keyof typeof contact} */ (el.name)] = el.value;
    const href = waHref(orderText(rows('cart'), contact));
    /** @type {NodeListOf<HTMLAnchorElement>} */ (drawer.querySelectorAll('a[data-ct=send]')).forEach(a => { a.href = href; });
  });
  // "Send by email instead" opens the form and moves focus into it. toggle
  // doesn't bubble, so listen while it travels down (capture).
  drawer.addEventListener('toggle', (e) => {
    const fold = /** @type {HTMLDetailsElement} */ (e.target);
    if (!fold.matches('.enquiry-alt--order')) return;
    if (fold.open && !emailOpen) /** @type {HTMLElement | null} */ (fold.querySelector('input[name=name]'))?.focus();
    emailOpen = fold.open;
  }, true);
  drawer.addEventListener('close', () => lastFocus?.focus?.());

  // Any page can carry add/save buttons: data-add-line / data-save-line = JSON line.
  document.addEventListener('click', (e) => {
    const target = /** @type {Element} */ (e.target);
    const add = /** @type {HTMLElement | null} */ (target.closest('[data-add-line]')), save = /** @type {HTMLElement | null} */ (target.closest('[data-save-line]'));
    // The page's own markup: add() drops a line that doesn't resolve.
    if (add) addLine('cart', JSON.parse(/** @type {string} */ (add.dataset.addLine)));
    if (save) {
      /** @type {NewLine} */
      const line = JSON.parse(/** @type {string} */ (save.dataset.saveLine));
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
// account.js calls this after merging a signed-in visitor's saved cart into storage.
export const reloadCart = () => { read(); refresh(); };
