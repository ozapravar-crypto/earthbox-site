// Run: node scripts/care.test.mjs
// Guards Care: visit counts, prices (null until set), plan codes from
// untrusted input, kit matching for every chamber.
import assert from 'node:assert/strict';
import { visitsFor, planPrice, encodePlan, decodePlan, groupsOf, kitFor, planSummary } from './care.js';
import { visit, kits, coverage } from '../data/care.js';
import { elements, chamberElements } from '../data/maker.js';
import { volumeTwo } from '../data/upcoming.js';
import { encodeBuild, emptyBuild } from './build-codec.js';

// Visit counts: every duration × frequency.
const want = { once: [1, 1, 1], '3m': [6, 3, 1], '6m': [12, 6, 2], '12m': [24, 12, 4] };
for (const d of visit.durations) visit.frequencies.forEach((f, i) => assert.equal(visitsFor(d.id, f.id), want[d.id][i], `${d.id} × ${f.id}`));
assert.equal(visitsFor('nope', 'monthly'), 0);

// Prices: null until the studio sets a rate; custom boxes always quoted.
const plan = { s: 'own', d: '12m', f: 'monthly', g: [], n: 3, p: '' };
assert.equal(planPrice(plan), null);
visit.perVisit = 1000; visit.termDiscount['12m'] = 0.1;
assert.equal(planPrice(plan), 10800);                       // 12 × 1000 − 10%
assert.equal(planPrice({ ...plan, d: 'once', f: null }), 1000);
assert.equal(planPrice({ ...plan, s: 'custom' }), null);
visit.perVisit = null; visit.termDiscount['12m'] = 0;

// Plan codes round-trip, and untrusted ones are cleaned or refused.
const build = encodeBuild({ ...emptyBuild(), chamber: 'MossBox', plants: ['PLT-036'] });
for (const p of [
  { s: 'own', d: '6m', f: 'fortnightly', r: '', g: ['Moss', 'Bite'], n: 12, p: '400101' },
  { s: 'piece', d: 'once', f: null, r: 'MossBox', g: ['Moss'], n: 1, p: '' },
  { s: 'custom', d: '3m', f: 'monthly', r: build, g: [], n: 1, p: '' }
]) assert.deepEqual(decodePlan(encodePlan(p)), p);
assert.equal(decodePlan('s=piece&d=once&r=NOPE'), null);           // unknown piece
assert.equal(decodePlan('s=custom&d=once&r=MossBox'), null);       // a piece is not a build
assert.equal(decodePlan('s=own&d=3m'), null);                      // a term needs a frequency
assert.equal(decodePlan('s=x&d=once'), null);
const junk = decodePlan('s=own&d=once&f=monthly&n=99999&g=Moss,<script>&p=12');
assert.deepEqual([junk.n, junk.g, junk.p, junk.f], [500, ['Moss'], '', null]);

// Every chamber points at a real kit (Lab suits every group, so it asks).
for (const box of volumeTwo.boxes) {
  const g = groupsOf(box.sku);
  if (chamberElements[box.sku] === 'all') { assert.deepEqual(g, []); continue; }
  g.forEach(el => assert.ok(kitFor(el), `${box.sku} → ${el} kit`));
}
assert.deepEqual(groupsOf(build), ['Moss']);
assert.equal(kits.length, elements.length);
assert.ok(kits.every(k => k.contents.length && k.price === null));

assert.ok(coverage.isCovered('400101') && !coverage.isCovered('411001'));
assert.match(planSummary({ s: 'own', d: '12m', f: 'monthly', g: ['Moss'], n: 2, p: '411001' }), /12 visits.*Moss.*studio to confirm/);

console.log('care.test.mjs: ok');
