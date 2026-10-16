// Run: node scripts/maker.test.mjs
// Guards the Maker rules that can silently go wrong: what fits which
// chamber, what a chamber swap keeps, and what a share link may carry.
import assert from 'node:assert/strict';
import { emptyBuild, capacity, togglePlant, swapChamber, done, canEnter,
         furthest, encodeBuild, decodeBuild, enquiryText, substrateSuits, previewSVG } from './maker.js';
import { chambers, plants, substrates, recipes } from '../data/maker.js';
import { sceneSpec } from './maker.js';

/** @typedef {import('./build-codec.js').Build} Build */

/** @param {string} sku */
const box = (sku) => chambers.find(c => c.sku === sku);
const aroid = substrates.find(s => s.id === 'SOIL-001');

// Capacity is read from the chamber spec; non-numeric specs fall back to 5.
assert.equal(capacity(box('FireBox')), 6);
assert.equal(capacity(box('WaterBox')), 8);
assert.equal(capacity(box('MossBox')), 5);

// Plants: suited only, no duplicates, capped at capacity.
/** @type {Build} */
let b = { ...emptyBuild(), chamber: 'BiteBox', substrate: 'studio' };
assert.ok(togglePlant(b, 'PLT-008').error, 'a Fire plant must not go in Bite');
for (const id of ['PLT-031', 'PLT-032', 'PLT-033', 'PLT-034']) b = /** @type {Build} */ (togglePlant(b, id).build);
assert.equal(b.plants.length, 4);
assert.match(/** @type {string} */ (togglePlant(b, 'PLT-035').error), /holds 4/);
assert.deepEqual(togglePlant(b, 'PLT-031').build?.plants, ['PLT-032', 'PLT-033', 'PLT-034'], 'toggle removes');

// Swapping chamber keeps what fits, reports the rest, clears an unsuited foundation.
b = { ...emptyBuild(), chamber: 'LabBox', substrate: 'SOIL-001', plants: ['PLT-041', 'PLT-008', 'PLT-042'] };
let s = swapChamber(b, 'DarkBox');
assert.deepEqual(s.build.plants, ['PLT-041', 'PLT-042']);
assert.deepEqual(s.removed, ["Echeveria 'Perle von Nürnberg'"]);
assert.equal(s.build.substrate, 'SOIL-001', 'Aroid suits Dark');
s = swapChamber(b, 'AirBox');
assert.equal(s.build.substrate, null, 'Air is soil-free');
assert.equal(s.clearedSubstrate, true);
assert.equal(substrateSuits(aroid, 'MossBox'), false);

// Required steps: soil-free skips foundation; Spore needs no plants.
assert.equal(done({ ...emptyBuild(), chamber: 'AeroBox' }, 'foundation'), true);
assert.equal(done({ ...emptyBuild(), chamber: 'SporeBox', substrate: 'studio' }, 'plants'), true);
assert.equal(canEnter(emptyBuild(), 'foundation'), false);
assert.equal(furthest(emptyBuild()), 'chamber');

// Share link round-trips, and drops anything unknown or unsuited.
const r = recipes[0];
b = { ...emptyBuild(), name: r.name, chamber: r.chamber, substrate: r.substrate, plants: r.plants };
const back = decodeBuild(encodeBuild(b));
assert.ok(back);
assert.deepEqual([back.chamber, back.substrate, back.plants, back.name], [b.chamber, b.substrate, b.plants, b.name]);
const evil = decodeBuild('c=FireBox&s=SOIL-001&p=PLT-008,PLT-008,PLT-031,<img>&n=' + 'x'.repeat(200));
assert.ok(evil);
assert.deepEqual(evil.plants, ['PLT-008']);
assert.equal(evil.substrate, null);
assert.equal(evil.name.length, 60);
assert.equal(decodeBuild('c=NotABox'), null);

// Every recipe is valid as shipped, and sendable.
for (const rc of recipes) {
  const rb = { ...emptyBuild(), chamber: rc.chamber, substrate: rc.substrate, plants: rc.plants };
  assert.equal(furthest(rb), 'review', `recipe ${rc.id} must reach review`);
  assert.deepEqual(decodeBuild(encodeBuild(rb))?.plants, rc.plants, `recipe ${rc.id} plants all suit`);
}

// Enquiry text carries the price range and every plant, and never a fake total.
const text = enquiryText({ ...b, space: { room: 'Study', household: ['Pets'], maturity: '', note: '', care: '' } });
assert.match(text, /Chamber: Moss \(₹6,000 – ₹9,000\)/);
assert.match(text, /Pillow Moss, Java Moss, Mood Moss/);
assert.match(text, /Lives in: Study/);
assert.doesNotMatch(text, /Maturity/);

// Preview renders for every chamber, including the one without a drawing.
for (const c of chambers) assert.match(previewSVG({ ...emptyBuild(), chamber: c.sku }), /<svg/);
assert.equal(plants.length, 45);

// 3D scene spec: same facts as the SVG. Soil-free chambers never carry a foundation.
let sp = sceneSpec({ ...emptyBuild(), chamber: 'DarkBox', substrate: 'SOIL-001', plants: ['PLT-041', 'PLT-045'] });
assert.equal(sp.substrate, 'aroid');
assert.deepEqual(sp.plants.map(p => [p.id, p.form]), [['PLT-041', 'leaf'], ['PLT-045', 'leaf']]);
sp = sceneSpec({ ...emptyBuild(), chamber: 'AeroBox', substrate: 'studio', plants: ['PLT-021'] });
assert.equal(sp.soilless, true);
assert.equal(sp.substrate, null);
assert.equal(sceneSpec(emptyBuild()).chamber, null);

console.log('maker: all checks passed');
