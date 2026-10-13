// ─────────────────────────────────────────────────────────────────────
// pairings.js · "goes with your order" (pure, no DOM)
//
// A few plain rules, run in the visitor's browser on what's in the cart.
// Nothing is sent anywhere, and nothing is labelled "popular": there is no
// shared data behind these, only what fits. The cart drawer shows at most
// two. Built for Care (CARE-PLAN.md); the "Recommended for you" section
// (bead site-8bo) reuses suggest() later.
//
// A suggestion is { line } (one tap adds it) or { href } (needs choices
// first, e.g. a visit plan), plus a title and a one-line reason.
// Checked by pairings.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';
import { groupsOf, kitFor, encodePlan } from './care.js';

const MAX = 2;
const available = (p) => p.status !== 'coming-soon';

export function suggest(cart){
  const inCart = new Set(cart.map(l => l.sku).filter(Boolean));
  const hasCare = cart.some(l => l.kind === 'care');
  const out = [];
  const push = (s) => { if (out.length < MAX && !out.some(o => o.key === s.key)) out.push(s); };

  for (const l of cart) {
    const ref = l.kind === 'build' ? l.code : l.sku;
    const isBox = l.kind === 'build' || volumeTwo.boxes.some(b => b.sku === l.sku);

    // Chamber or custom box → its refill kit, then visits.
    for (const g of groupsOf(ref)) {
      const kit = kitFor(g);
      if (kit && !inCart.has(kit.sku)) push({ key: kit.sku, line: { kind: 'product', sku: kit.sku }, title: kit.name, reason: `Soil, feed and tools for ${g} plants.` });
    }
    if (isBox && !hasCare) {
      const plan = { s: l.kind === 'build' ? 'custom' : 'piece', r: ref, d: '12m', f: 'monthly', g: groupsOf(ref) };
      push({ key: `care:${ref}`, href: `/care#${encodePlan(plan)}`, title: 'Care visits', reason: 'We come and look after it, in Mumbai.' });
    }

    // Planter → something to grow in it.
    const p = volumeOne.find(x => x.sku === l.sku);
    if (p?.category === 'planters') {
      const pair = volumeOne.find(x => (x.category === 'plant-support' || x.category === 'plant-packets') && available(x) && !inCart.has(x.sku));
      if (pair) push({ key: pair.sku, href: `/product/${encodeURIComponent(pair.sku)}`, title: pair.name, reason: 'Pairs with your planter.' });
    }
  }
  return out;
}
