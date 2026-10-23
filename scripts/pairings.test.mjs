// Run: node scripts/pairings.test.mjs
// Guards cart suggestions: fit, never coming-soon, never a duplicate, at most 2.
import assert from 'node:assert/strict';
import { suggest } from './pairings.js';
import { volumeOne } from '../data/volume-one.js';

assert.deepEqual(suggest([]), []);

// A chamber → its kit first, then visits.
const moss = suggest([{ kind: 'product', sku: 'MossBox', qty: 1 }]);
assert.deepEqual(moss.map(s => s.key), ['KIT-MOSS', 'care:MossBox']);
assert.deepEqual(moss[0].line, { kind: 'product', sku: 'KIT-MOSS' });
assert.match(/** @type {string} */ (moss[1].href), /^\/care#s=piece&d=12m/);

// Already in the cart → not suggested again; care already planned → no visits.
assert.deepEqual(suggest([{ kind: 'product', sku: 'MossBox' }, { kind: 'product', sku: 'KIT-MOSS' }, { kind: 'care', code: 'x' }]), []);

// A planter → an available plant packet or support, never coming-soon.
const planter = /** @type {import('../data/volume-one.js').Product} */ (volumeOne.find(p => p.category === 'planters' && p.pricing));
const pair = suggest([{ kind: 'product', sku: planter.sku, material: 'petg' }]);
assert.equal(pair.length, 1);
assert.notEqual(/** @type {import('../data/volume-one.js').Product} */ (volumeOne.find(p => p.sku === pair[0].key)).status, 'coming-soon');

console.log('pairings.test.mjs: ok');
