// ─────────────────────────────────────────────────────────────────────
// product-meta.js · which product a SKU is, and how it's named, described
// and pictured. Pure (no DOM), so the page (render-product-detail.js) and
// the build (seo.mjs, the crawlable /product/<SKU> pages) share one answer.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne, photoPath } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';

export const allProducts = () => [
  ...volumeOne.map(data => ({ volume: 1, kind: 'printed', data })),
  ...volumeTwo.boxes.map(data => ({ volume: 2, kind: 'box', data })),
  { volume: 3, kind: 'vivarium', data: volumeThree }
];

export const findProduct = (id) => allProducts().find(f => f.data.sku === id) || null;

// Every rupee figure in a product's price table(s); [] = price on enquiry.
const prices = (t) => !t ? [] : typeof t === 'number' ? [t] : Object.values(t).flatMap(prices);

export function productMeta(found){
  const d = found.data;
  const name = found.kind === 'box' ? d.sku : found.kind === 'printed' ? d.name : d.title;
  const description = [].concat(d.description || d.tagline || '').join(' ');
  const photo = found.kind === 'printed' ? photoPath(d)
              : found.kind === 'box' ? `/assets/boxes/${d.photo}`
              : '/assets/og-home.jpg';
  // Only Volume I pieces can be ordered today (made to order); boxes and the
  // vivarium are "coming soon", so their estimates are not offers.
  const available = found.kind === 'printed' && d.status === 'available';
  return { name, description, photo, prices: available ? prices(d.pricing) : [], available };
}
