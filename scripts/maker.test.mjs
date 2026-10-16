// Run: node scripts/maker.test.mjs
// Guards the Maker rules that can silently go wrong: what fits which
// chamber, what a chamber swap keeps, and what a share link may carry.
import assert from 'node:assert/strict';
import { emptyBuild, capacity, togglePlant, swapChamber, done, canEnter,
         furthest, encodeBuild, decodeBuild, enquiryText, substrateSuits, previewSVG } from './maker.js';
import { chambers, plants, substrates, recipes } from '../data/maker.js';
import { sceneSpec, fitting, roomFor, exploring, suggestChamber, fromPrice } from './maker.js';

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

// A recipe's name goes with its chamber (UX audit M-12); a name of your own stays.
const jungle = /** @type {typeof recipes[number]} */ (recipes.find(rc => rc.id === 'tiny-jungle'));
b = { ...emptyBuild(), name: jungle.name, chamber: jungle.chamber, substrate: jungle.substrate, plants: [...jungle.plants] };
s = swapChamber(b, 'FireBox');
assert.equal(s.build.name, '');
assert.equal(s.clearedName, 'Tiny Jungle');
assert.equal(swapChamber({ ...b, name: 'My Fern Den' }, 'FireBox').build.name, 'My Fern Den');
assert.equal(swapChamber({ ...b, chamber: 'LabBox' }, 'DarkBox').build.name, 'Tiny Jungle', 'back to its own chamber: kept');

// Plants step modes (M-06): 8 or fewer fit → the short list; only the Lab explores by default.
for (const c of chambers) {
  const n = fitting(c.sku).length;
  assert.equal(exploring({ ...emptyBuild(), chamber: c.sku }, false), n > 8, `${c.sku} mode`);
  if (n) assert.ok(roomFor(c) <= n && roomFor(c) <= capacity(c));
}
assert.equal(chambers.filter(c => !exploring({ ...emptyBuild(), chamber: c.sku }, false)).length, 9, '9 of 10 chambers are simple');
assert.equal(exploring({ ...emptyBuild(), chamber: 'MossBox' }, true), true, 'asked to explore');
assert.equal(roomFor(/** @type {typeof chambers[number]} */ (box('WaterBox'))), 5, 'Water holds 8, but 5 plants fit (M-23)');

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
const text = enquiryText({ ...b, space: { room: 'Study', light: 'low', household: ['Pets'], maturity: '', note: '', care: 'Easy' } });
assert.match(text, /Chamber: Moss \(₹6,000 – ₹9,000\)/);
assert.match(text, /Pillow Moss, Java Moss, Mood Moss/);
assert.match(text, /Lives in: Study/);
assert.doesNotMatch(text, /Maturity/);
assert.match(text, /Light there: Low light/, 'light is sent (UX audit M-11)');
assert.match(text, /Care wanted: Easy/);
assert.doesNotMatch(enquiryText(b), /Light there/, 'no answer, no line');

// "Help me choose a chamber" (M-15): the guided answers point at the chambers
// whose own group holds the most matches. Lab (every group) is never "the" fit.
assert.deepEqual(suggestChamber({ look: 'minimal', light: 'bright', roles: [] }).skus, ['FireBox', 'AeroBox'], 'Fire first: bright light leads');
assert.deepEqual(suggestChamber({ look: '', light: '', roles: ['ground'] }).skus, ['MossBox']);
assert.equal(suggestChamber({ look: 'woodland', light: '', roles: ['sculpt'] }).skus.includes('LabBox'), false);
const noFit = suggestChamber({ look: 'minimal', light: '', roles: ['ground'] });
assert.deepEqual([noFit.skus, noFit.none], [[], true], 'nothing matches: says so');

// Recipe cards: "from" the low end of the chamber's guide range (M-24).
assert.equal(fromPrice(/** @type {typeof chambers[number]} */ (box('FireBox'))), '₹4,000');

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
