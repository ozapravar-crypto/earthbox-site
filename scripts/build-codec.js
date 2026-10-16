// ─────────────────────────────────────────────────────────────────────
// build-codec.js · what a Maker build IS (pure, no DOM)
//
// The build shape, the lookups and the share-link codec. Split out of
// maker.js so the cart (every page) can read a saved build without loading
// the whole Maker UI, and so cart.js and maker.js no longer import each
// other. maker.js re-exports everything here, so its API is unchanged.
// Checked by maker.test.mjs and cart.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { chambers, plants, substrates, elements, chamberElements, SOILLESS } from '../data/maker.js';

/**
 * @typedef {import('../data/maker.js').Plant} Plant
 * @typedef {import('../data/maker.js').Chamber} Chamber
 * @typedef {import('../data/maker.js').Substrate} Substrate
 * @typedef {{ room: string, household: string[], maturity: string, note: string, care: string }} Space
 * @typedef {{ name: string, chamber: string|null, substrate: string|null, plants: string[], space: Space }} Build
 */

/**
 * @template {Record<string, unknown>} T
 * @param {readonly T[]} list @param {unknown} id @param {string} [key]
 * @returns {T | undefined}
 */
const find = (list, id, key = 'id') => list.find(x => x[key] === id);

/** @returns {Build} */
export const emptyBuild = () => ({
  name: '', chamber: null, substrate: null, plants: [],
  space: { room: '', household: [], maturity: '', note: '', care: '' }
});

/** @param {Build} b */
export const chamberOf = (b) => find(chambers, b.chamber, 'sku');
/** @param {unknown} id */
export const plantOf   = (id) => find(plants, id);
/** @param {string|null|undefined} sku */
export const isSoilless = (sku) => sku != null && SOILLESS.includes(sku);

/** @param {string|null|undefined} sku @returns {string[]} */
export function suitedElements(sku){
  const e = sku == null ? undefined : chamberElements[sku];
  return e === 'all' ? elements.map(x => x.id) : (e || []);
}
/** @param {Plant|null|undefined} plant @param {string|null|undefined} sku */
export const isSuited = (plant, sku) => !!plant && suitedElements(sku).includes(plant.element);

// "3 – 6 plants" → 6. Specs without a number ("Dense coverage", "Variable")
// fall back to 5, one elemental group's worth.
// ponytail: parsed from display text; add a numeric `maxPlants` to upcoming.js if a spec ever reads "up to 6".
/** @param {Chamber|null|undefined} chamber */
export function capacity(chamber){
  const m = String(chamber?.capacity || '').match(/(\d+)\s*plants/);
  return m ? +m[1] : 5;
}

/** @param {Substrate|null|undefined} sub @param {string|null|undefined} sku */
export function substrateSuits(sub, sku){
  if (!sub || !sku || isSoilless(sku)) return false;
  return !sub.suits || sub.suits.some(el => suitedElements(sku).includes(el));
}

// Share link · composition only. "Your space" answers are personal and stay out.
/** @param {Build} b */
export function encodeBuild(b){
  const q = new URLSearchParams();
  if (b.chamber)   q.set('c', b.chamber);
  if (b.substrate) q.set('s', b.substrate);
  if (b.plants.length) q.set('p', b.plants.join(','));
  if (b.name)      q.set('n', b.name);
  return q.toString();
}

// Untrusted input (URL hash, localStorage): keep only ids we know and that fit.
/** @param {unknown} str @returns {Build|null} */
export function decodeBuild(str){
  const q = new URLSearchParams((typeof str === 'string' ? str : '').replace(/^#/, ''));
  const b = emptyBuild();
  if (!find(chambers, q.get('c'), 'sku')) return null;
  b.chamber = q.get('c');
  if (substrateSuits(find(substrates, q.get('s')), b.chamber)) b.substrate = q.get('s');
  b.plants = [...new Set((q.get('p') || '').split(','))]
    .filter(id => isSuited(plantOf(id), b.chamber))
    .slice(0, capacity(chamberOf(b)));
  b.name = (q.get('n') || '').slice(0, 60);
  return b;
}
