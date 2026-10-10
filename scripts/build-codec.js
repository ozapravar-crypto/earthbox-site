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

const find = (list, id, key = 'id') => list.find(x => x[key] === id);

export const emptyBuild = () => ({
  name: '', chamber: null, substrate: null, plants: [],
  space: { room: '', household: [], maturity: '', note: '', care: '' }
});

export const chamberOf = (b) => find(chambers, b.chamber, 'sku');
export const plantOf   = (id) => find(plants, id);
export const isSoilless = (sku) => SOILLESS.includes(sku);

export function suitedElements(sku){
  const e = chamberElements[sku];
  return e === 'all' ? elements.map(x => x.id) : (e || []);
}
export const isSuited = (plant, sku) => !!plant && suitedElements(sku).includes(plant.element);

// "3 – 6 plants" → 6. Specs without a number ("Dense coverage", "Variable")
// fall back to 5, one elemental group's worth.
// ponytail: parsed from display text; add a numeric `maxPlants` to upcoming.js if a spec ever reads "up to 6".
export function capacity(chamber){
  const m = String(chamber?.capacity || '').match(/(\d+)\s*plants/);
  return m ? +m[1] : 5;
}

export function substrateSuits(sub, sku){
  if (!sub || !sku || isSoilless(sku)) return false;
  return !sub.suits || sub.suits.some(el => suitedElements(sku).includes(el));
}

// Share link · composition only. "Your space" answers are personal and stay out.
export function encodeBuild(b){
  const q = new URLSearchParams();
  if (b.chamber)   q.set('c', b.chamber);
  if (b.substrate) q.set('s', b.substrate);
  if (b.plants.length) q.set('p', b.plants.join(','));
  if (b.name)      q.set('n', b.name);
  return q.toString();
}

// Untrusted input (URL hash, localStorage): keep only ids we know and that fit.
export function decodeBuild(str){
  const q = new URLSearchParams(String(str || '').replace(/^#/, ''));
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
