// ─────────────────────────────────────────────────────────────────────
// product-meta.js · which product a SKU is, and how it's named, described
// and pictured. Pure (no DOM), so the page (render-product-detail.js) and
// the build (seo.mjs, the crawlable /product/<SKU> pages) share one answer.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne, photoPath } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';

export const allProducts = () => [
  ...volumeOne.map(data => ({ volume: 1, kind: /** @type {const} */ ('printed'), data })),
  ...volumeTwo.boxes.map(data => ({ volume: 2, kind: /** @type {const} */ ('box'), data })),
  { volume: 3, kind: /** @type {const} */ ('vivarium'), data: volumeThree }
];

/** @typedef {ReturnType<typeof allProducts>[number]} Found  a product and which volume/kind it is */

/**
 * @param {string} id  a SKU
 * @returns {Found | null}
 */
export const findProduct = (id) => allProducts().find(f => f.data.sku === id) || null;

// Every rupee figure in a product's price table(s); [] = price on enquiry.
/** @type {(t: unknown) => number[]} */
const prices = (t) => !t ? [] : typeof t === 'number' ? [t] : Object.values(/** @type {object} */ (t)).flatMap(prices);

/** @param {Found} found */
export function productMeta(found){
  const d = /** @type {{ description?: string | string[], tagline?: string }} */ (found.data);
  const name = found.kind === 'box' ? found.data.sku : found.kind === 'printed' ? found.data.name : found.data.title;
  const description = /** @type {string[]} */ ([]).concat(d.description || d.tagline || '').join(' ');
  const photo = found.kind === 'printed' ? photoPath(found.data)
              : found.kind === 'box' ? `/assets/boxes/${found.data.photo}`
              : '/assets/og-home.jpg';
  // Only Volume I pieces can be ordered today (made to order); boxes and the
  // vivarium are "coming soon", so their estimates are not offers.
  const available = found.kind === 'printed' && found.data.status === 'available';
  return { name, description, photo, prices: available ? prices(found.data.pricing) : [], available };
}
