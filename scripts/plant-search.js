// ─────────────────────────────────────────────────────────────────────
// plant-search.js · discovery rules for the Maker's Plants step (pure)
//
// One function, searchPlants(), turns the discovery state into results.
// List view, map view and guided search all read the same output, so
// switching views never changes what is shown, only how.
//
//   state = { q, f: { groups, forms, fit }, g: { look, light, roles }, sort, view }
//   ctx   = { suited: [groups the chosen chamber takes], chamber: 'Moss', space: build.space }
//
// Room and care live in build.space, not here: they travel with the enquiry
// and show up on the "Your space" step too.
//
// Constraints (remove plants): search text, group, shape, "fits my chamber",
// guided look (→ groups) and guided roles (→ shapes).
// Preferences (only reorder or travel with the enquiry): light, room, care.
// Checked by plant-search.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { plants, elements, forms, guide } from '../data/maker.js';

/**
 * @typedef {import('../data/maker.js').Plant} Plant
 * @typedef {import('../data/maker.js').Element} Element
 * @typedef {import('../data/maker.js').Chamber} Chamber
 * @typedef {{ q: string, sort: string, view: string,
 *   f: { groups: string[], forms: string[], fit: boolean },
 *   g: { look: string, light: string, roles: string[] } }} Discovery
 * @typedef {{ room?: string, care?: string }} SpaceAnswers
 * @typedef {{ suited?: string[], chamber?: string, space?: SpaceAnswers }} SearchContext
 * @typedef {{ key: string, label: string, test: (p: Plant) => boolean, same?: string, guided?: boolean }} Constraint
 * @typedef {{ key: string, label: string }} Chip
 */

/** @returns {Discovery} */
export const emptyDiscovery = () => ({
  q: '', sort: 'recommended', view: 'list',
  f: { groups: [], forms: [], fit: true },
  g: { look: '', light: '', roles: [] }
});

/** @param {string} s */
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/**
 * @template {{ id: string }} T
 * @param {readonly T[]} list @param {unknown} id
 * @returns {T | undefined}
 */
const byId = (list, id) => list.find(x => x.id === id);

// Everything a visitor might type: names, group, the list's own group wording, shape.
const haystack = new Map(plants.map(p => {
  const el = /** @type {Element} */ (byId(elements, p.element));   // every plant's group exists (data.test.mjs)
  return [p.id, fold([p.name, p.botanical, p.element, el.heading, el.focus, forms[p.form]].join(' '))];
}));

/** @param {Plant} p @param {string} q */
export const matchesQuery = (p, q) =>
  fold(q).trim().split(/\s+/).filter(Boolean).every(t => /** @type {string} */ (haystack.get(p.id)).includes(t));

// The active constraints, each removable on its own (`clear` names the state path).
/** @param {Discovery} state @param {SearchContext} [ctx] */
function constraints(state, ctx = {}){
  const { q, f, g } = state;
  /** @type {Constraint[]} */
  const out = [];
  if (q.trim()) out.push({ key: 'q', label: `“${q.trim()}”`, test: p => matchesQuery(p, q) });
  if (f.fit && ctx.suited) out.push({ key: 'fit', label: `Fits the ${String(ctx.chamber)} chamber`, test: p => /** @type {string[]} */ (ctx.suited).includes(p.element) });
  for (const id of f.groups) out.push({ key: `group:${id}`, label: id, test: p => p.element === id, same: 'group' });
  for (const id of f.forms) out.push({ key: `form:${id}`, label: forms[id], test: p => p.form === id, same: 'form' });
  const look = byId(guide.looks, g.look);
  if (look) out.push({ key: 'look', label: look.label, guided: true, test: p => look.groups.includes(p.element) });
  for (const id of g.roles) {
    const r = byId(guide.roles, id);
    if (r) out.push({ key: `role:${id}`, label: r.label, guided: true, test: p => r.forms.includes(p.form), same: 'role' });
  }
  return out;
}

// Chips of the same kind are OR'd (Fern or Moss); different kinds are AND'd.
/** @param {Plant} p @param {Constraint[]} list */
function passes(p, list){
  /** @type {Map<string, Constraint[]>} */
  const groups = new Map();
  for (const c of list) {
    const k = c.same || c.key;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  return [...groups.values()].every(cs => cs.some(c => c.test(p)));
}

// Guided answers that never remove a plant, shown as chips so the visitor sees them.
/** @param {Discovery['g']} g @param {SpaceAnswers} [space] @returns {Chip[]} */
function preferences(g, space = {}){
  const light = byId(guide.light, g.light);
  const care = byId(guide.care, space.care);
  return [
    light && light.id !== 'unsure' && { key: 'light', label: light.label },
    space.room && { key: 'room', label: space.room },
    care && { key: 'care', label: care.label }
  ].filter(/** @returns {c is Chip} */ c => Boolean(c));
}

/** @param {Plant} p @param {Discovery['g']} g */
const lightScore = (p, g) => (byId(guide.light, g.light)?.prefers.includes(p.element) ? 1 : 0);

/** @param {Discovery} state @param {SearchContext} [ctx] */
export function searchPlants(state, ctx = {}){
  const list = constraints(state, ctx);
  /** @param {Plant} a @param {Plant} b */
  const order = (a, b) =>
    state.sort === 'name'  ? a.name.localeCompare(b.name) :
    state.sort === 'group' ? elements.findIndex(e => e.id === a.element) - elements.findIndex(e => e.id === b.element) :
    lightScore(b, state.g) - lightScore(a, state.g);   // recommended: stable, so list order breaks ties
  const results = plants.filter(p => passes(p, list)).sort(order);
  // No matches: what each single removal would bring back, most useful first.
  const relax = results.length ? [] : list
    .map(c => ({ key: c.key, label: c.label, count: plants.filter(p => passes(p, list.filter(x => x !== c))).length }))
    .filter(r => r.count).sort((a, b) => b.count - a.count);
  return { results, constraints: list, preferences: preferences(state.g, ctx.space), relax };
}

// Remove one chip from the state. Returns a new state.
/** @param {Discovery} state @param {string} key @returns {Discovery} */
export function dropChip(state, key){
  const s = structuredClone(state);
  const [kind, id] = key.split(':');
  if (kind === 'q') s.q = '';
  if (kind === 'fit') s.f.fit = false;
  if (kind === 'group') s.f.groups = s.f.groups.filter(x => x !== id);
  if (kind === 'form') s.f.forms = s.f.forms.filter(x => x !== id);
  if (kind === 'look') s.g.look = '';
  if (kind === 'role') s.g.roles = s.g.roles.filter(x => x !== id);
  if (kind === 'light') s.g.light = '';   // room + care: the caller clears build.space
  return s;
}

/** @param {Discovery} state @returns {Discovery} */
export const clearGuided = (state) => ({ ...state, g: emptyDiscovery().g });

// Map view: plant groups laid out dry → humid by their chamber's humidity
// range midpoint (upcoming.js). Earth has no chamber of its own (Lab only).
/** @param {readonly Chamber[]} chambers @param {Record<string, string[] | 'all' | undefined>} chamberElements */
export function climateOrder(chambers, chamberElements){
  /** @param {string|undefined} h */
  const mid = (h) => { const n = String(h).match(/\d+/g); return n ? (+n[0] + +n[n.length - 1]) / 2 : Infinity; };
  /** @param {string} el */
  const home = (el) => chambers.find(c => { const els = chamberElements[c.sku]; return els?.[0] === el && els.length === 1; });
  return elements
    .map(e => ({ id: e.id, chamber: home(e.id) }))
    .sort((a, b) => mid(a.chamber?.humidity) - mid(b.chamber?.humidity));
}
