// Run: node scripts/pairings.test.mjs
// Guards cart suggestions: fit, never coming-soon, never a duplicate, at most 2.
import assert from 'node:assert/strict';
import { suggest } from './pairings.js';
import { volumeOne } from '../data/volume-one.js';
import { encodeBuild, emptyBuild } from './build-codec.js';

assert.deepEqual(suggest([]), []);

// A chamber → its kit first, then visits.
const moss = suggest([{ kind: 'product', sku: 'MossBox', qty: 1 }]);
assert.deepEqual(moss.map(s => s.key), ['KIT-MOSS', 'care:MossBox']);
assert.deepEqual(moss[0].line, { kind: 'product', sku: 'KIT-MOSS' });
assert.match(moss[1].href, /^\/care#s=piece&d=12m/);

// Already in the cart → not suggested again; care already planned → no visits.
assert.deepEqual(suggest([{ kind: 'product', sku: 'MossBox' }, { kind: 'product', sku: 'KIT-MOSS' }, { kind: 'care', code: 'x' }]), []);

// A custom box → kits for its groups (capped at 2).
const build = encodeBuild({ ...emptyBuild(), chamber: 'LabBox', plants: ['PLT-036', 'PLT-001', 'PLT-006'] });
const b = suggest([{ kind: 'build', code: build }]);
assert.equal(b.length, 2);
assert.ok(b.every(s => s.key.startsWith('KIT-')));

// A planter → an available plant packet or support, never coming-soon.
const planter = volumeOne.find(p => p.category === 'planters' && p.pricing);
const pair = suggest([{ kind: 'product', sku: planter.sku, material: 'petg' }]);
assert.equal(pair.length, 1);
assert.notEqual(volumeOne.find(p => p.sku === pair[0].key).status, 'coming-soon');

console.log('pairings.test.mjs: ok');
