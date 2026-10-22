// ─────────────────────────────────────────────────────────────────────
// care.js · what a Care plan IS (pure, no DOM)
//
// A visit plan is stored as a short code so the
// cart keeps ids only and re-reads prices from data/care.js every time.
//   s = subject (piece | own)   r = the piece's SKU
//   d = duration   f = frequency   g = plant groups   n = number of plants
//   p = pincode
// Checked by care.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { visit, subjects, kits, coverage } from '../data/care.js';
import { elements, chamberElements } from '../data/elements.js';
import { volumeOne } from '../data/volume-one.js';
import { volumeTwo } from '../data/upcoming.js';

/**
 * A decoded visit plan (decodePlan). r = a piece's SKU;
 * f is null for a one-off visit.
 * @typedef {{ s: string, d: string, f: string | null, r: string, g: string[], n: number, p: string }} Plan
 */

/**
 * @template {{ id: string }} T
 * @param {readonly T[]} list
 * @param {unknown} id
 */
const byId = (list, id) => list.find(x => x.id === id);
const GROUPS = elements.map(e => e.id);

/**
 * @param {string} durationId
 * @param {string | null} freqId
 */
export function visitsFor(durationId, freqId){
  const d = byId(visit.durations, durationId), f = byId(visit.frequencies, freqId);
  if (!d) return 0;
  if (!d.months) return 1;
  return f ? Math.max(1, Math.round(d.months * f.perMonth)) : 0;
}

// Rupees, or null = "On enquiry" (no rate yet).
/** @param {Pick<Plan, 's' | 'd' | 'f'> | null | undefined} plan */
export function planPrice(plan){
  if (!plan || !visit.perVisit) return null;
  const n = visitsFor(plan.d, plan.f);
  return n ? Math.round(visit.perVisit * n * (1 - (/** @type {Record<string, number | undefined>} */ (visit.termDiscount)[plan.d] || 0))) : null;
}

// Which plant groups a piece belongs to → which refill kit fits.
/**
 * @param {string | undefined} ref  a SKU
 * @returns {string[]}
 */
export function groupsOf(ref){
  const box = volumeTwo.boxes.find(b => b.sku === ref);
  if (box) { const e = chamberElements[box.sku]; return e === 'all' ? [] : e; }   // Lab: any group, so ask
  return [];
}
/** @param {string} group */
export const kitFor = (group) => kits.find(k => k.element === group) || null;

// The thing being looked after, for the cart and the order message.
/** @param {Plan} plan */
export function refLabel(plan){
  if (plan.s === 'own') return `${plan.n} of my own plant${plan.n > 1 ? 's' : ''}`;
  const v1 = volumeOne.find(p => p.sku === plan.r);
  const box = volumeTwo.boxes.find(b => b.sku === plan.r);
  return v1 ? v1.name : box ? `${box.name} chamber` : '';
}

/** @param {Pick<Plan, 's' | 'd'> & Partial<Plan>} plan  n and p only matter for 'own' plans */
export function encodePlan(plan){
  const q = new URLSearchParams({ s: plan.s, d: plan.d });
  if (plan.d !== 'once') q.set('f', /** @type {string} */ (plan.f));
  if (plan.r) q.set('r', plan.r);
  if (plan.g?.length) q.set('g', plan.g.join(','));
  if (plan.s === 'own') q.set('n', String(plan.n));
  if (plan.p) q.set('p', plan.p);
  return q.toString();
}

// Untrusted input (cart storage, URL): keep only what we know, else null.
// Old custom-box plans (s=custom, retired 22 Oct 2026) fail the subject check.
/**
 * @param {string | null | undefined} str
 * @returns {Plan | null}
 */
export function decodePlan(str){
  const q = new URLSearchParams(String(str || '').replace(/^#/, ''));
  // s and d may still be null here; the checks below return null if so.
  const plan = /** @type {Plan} */ ({ s: q.get('s'), d: q.get('d'), f: q.get('f') || null, r: q.get('r') || '', g: [], n: 1, p: '' });
  if (!byId(subjects, plan.s) || !byId(visit.durations, plan.d)) return null;
  if (plan.d === 'once') plan.f = null;
  else if (!byId(visit.frequencies, plan.f)) return null;
  plan.g = [...new Set((q.get('g') || '').split(',').filter(g => GROUPS.includes(g)))];
  if (plan.s === 'own') {
    plan.r = '';
    plan.n = Math.min(500, Math.max(1, parseInt(/** @type {string} */ (q.get('n')), 10) || 1));
  } else if (!refLabel(plan)) return null;
  const pin = q.get('p') || '';
  plan.p = /^\d{6}$/.test(pin) ? pin : '';
  return plan;
}

// One plan → one human line, used by the cart and the order message.
/** @param {Pick<Plan, 'd' | 'f' | 'g' | 'p'> & Partial<Plan>} plan */
export function planSummary(plan){
  // A decoded plan's duration exists, and so does its frequency unless it's 'once'.
  const d = /** @type {typeof visit.durations[number]} */ (byId(visit.durations, plan.d));
  const f = /** @type {typeof visit.frequencies[number]} */ (byId(visit.frequencies, plan.f));
  const n = visitsFor(plan.d, plan.f);
  return [
    plan.d === 'once' ? 'One visit' : `${d.label}, ${f.label.toLowerCase()} (${n} visit${n > 1 ? 's' : ''})`,
    plan.g.length ? plan.g.join(' + ') : null,
    plan.p ? `pincode ${plan.p}${coverage.isCovered(plan.p) ? '' : ' (studio to confirm)'}` : null
  ].filter(Boolean).join(' · ');
}
