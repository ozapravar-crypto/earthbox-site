// Run: node scripts/cart.test.mjs
// Guards the cart: line kinds, tallies, untrusted storage, order text.
import assert from 'node:assert/strict';
import { resolve, totals, clean, add, remove, setQty, move, orderText, keyOf, emptyCart, parseRange, estimateLine, pieces } from './cart.js';

/**
 * @typedef {import('./cart.js').NewLine} NewLine
 * @typedef {import('./cart.js').Row} Row
 * @typedef {import('./cart.js').RowBase & { kind: Row['kind'], unit?: number | null }} AnyRow
 */
// A line the test expects to resolve, with every kind's fields readable.
/**
 * @param {NewLine} l
 * @param {import('./cart.js').List} [list]
 */
const row = (l, list) => /** @type {AnyRow} */ (resolve(l, list));
// Cart lines, resolved as in the cart (not .map(resolve): the index would land in `list`).
const resolveAll = /** @param {NewLine} l */ (l) => /** @type {Row} */ (resolve(l, 'cart'));

/** @type {NewLine} */
const capsule = { kind: 'product', sku: 'V1-PLT-006', material: 'abs', qty: 1 };          // ₹529
/** @type {NewLine} */
const stack   = { kind: 'product', sku: 'V1-PLT-005', variant: 'big', material: 'asa', qty: 1 }; // ₹1,799
/** @type {NewLine} */
const soon    = { kind: 'product', sku: 'V1-PLT-001', qty: 1 };                             // coming soon
/** @type {NewLine} */
const kit     = { kind: 'product', sku: 'KIT-EARTH', qty: 1 };                              // on enquiry (no price yet)
/** @type {NewLine} */
const moss    = { kind: 'product', sku: 'MossBox', qty: 1 };                                // range

// Kinds.
assert.equal(row(capsule).kind, 'fixed');
assert.equal(row(capsule).unit, 529);
assert.equal(row(stack).unit, 1799);
// Coming-soon pieces: savable, never in the cart (UX audit S-01, 16 Oct 2026).
assert.equal(resolve(soon), null);
assert.equal(row(soon, 'saved').cartable, false);
assert.equal(row(kit).kind, 'enquiry');
// Coming-soon chambers: savable, never in the cart (studio decision, 12 Oct 2026).
assert.equal(resolve(moss), null);
assert.deepEqual(row(moss, 'saved').range, parseRange('₹6,000 – ₹9,000'));
assert.equal(row(moss, 'saved').cartable, false);
assert.deepEqual(add(emptyCart(), 'cart', moss), emptyCart());
const sv = add(emptyCart(), 'saved', moss);
assert.equal(sv.saved.length, 1);
assert.deepEqual(move(sv, 'saved', keyOf(moss)), sv);                 // refused, and not lost from Saved
assert.deepEqual(clean({ cart: [moss], saved: [moss] }).cart, []);
assert.equal(clean({ cart: [moss], saved: [moss] }).saved.length, 1);

// Unknown or mismatched ids never resolve.
assert.equal(resolve({ kind: 'product', sku: 'NOPE', qty: 1 }), null);
assert.equal(resolve({ kind: 'product', sku: 'V1-PLT-005', variant: 'huge', material: 'asa' }), null, 'bad variant');
assert.equal(resolve({ kind: 'product', sku: 'V1-PLT-006', material: 'gold' }), null, 'bad material');

// Same piece twice → qty 2; another material → its own line.
let s = add(add(emptyCart(), 'cart', capsule), 'cart', capsule);
assert.equal(s.cart.length, 1);
assert.equal(s.cart[0].qty, 2);
s = add(s, 'cart', /** @type {NewLine} */ ({ ...capsule, material: 'asa' }));
assert.equal(s.cart.length, 2);

// Qty clamps 1..20.
assert.equal(setQty(s, keyOf(capsule), 0).cart[0].qty, 1);
assert.equal(setQty(s, keyOf(capsule), 99).cart[0].qty, 20);

// Totals: fixed exact, ranges carried, unpriced counted.
/** @param {NewLine[]} lines */
const r = (lines) => totals(lines.map(resolveAll));
assert.deepEqual(r([capsule, stack]), { items: 2, fixed: 2328, low: 2328, high: 2328, ranged: false, quoted: 0, priced: 2, toQuote: 0 });
const mixed = r([/** @type {NewLine} */ ({ ...capsule, qty: 2 }), kit]);
assert.deepEqual(mixed, { items: 3, fixed: 1058, low: 1058, high: 1058, ranged: false, quoted: 1, priced: 2, toQuote: 1 });
// A chamber's guide range is carried (chambers are Saved-only while coming soon).
const ranged = totals([row(moss, 'saved')].map(x => /** @type {Row} */ (x)));
assert.deepEqual([ranged.low, ranged.high, ranged.ranged, ranged.toQuote], [6000, 9000, true, 0]);
// The one estimate line says how firm it is (S-04, rule E3).
assert.deepEqual(estimateLine(ranged), { label: 'Estimate so far', value: '₹6,000 – ₹9,000' });
assert.deepEqual(estimateLine(r([capsule, stack])), { label: 'Estimate so far', value: '₹2,328' });
assert.deepEqual(estimateLine(r([kit, /** @type {NewLine} */ ({ ...kit, sku: 'KIT-MOSS' })])), { label: 'To be quoted', value: '2 pieces' });   // no rupee figure
assert.deepEqual(estimateLine(r([capsule, kit])), { label: 'Estimate so far', value: '₹529 + 1 to quote' });
assert.equal(pieces(1), '1 piece');

// Move between cart and saved; remove.
let m = move(add(emptyCart(), 'cart', capsule), 'cart', keyOf(capsule));
assert.equal(m.cart.length, 0); assert.equal(m.saved.length, 1);
m = move(m, 'saved', keyOf(capsule));
assert.equal(m.cart.length, 1);
assert.equal(remove(m, 'cart', keyOf(capsule)).cart.length, 0);

// Storage is untrusted: junk dropped, qty clamped, duplicates merged away.
const c = clean({ cart: [capsule, capsule, { sku: 'NOPE' }, null, 'x', { ...stack, qty: '500' }], saved: 'nope' });
assert.equal(c.cart.length, 2);
assert.equal(c.cart[1].qty, 20);
assert.deepEqual(c.saved, []);
assert.deepEqual(clean(null), emptyCart());
// Retired custom builds in an old saved cart are dropped silently (22 Oct 2026).
const old = clean({ cart: [{ kind: 'build', code: 'c=MossBox&p=PLT-036' }, capsule], saved: [{ kind: 'build', code: 'c=MossBox' }] });
assert.deepEqual([old.cart.map(keyOf), old.saved], [[keyOf(capsule)], []]);

// Order text carries every line, how it's priced, and the tallies.
const text = orderText([/** @type {NewLine} */ ({ ...capsule, qty: 2 }), kit].map(l => /** @type {Row} */ (resolve(l))));
assert.match(text, /Capsule Planter · Sunny window \(ABS\): ₹529 × 2 = ₹1,058/);   // the place, then its material (D1)
assert.match(text, /Earth refill kit.*on enquiry/);
assert.match(text, /Priced items: ₹1,058/);
assert.match(text, /Still to quote: 1 piece\b/);
assert.doesNotMatch(text, /Name:|Pincode:/);                       // nothing typed, nothing added
// Name and pincode from the email form ride along on WhatsApp too (S-09).
const withContact = orderText([capsule].map(resolveAll), { name: ' Asha ', pincode: '400101' });
assert.match(withContact, /Name: Asha\nPincode: 400101/);
assert.match(orderText([capsule].map(resolveAll), { name: 'Asha' }), /Name: Asha\n\nCould you/);
// Lines: the size, then the place and its material; a coming-soon chamber
// in Saved carries no lead time (rule E4).
assert.equal(row(stack).sub, 'Big Block · Balcony (ASA)');
assert.equal(row(moss, 'saved').status, 'Coming soon');

console.log('cart: all checks passed');

// Care (care.html): kits are product lines; visit plans are one-off care lines.
{
  const { encodePlan } = await import('./care.js');
  const { visit } = await import('../data/care.js');
  /** @type {NewLine} */
  const kit = { kind: 'product', sku: 'KIT-MOSS', qty: 1 };
  /** @type {NewLine} */
  const plan = { kind: 'care', code: encodePlan({ s: 'piece', r: 'MossBox', d: '12m', f: 'monthly', g: ['Moss'], n: 1, p: '400101' }) };
  assert.equal(row(kit).kind, 'enquiry');                 // no kit price yet
  assert.equal(row(plan).kind, 'enquiry');                // no visit rate yet
  assert.match(row(plan).title, /Care visits · Moss/);
  visit.perVisit = 900;
  assert.equal(row(plan).kind, 'fixed');
  assert.equal(row(plan).unit, 10800);                    // 12 × 900
  visit.perVisit = null;
  let st = add(add(emptyCart(), 'cart', plan), 'cart', plan);
  assert.equal(st.cart.length, 1);                            // same plan twice → one line, no qty
  assert.equal(st.cart[0].qty, undefined);
  st = add(st, 'cart', kit);
  assert.match(orderText(st.cart.map(resolveAll)), /Care visits · Moss chamber · 12 months, every month \(12 visits\)/);
  const cleaned = clean({ cart: [plan, { kind: 'care', code: 's=piece&d=once&r=NOPE' }, { kind: 'care' }, kit] });
  assert.deepEqual(cleaned.cart.map(keyOf), [keyOf(plan), 'KIT-MOSS']);   // bad plans dropped
}
