// Run: node scripts/cart.test.mjs
// Guards the cart: three line kinds, tallies, untrusted storage, order text.
import assert from 'node:assert/strict';
import { resolve, totals, clean, add, remove, setQty, move, orderText, keyOf, emptyCart, parseRange, buildTotal } from './cart.js';
import { encodeBuild, emptyBuild } from './build-codec.js';

const capsule = { kind: 'product', sku: 'V1-PLT-006', material: 'abs', qty: 1 };          // ₹529
const stack   = { kind: 'product', sku: 'V1-PLT-005', variant: 'big', material: 'asa', qty: 1 }; // ₹1,799
const soon    = { kind: 'product', sku: 'V1-PLT-001', qty: 1 };                             // no price
const moss    = { kind: 'product', sku: 'MossBox', qty: 1 };                                // range
const build   = { kind: 'build', code: encodeBuild({ ...emptyBuild(), chamber: 'MossBox', substrate: null, plants: ['PLT-036'] }) };

// Kinds.
assert.equal(resolve(capsule).kind, 'fixed');
assert.equal(resolve(capsule).unit, 529);
assert.equal(resolve(stack).unit, 1799);
assert.equal(resolve(soon).kind, 'enquiry');
// Coming-soon chambers: savable, never in the cart (studio decision, 12 Oct 2026).
assert.equal(resolve(moss), null);
assert.deepEqual(resolve(moss, 'saved').range, parseRange('₹6,000 – ₹9,000'));
assert.equal(resolve(moss, 'saved').cartable, false);
assert.deepEqual(add(emptyCart(), 'cart', moss), emptyCart());
const sv = add(emptyCart(), 'saved', moss);
assert.equal(sv.saved.length, 1);
assert.deepEqual(move(sv, 'saved', keyOf(moss)), sv);                 // refused, and not lost from Saved
assert.deepEqual(clean({ cart: [moss], saved: [moss] }).cart, []);
assert.equal(clean({ cart: [moss], saved: [moss] }).saved.length, 1);
assert.equal(resolve(build).kind, 'custom');

// Unknown or mismatched ids never resolve.
assert.equal(resolve({ kind: 'product', sku: 'NOPE', qty: 1 }), null);
assert.equal(resolve({ kind: 'product', sku: 'V1-PLT-005', variant: 'huge', material: 'asa' }), null, 'bad variant');
assert.equal(resolve({ kind: 'product', sku: 'V1-PLT-006', material: 'gold' }), null, 'bad material');
assert.equal(resolve({ kind: 'build', code: 'c=Nope' }), null);

// Same piece twice → qty 2; another material → its own line.
let s = add(add(emptyCart(), 'cart', capsule), 'cart', capsule);
assert.equal(s.cart.length, 1);
assert.equal(s.cart[0].qty, 2);
s = add(s, 'cart', { ...capsule, material: 'asa' });
assert.equal(s.cart.length, 2);
assert.equal(add(add(emptyCart(), 'cart', build), 'cart', build).cart.length, 1, 'a build is added once');

// Qty clamps 1..20; builds have no qty.
assert.equal(setQty(s, keyOf(capsule), 0).cart[0].qty, 1);
assert.equal(setQty(s, keyOf(capsule), 99).cart[0].qty, 20);

// Totals: fixed exact, ranges carried, unpriced counted.
const r = (lines) => totals(lines.map(resolve));
assert.deepEqual(r([capsule, stack]), { items: 2, fixed: 2328, low: 2328, high: 2328, ranged: false, quoted: 0 });
const mixed = r([{ ...capsule, qty: 2 }, soon, build]);       // the build carries the chamber's range
assert.equal(mixed.fixed, 1058);
assert.equal(mixed.low, 1058 + 6000);
assert.equal(mixed.high, 1058 + 9000);
assert.equal(mixed.quoted, 1 + 2);
// Build: chamber range + foundation (studio's choice, unpriced) + 1 unpriced plant → 2 quoted.
const bt = buildTotal(resolve(build));
assert.deepEqual([bt.low, bt.high, bt.quoted], [6000, 9000, 2]);
assert.equal(resolve(build).parts.length, 3);

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

// Order text carries every line, how it's priced, and the tallies.
const text = orderText([{ ...capsule, qty: 2 }, soon, build].map(l => resolve(l)));
assert.match(text, /Capsule Planter · ABS: ₹529 × 2 = ₹1,058/);
assert.match(text, /TerraMesh Planter.*on enquiry/);
assert.match(text, /custom build/);
assert.match(text, /earthbox\.in\/maker#c=MossBox/);
assert.match(text, /Priced items: ₹1,058/);
assert.match(text, /Still to quote: 3 items/);

console.log('cart: all checks passed');

// Care (care.html): kits are product lines; visit plans are one-off care lines.
{
  const { encodePlan } = await import('./care.js');
  const { visit } = await import('../data/care.js');
  const kit = { kind: 'product', sku: 'KIT-MOSS', qty: 1 };
  const plan = { kind: 'care', code: encodePlan({ s: 'piece', r: 'MossBox', d: '12m', f: 'monthly', g: ['Moss'], n: 1, p: '400101' }) };
  assert.equal(resolve(kit).kind, 'enquiry');                 // no kit price yet
  assert.equal(resolve(plan).kind, 'enquiry');                // no visit rate yet
  assert.match(resolve(plan).title, /Care visits · Moss/);
  visit.perVisit = 900;
  assert.equal(resolve(plan).kind, 'fixed');
  assert.equal(resolve(plan).unit, 10800);                    // 12 × 900
  visit.perVisit = null;
  let st = add(add(emptyCart(), 'cart', plan), 'cart', plan);
  assert.equal(st.cart.length, 1);                            // same plan twice → one line, no qty
  assert.equal(st.cart[0].qty, undefined);
  st = add(st, 'cart', kit);
  assert.match(orderText(st.cart.map(resolve)), /Care visits · Moss chamber · 12 months, every month \(12 visits\)/);
  const cleaned = clean({ cart: [plan, { kind: 'care', code: 's=piece&d=once&r=NOPE' }, { kind: 'care' }, kit] });
  assert.deepEqual(cleaned.cart.map(keyOf), [keyOf(plan), 'KIT-MOSS']);   // bad plans dropped
}
