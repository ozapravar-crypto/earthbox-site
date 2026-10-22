// ─────────────────────────────────────────────────────────────────────
// care-page.js · /care: the home planner + the business enquiry
//
// Homes: what are we looking after → kit or visits → add to cart. The cart
// (cart.js) handles the rest, as for any other line. Businesses: a quote
// form, sent through the same Web3Forms handler as every enquiry
// (enquiry-form.js); here we only fold its fields into the message.
// Rules live in scripts/care.js, data in data/care.js. Plan: CARE-PLAN.md.
// ─────────────────────────────────────────────────────────────────────

import { visit, subjects, businessSites, groupNames, coverage } from '../data/care.js';
import { elements } from '../data/elements.js';
import { volumeOne } from '../data/volume-one.js';
import { planPrice, groupsOf, kitFor, encodePlan, decodePlan, planSummary, refLabel } from './care.js';
import { esc, rupees } from './util.js';
import { icon } from '../data/icons.js';

/** @typedef {import('./care.js').Plan} Plan */

const GROUP_NOTE = Object.fromEntries(elements.map(e => [e.id, e.heading]));
// "Mosses (Moss)": the plain name first, the group's name second (UX audit S-21).
/** @param {string} g */
const groupLabel = (g) => `${groupNames[g] || g} (${g})`;
// The quiet line under the pincode (UX audit S-24): a hint, never a refusal.
/** @param {string} pin */
const pinNote = (pin) => (!pin ? coverage.note.empty : coverage.isCovered(pin) ? coverage.note.inside : coverage.note.outside);
/** @param {unknown} o */
const attr = (o) => esc(JSON.stringify(o));
// Pieces someone can own and that hold plants: available Volume I planters,
// plant packets and supports. Chambers are coming soon, so they're not here.
const OWNABLE = volumeOne.filter(p => p.status !== 'coming-soon' && ['planters', 'plant-packets', 'plant-support'].includes(p.category));

export function initCare(){
  const root = document.getElementById('carePlanner');
  if (!root) return;

  const fromLink = decodePlan(location.hash);
  /** @type {Plan & { mode: string }} */
  const st = fromLink ? { ...fromLink, mode: 'visits' }
    : { s: 'piece', r: OWNABLE[0]?.sku || '', g: [], n: 1, d: '12m', f: 'monthly', p: '', mode: 'kit' };
  if (st.d === 'once') st.f = 'monthly';   // remembered for when they pick a term
  // A link for a piece that can't be owned yet (coming soon, or a chamber)
  // mustn't open on another piece's plan (UX audit S-20): say so, and start
  // from a piece that can.
  let blocked = st.s === 'piece' && st.r && !OWNABLE.some(p => p.sku === st.r) ? refLabel(st) : '';
  if (blocked) { st.r = OWNABLE[0]?.sku || ''; st.g = []; }

  // Every id looked up below is in root's own markup.
  /** @param {string} sel */
  const $ = (sel) => /** @type {HTMLElement} */ (root.querySelector(sel));
  const plan = () => ({ s: st.s, r: st.s === 'own' ? '' : st.r, d: st.d, f: st.d === 'once' ? null : st.f, g: groups(), n: st.n, p: st.p });
  // Plant groups: known from the piece, else chosen by the visitor.
  const derived = () => (st.s === 'own' ? [] : groupsOf(st.r));
  const groups = () => derived().length ? derived() : st.g;

  function refPart(){
    if (st.s === 'own') return `
      <label class="care-field"><span>About how many plants?</span>
        <input type="number" name="n" min="1" max="500" value="${st.n}" inputmode="numeric"></label>`;
    /**
     * @param {string} sku
     * @param {string} name
     */
    const opt = (sku, name) => `<option value="${esc(sku)}"${sku === st.r ? ' selected' : ''}>${esc(name)}</option>`;
    return `${blocked ? `
      <p class="care-note" data-care-blocked>The ${esc(blocked)} is coming soon, so it can't have a care plan yet. Choose a piece you have, or My own plants.</p>` : ''}
      <label class="care-field"><span>Which piece?</span>
        <select name="r">
          ${OWNABLE.map(p => opt(p.sku, p.name)).join('')}
        </select></label>`;
  }

  // Asked only where the answer changes the result: it picks the kit, but a
  // visit looks after whatever is there (UX audit S-21).
  function groupsPart(){
    if (st.mode !== 'kit') return '';
    if (derived().length) return `<p class="care-note">For ${derived().map(g => `<strong>${esc(groupLabel(g))}</strong>`).join(' and ')}.</p>`;
    return `<fieldset class="care-groups"><legend>Which plants live in it?</legend>
      ${elements.map(e => `<label class="care-check"><input type="checkbox" name="g" value="${e.id}"${st.g.includes(e.id) ? ' checked' : ''}>
        <span>${esc(groupLabel(e.id))}</span><small>${esc(e.heading)}</small></label>`).join('')}</fieldset>`;
  }

  function resultPart(){
    if (st.mode === 'kit') {
      const list = /** @type {NonNullable<ReturnType<typeof kitFor>>[]} */ (groups().map(kitFor).filter(Boolean));
      if (!list.length) return `<p class="care-note">Choose the plants above to see their kits.</p>`;
      return `<ul class="care-kits">${list.map(k => `
        <li class="care-kit">
          <h3>${esc(k.name)}</h3>
          <p class="care-note">${esc(GROUP_NOTE[k.element])}</p>
          <ul class="care-contents">${k.contents.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
          <p class="care-price">${k.price ? rupees(k.price) : 'On enquiry'}</p>
          <button type="button" class="cta cta-small" data-add-line='${attr({ kind: 'product', sku: k.sku })}'>Add kit to cart</button>
        </li>`).join('')}</ul>
        <p class="care-note">The studio confirms what goes in each kit before it's sent.</p>`;
    }
    const p = plan(), price = planPrice(p);
    return `
      <p class="care-summary" aria-live="polite">${esc(planSummary(p))}</p>
      <p class="care-price">${price ? rupees(price) : 'On enquiry'}</p>
      <button type="button" class="cta" data-add-line='${attr({ kind: 'care', code: encodePlan(p) })}'>Add visits to cart</button>
      <p class="care-note">Nothing is charged here. The studio confirms dates and the price, then sends a payment link.</p>`;
  }

  const draw = { ref: () => { $('#careRef').innerHTML = refPart(); }, groups: () => { $('#careGroups').innerHTML = groupsPart(); },
    result: () => { $('#careResult').innerHTML = resultPart(); } };
  const sync = () => {
    $('#careVisitOpts').hidden = st.mode !== 'visits';
    $('#careFreq').hidden = st.d === 'once';
  };

  root.innerHTML = `
    <fieldset class="care-step"><legend><span class="care-num">01</span> What should we look after?</legend>
      ${subjects.map(s => `<label class="care-choice"><input type="radio" name="s" value="${s.id}"${s.id === st.s ? ' checked' : ''}>
        <span>${esc(s.label)}</span><small>${esc(s.note)}</small></label>`).join('')}
      <div id="careRef"></div>
      <div id="careGroups"></div>
    </fieldset>
    <fieldset class="care-step"><legend><span class="care-num">02</span> How would you like to care for it?</legend>
      <label class="care-choice"><input type="radio" name="mode" value="kit"${st.mode === 'kit' ? ' checked' : ''}>
        <span>${icon('package')} A refill kit</span><small>Soil, feed and tools matched to your plants. You do the care.</small></label>
      <label class="care-choice"><input type="radio" name="mode" value="visits"${st.mode === 'visits' ? ' checked' : ''}>
        <span>${icon('calendar-clock')} Visits from the studio</span><small>We come to you in Mumbai and look after it.</small></label>
      <div id="careVisitOpts" class="care-visit-opts">
        <fieldset class="care-row"><legend>For how long?</legend>
          ${visit.durations.map(d => `<label class="care-pill"><input type="radio" name="d" value="${d.id}"${d.id === st.d ? ' checked' : ''}><span>${d.label}</span></label>`).join('')}</fieldset>
        <fieldset class="care-row" id="careFreq"><legend>How often?</legend>
          ${visit.frequencies.map(f => `<label class="care-pill"><input type="radio" name="f" value="${f.id}"${f.id === st.f ? ' checked' : ''}><span>${f.label}</span></label>`).join('')}</fieldset>
        <label class="care-field"><span>${icon('map-pin', { size: 'xs' })} Pincode</span>
          <input type="text" name="p" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" autocomplete="postal-code" value="${esc(st.p)}" aria-describedby="carePinNote"></label>
        <p class="care-note" id="carePinNote" aria-live="polite">${pinNote(st.p)}</p>
        <ul class="care-includes">${visit.includes.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      </div>
    </fieldset>
    <div class="care-step care-result" id="careResult"></div>`;
  draw.ref(); draw.groups(); draw.result(); sync();

  root.addEventListener('change', (e) => {
    const { name, value } = /** @type {HTMLInputElement | HTMLSelectElement} */ (e.target);
    // Text fields update on 'input'. Their 'change' fires on blur, i.e. as the
    // visitor presses "Add visits to cart"; redrawing then swapped the button
    // out from under the click and nothing was added.
    if (name === 'n' || name === 'p') return;
    if (name === 's' || name === 'r') { blocked = ''; root.querySelector('[data-care-blocked]')?.remove(); }   // they chose: the notice has done its job
    if (name === 's') { st.s = value; st.g = []; if (value === 'piece') st.r = OWNABLE[0]?.sku || ''; draw.ref(); draw.groups(); }
    else if (name === 'r') { st.r = value; st.g = []; draw.groups(); }
    else if (name === 'g') st.g = [.../** @type {NodeListOf<HTMLInputElement>} */ (root.querySelectorAll('input[name=g]:checked'))].map(i => i.value);
    else if (name === 'mode') { st.mode = value; draw.groups(); }
    else if (name === 'd') st.d = value;
    else if (name === 'f') st.f = value;
    sync(); draw.result();
  });
  root.addEventListener('input', (e) => {
    const input = /** @type {HTMLInputElement} */ (e.target);
    if (input.name === 'n') st.n = Math.min(500, Math.max(1, parseInt(input.value, 10) || 1));
    else if (input.name === 'p') { st.p = /^\d{6}$/.test(input.value) ? input.value : ''; $('#carePinNote').textContent = pinNote(st.p); }
    else return;
    draw.result();
  });

  // Business form: options from data, then fold its fields into the message
  // the shared handler sends.
  const biz = /** @type {HTMLFormElement | null} */ (document.getElementById('careBusiness'));
  /** @param {string[]} list */
  const opts = (list) => list.map(v => `<option>${esc(v)}</option>`).join('');
  if (biz) {
    /** @type {HTMLElement} */ (biz.querySelector('#careSite')).innerHTML = opts(businessSites);
    /** @type {HTMLElement} */ (biz.querySelector('#careOften')).innerHTML = opts([...visit.frequencies.map(f => f.label), 'Not sure yet']);
  }
  biz?.addEventListener('submit', () => {
    // Every field in this form is a text control that is always present (no file inputs).
    const f = /** @type {Record<'company' | 'site' | 'size' | 'often' | 'pin' | 'note', string>} */ (Object.fromEntries(new FormData(biz)));
    /** @type {HTMLInputElement} */ (biz.querySelector('[name=message]')).value = [
      'Business care enquiry',
      `Company: ${f.company}`, `Site: ${f.site}`, `Plants or sites: ${f.size}`, `Visits wanted: ${f.often}`, `Pincode: ${f.pin}`,
      f.note ? `\n${f.note}` : ''
    ].join('\n').trim();
  }, true);   // capture: runs before enquiry-form.js reads the form
}
