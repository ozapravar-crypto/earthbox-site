// node --test scripts/account.test.mjs · the sign-in merge rule (account.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { merge } from './account.js';

const p = (/** @type {string} */ sku, qty = 1) => ({ kind: 'product', sku, variant: 'S', material: 'PETG', qty });

void test('signing in keeps both devices’ lines, once each, higher quantity wins', () => {
  const m = merge({ cart: [p('A', 1), p('B', 3)], saved: [] }, { cart: [p('A', 2)], saved: [{ kind: 'build', code: 'x' }] });
  assert.deepEqual(m.cart.map(l => [l.sku, l.qty]), [['A', 2], ['B', 3]]);
  assert.equal(m.saved.length, 1);
});

void test('a line in one cart and the other’s saved list ends up in the cart only', () => {
  const m = merge({ cart: [p('A')], saved: [] }, { cart: [], saved: [p('A')] });
  assert.equal(m.cart.length, 1);
  assert.equal(m.saved.length, 0);
});

void test('missing or broken server copy leaves the local cart alone', () => {
  assert.deepEqual(merge({ cart: [p('A')], saved: [] }, null).cart, [p('A')]);
});
