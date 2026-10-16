// Run: node scripts/plant-search.test.mjs
// Guards discovery: search, filters, guided answers and the no-results relax list.
import assert from 'node:assert/strict';
import { emptyDiscovery, searchPlants, dropChip, clearGuided, matchesQuery, climateOrder } from './plant-search.js';
import { plants, chambers, chamberElements, guide } from '../data/maker.js';

/** @typedef {import('../data/maker.js').Plant} Plant */

/** @param {Partial<import('./plant-search.js').Discovery>} [patch] */
const st = (patch = {}) => ({ ...emptyDiscovery(), ...patch });
/** @param {{ results: Plant[] }} r */
const ids = (r) => r.results.map(p => p.id);
/** @param {string} id @returns {Plant} */
const p = (id) => { const x = plants.find(x => x.id === id); assert.ok(x, id); return x; };

// Nothing set: all 45, list order.
assert.equal(searchPlants(st()).results.length, 45);

// Search: case, whitespace, accents, botanical name, group wording, every word must match.
assert.ok(matchesQuery(p('PLT-008'), '  PERLE von nurnberg '), 'accent-insensitive');
assert.ok(matchesQuery(p('PLT-031'), 'dionaea'), 'botanical name');
assert.ok(matchesQuery(p('PLT-041'), 'low light'), 'group heading');
assert.ok(!matchesQuery(p('PLT-041'), 'low cactus'), 'all words must match');
// Synonyms from real data (M-22): the Fire chamber grows "Succulents, cacti".
const cactus = ids(searchPlants(st({ q: 'Cactus' })));
assert.deepEqual(cactus, ids(searchPlants(st({ q: 'succulent' }))));
assert.ok(cactus.includes('PLT-008') && cactus.includes('PLT-010'), 'Echeveria + Burro’s Tail');
assert.equal(ids(searchPlants(st({ q: 'cacti' }))).length, cactus.length);
// "easy" is not a synonym: no plant has a care rating yet, so it would be a guess.
assert.equal(searchPlants(st({ q: 'easy' })).results.length, 0);
const fern = ids(searchPlants(st({ q: 'fern' })));
assert.ok(fern.includes('PLT-015') && fern.includes('PLT-029'), 'Java Fern + Bird’s Nest Fern');
assert.ok(fern.every(id => p(id).name.includes('Fern') || p(id).form === 'fern'));

// "Fits my chamber" only applies once there is a chamber.
const moss = { suited: ['Moss'], chamber: 'Moss' };
assert.equal(searchPlants(st(), moss).results.length, 5);
assert.equal(searchPlants(st({ f: { groups: [], forms: [], fit: false } }), moss).results.length, 45);

// Same-kind chips OR, different kinds AND.
const two = searchPlants(st({ f: { groups: ['Moss', 'Bite'], forms: [], fit: true } }));
assert.equal(two.results.length, 10);
const andForm = searchPlants(st({ f: { groups: ['Moss', 'Bite'], forms: ['trap'], fit: true } }));
assert.deepEqual(ids(andForm), ['PLT-031', 'PLT-032', 'PLT-033', 'PLT-035']);

// Guided: the "fern" query survives a guided Woodland submit and combines with it.
const g = { look: 'woodland', light: 'low', roles: [] };
const woodFern = searchPlants(st({ q: 'fern', g }));
assert.ok(woodFern.results.length > 0);
assert.ok(woodFern.results.every(x => guide.looks[0].groups.includes(x.element) && matchesQuery(x, 'fern')));
assert.ok(woodFern.constraints.some(c => c.key === 'q') && woodFern.constraints.some(c => c.guided));

// Light only reorders: Dark first for low light, same set as without it.
const lowAll = searchPlants(st({ g: { look: '', light: 'low', roles: [] } }));
assert.equal(lowAll.results.length, 45);
assert.equal(lowAll.results[0].element, 'Dark');
assert.equal(searchPlants(st({ g: { look: '', light: 'unsure', roles: [] } })).preferences.length, 0, 'not sure adds nothing');

// Light can come from build.space (its one home since M-11): same order as g.light.
assert.equal(searchPlants(st(), { space: { light: 'low' } }).results[0]?.element, 'Dark');
assert.deepEqual(searchPlants(st(), { space: { light: 'low' } }).preferences.map(x => x.key), ['light']);

// Room + care come from build.space and never remove plants.
const pref = searchPlants(st(), { space: { room: 'Study', care: 'Easy' } });
assert.deepEqual(pref.preferences.map(x => x.key), ['room', 'care']);
assert.equal(pref.results.length, 45);

// Conflict: Fire group + Woodland look → none, and the relax list says what to drop.
const clash = searchPlants(st({ f: { groups: ['Fire'], forms: [], fit: true }, g: { look: 'woodland', light: '', roles: [] } }));
assert.equal(clash.results.length, 0);
assert.deepEqual(clash.relax.map(r => r.key).sort(), ['group:Fire', 'look']);
assert.ok(clash.relax.every(r => r.count > 0));

// Removing chips one at a time; clearing guided keeps the query and manual filters.
const s = st({ q: 'moss', f: { groups: ['Moss'], forms: [], fit: true }, g: { look: 'woodland', light: 'low', roles: ['ground'] } });
assert.equal(dropChip(s, 'role:ground').g.roles.length, 0);
assert.equal(dropChip(s, 'group:Moss').f.groups.length, 0);
assert.equal(dropChip(s, 'q').q, '');
assert.equal(s.g.roles.length, 1, 'dropChip does not mutate');
const cleared = clearGuided(s);
assert.equal(cleared.q, 'moss');
assert.deepEqual(cleared.f.groups, ['Moss']);
assert.equal(cleared.g.look, '');

// Results are always real catalogue entries.
for (const look of guide.looks) for (const x of searchPlants(st({ g: { look: look.id, light: '', roles: [] } })).results)
  assert.ok(plants.includes(x));

// Map order: dry → humid; Earth (Lab only) has no chamber and goes last.
const order = climateOrder(chambers, chamberElements);
assert.equal(order[0].id, 'Fire');
assert.equal(order.at(-1)?.id, 'Earth');
assert.equal(order.length, 9);

console.log('plant-search: all checks passed');
