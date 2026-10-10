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

export const emptyDiscovery = () => ({
  q: '', sort: 'recommended', view: 'list',
  f: { groups: [], forms: [], fit: true },
  g: { look: '', light: '', roles: [] }
});

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const byId = (list, id) => list.find(x => x.id === id);

// Everything a visitor might type: names, group, the list's own group wording, shape.
const haystack = new Map(plants.map(p => {
  const el = byId(elements, p.element);
  return [p.id, fold([p.name, p.botanical, p.element, el.heading, el.focus, forms[p.form]].join(' '))];
}));

export const matchesQuery = (p, q) =>
  fold(q).trim().split(/\s+/).filter(Boolean).every(t => haystack.get(p.id).includes(t));

// The active constraints, each removable on its own (`clear` names the state path).
function constraints(state, ctx = {}){
  const { q, f, g } = state;
  const out = [];
  if (q.trim()) out.push({ key: 'q', label: `“${q.trim()}”`, test: p => matchesQuery(p, q) });
  if (f.fit && ctx.suited) out.push({ key: 'fit', label: `Fits the ${ctx.chamber} chamber`, test: p => ctx.suited.includes(p.element) });
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
function passes(p, list){
  const groups = {};
  for (const c of list) (groups[c.same || c.key] ||= []).push(c);
  return Object.values(groups).every(cs => cs.some(c => c.test(p)));
}

// Guided answers that never remove a plant, shown as chips so the visitor sees them.
function preferences(g, space = {}){
  const light = byId(guide.light, g.light);
  const care = byId(guide.care, space.care);
  return [
    light && light.id !== 'unsure' && { key: 'light', label: light.label },
    space.room && { key: 'room', label: space.room },
    care && { key: 'care', label: care.label }
  ].filter(Boolean);
}

const lightScore = (p, g) => (byId(guide.light, g.light)?.prefers.includes(p.element) ? 1 : 0);

export function searchPlants(state, ctx = {}){
  const list = constraints(state, ctx);
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

export const clearGuided = (state) => ({ ...state, g: emptyDiscovery().g });

// Map view: plant groups laid out dry → humid by their chamber's humidity
// range midpoint (upcoming.js). Earth has no chamber of its own (Lab only).
export function climateOrder(chambers, chamberElements){
  const mid = (h) => { const n = String(h).match(/\d+/g); return n ? (+n[0] + +n[n.length - 1]) / 2 : Infinity; };
  const home = (el) => chambers.find(c => chamberElements[c.sku]?.[0] === el && chamberElements[c.sku].length === 1);
  return elements
    .map(e => ({ id: e.id, chamber: home(e.id) }))
    .sort((a, b) => mid(a.chamber?.humidity) - mid(b.chamber?.humidity));
}
