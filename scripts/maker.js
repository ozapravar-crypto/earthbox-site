// ─────────────────────────────────────────────────────────────────────
// maker.js · Terrarium Maker (maker.html)
//
// One `build` object is the single source of truth. Every change goes
// through commit(), which saves it, then re-renders the steps, preview,
// panel and bar from scratch. Nothing keeps its own copy of the state.
//
// The pure rules (compatibility, capacity, chamber swap, enquiry text,
// share-link codec) are exported and checked by maker.test.mjs.
//
// There is no cart on this site. The last step sends the design as an
// enquiry: WhatsApp deep link + the desktop email form (enquiry-form.js).
// ─────────────────────────────────────────────────────────────────────

import { chambers, plants, substrates, elements, recipes,
         chamberElements, SOILLESS, spaceQuestions } from '../data/maker.js';
import { enquiryAltHTML, ENQUIRY_PHONE } from './enquiry-form.js';

export const STAGES = ['start', 'chamber', 'foundation', 'plants', 'space', 'review'];
const STEPS = ['chamber', 'foundation', 'plants', 'space'];   // the numbered ones
const LABEL = { chamber: 'Chamber', foundation: 'Foundation', plants: 'Plants', space: 'Your space', review: 'Review' };
const STORE = 'earthbox-maker';
const SITE = 'https://www.earthbox.in';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));
const find = (list, id, key = 'id') => list.find(x => x[key] === id);


// ═══ RULES (pure) ═════════════════════════════════════════════════════

export const emptyBuild = () => ({
  name: '', chamber: null, substrate: null, plants: [],
  space: { room: '', household: [], maturity: '', note: '' }
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

// Is a stage's required choice made?
export function done(b, stage){
  if (stage === 'chamber')    return !!b.chamber;
  if (stage === 'foundation') return isSoilless(b.chamber) || !!b.substrate;
  if (stage === 'plants')     return b.plants.length > 0 || suitedElements(b.chamber).length === 0;
  return true;
}
export const canEnter = (b, stage) =>
  STAGES.slice(1, STAGES.indexOf(stage)).every(s => done(b, s));
export const furthest = (b) => [...STAGES].reverse().find(s => canEnter(b, s));

// Switching chamber keeps every choice that still fits, and reports the rest.
export function swapChamber(b, sku){
  const ch = find(chambers, sku, 'sku');
  const keep = b.plants.filter(id => isSuited(plantOf(id), sku)).slice(0, capacity(ch));
  const subOk = substrateSuits(find(substrates, b.substrate), sku);
  return {
    build: { ...b, chamber: sku, plants: keep, substrate: subOk ? b.substrate : null },
    removed: b.plants.filter(id => !keep.includes(id)).map(id => plantOf(id).name),
    clearedSubstrate: !!b.substrate && !subOk
  };
}

// Add or remove one plant. Returns { build } or { error }.
export function togglePlant(b, id){
  if (b.plants.includes(id)) return { build: { ...b, plants: b.plants.filter(p => p !== id) } };
  const p = plantOf(id), ch = chamberOf(b);
  if (!p || !ch) return { error: 'Choose a chamber first.' };
  if (!isSuited(p, ch.sku)) return { error: `${p.name} needs a ${p.element} chamber’s climate.` };
  if (b.plants.length >= capacity(ch)) return { error: `The ${ch.name} chamber holds ${capacity(ch)} plants. Remove one to add another.` };
  return { build: { ...b, plants: [...b.plants, id] } };
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

export const shareUrl = (b) => `${SITE}/maker.html#${encodeBuild(b)}`;

export function enquiryText(b){
  const ch = chamberOf(b), sub = find(substrates, b.substrate), s = b.space;
  const names = b.plants.map(id => plantOf(id).name);
  const line = (label, v) => (v ? `${label}: ${v}` : null);
  return [
    'Hi Aayush, I designed a terrarium in the EarthBox Maker.',
    '',
    b.name ? `“${b.name}”` : null,
    `Chamber: ${ch.name} (${ch.price})`,
    `Foundation: ${isSoilless(ch.sku) ? 'none, soil-free chamber' : sub ? sub.name : 'not chosen'}`,
    `Plants (${names.length}): ${names.join(', ') || 'studio to choose'}`,
    line('Lives in', s.room),
    line('Household', s.household.join(', ')),
    line('Maturity', s.maturity.split(' —')[0]),
    line('Note', s.note.trim()),
    '',
    `Design: ${shareUrl(b)}`,
    '',
    'Could you share a quote and lead time?'
  ].filter(x => x !== null).join('\n');
}

export const whatsappHref = (b) =>
  `https://wa.me/${ENQUIRY_PHONE}?text=${encodeURIComponent(enquiryText(b))}`;


// ═══ PREVIEW (SVG) ════════════════════════════════════════════════════
// Same chamber geometry as every assets/boxes/*.svg drawing, so the box's
// own drawing slots in as the atmosphere and scale never jumps on a swap.
// Plants are line-drawn forms, spaced evenly: the preview is indicative,
// and says so — the studio places every specimen by hand.

const OUTER = 'M 282 131 L 463 131 L 493 161 L 493 585 L 463 615 L 282 615 L 252 585 L 252 161 Z';
const INNER = 'M 287 144 L 459 144 L 480 165 L 480 581 L 459 602 L 287 602 L 265 581 L 265 165 Z';

// Tiny deterministic random so pebbles don't reshuffle on every render.
const rng = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

function fernFrond(x2, y2, sign){
  let d = `M0 0 Q${x2 / 2 + sign * 6} ${y2 / 2} ${x2} ${y2}`;
  for (let t = .2; t < .95; t += .12){
    const x = x2 * t, y = y2 * t, len = 12 * (1 - t) + 3;
    d += ` M${x} ${y} l${-len} ${-len * .45} M${x} ${y} l${len} ${-len * .45}`;
  }
  return `<path class="st fern" d="${d}"/>`;
}

const GLYPH = {
  leaf: `<path class="st" d="M0 0 Q-3 -24 -14 -42 M0 0 Q3 -32 11 -58 M0 0 Q1 -16 5 -28"/>
    <ellipse class="lf" cx="-20" cy="-50" rx="9" ry="14" transform="rotate(-38 -20 -50)"/>
    <ellipse class="lf" cx="15" cy="-68" rx="10" ry="15" transform="rotate(22 15 -68)"/>
    <ellipse class="lf" cx="9" cy="-34" rx="7" ry="10" transform="rotate(40 9 -34)"/>`,
  trail: `<path class="st" d="M0 0 Q-4 -26 -18 -30 Q-30 -32 -32 -6 M0 0 Q6 -22 20 -20 Q31 -18 30 4 M0 0 Q0 -12 -2 -22"/>
    ${[[-12,-29],[-24,-29],[-31,-19],[-32,-8],[13,-21],[24,-17],[29,-7],[30,3],[-2,-24]]
      .map(([x, y]) => `<circle class="lf" cx="${x}" cy="${y}" r="4.2"/>`).join('')}`,
  rosette: [-70, -35, 0, 35, 70].map(a => `<ellipse class="lf ro" cx="0" cy="-14" rx="5.5" ry="13" transform="rotate(${a} 0 -2)"/>`).join('')
    + [-25, 25].map(a => `<ellipse class="lf ro in" cx="0" cy="-12" rx="4" ry="9" transform="rotate(${a} 0 -2)"/>`).join(''),
  air: `<path class="st air" d="M0 0 Q-14 -14 -22 -34 M0 0 Q-6 -20 -8 -42 M0 0 Q4 -22 6 -44 M0 0 Q12 -16 22 -32 M0 0 Q-18 -6 -27 -14 M0 0 Q18 -6 27 -16"/>`,
  fern: fernFrond(-6, -62, 1) + fernFrond(22, -46, -1) + fernFrond(-24, -40, 1),
  moss: `<path class="moss" d="M-24 0 Q-25 -12 -14 -13 Q-10 -23 0 -18 Q8 -26 15 -15 Q26 -14 24 0 Z"/>
    ${[[-14,-8],[-4,-12],[6,-9],[14,-6],[0,-4]].map(([x, y]) => `<circle class="moss-dot" cx="${x}" cy="${y}" r="1.4"/>`).join('')}`,
  trap: [[-11, 44], [1, 58], [12, 38]].map(([x, h]) =>
    `<path class="trap" d="M${x - 2} 0 Q${x - 3} ${-h * .55} ${x - 6} ${-h} L${x + 5} ${-h} Q${x + 3} ${-h * .55} ${x + 2} 0 Z"/>
     <ellipse class="trap hood" cx="${x}" cy="${-h - 1}" rx="7" ry="3.2"/>`).join('')
};

function bands(look){
  const r = rng(look === 'aroid' ? 7 : 3), top = look === 'aroid' ? 540 : 548;
  const dots = (n, y0, y1, cls, rad) => Array.from({ length: n }, () =>
    `<circle class="${cls}" cx="${(265 + r() * 215).toFixed(1)}" cy="${(y0 + r() * (y1 - y0)).toFixed(1)}" r="${rad}"/>`).join('');
  return `<g class="mk-bands">
    <rect class="b-drain" x="250" y="582" width="250" height="40"/>${dots(26, 584, 600, 'b-pebble', 2.6)}
    <rect class="b-char" x="250" y="574" width="250" height="8"/>
    <path class="b-soil ${look}" d="M250 ${top} Q310 ${top - 5} 372 ${top} T500 ${top} V574 H250 Z"/>
    ${look === 'aroid' ? dots(34, top + 4, 572, 'b-bark', 1.8) + dots(22, top + 4, 572, 'b-perlite', 1.1) : dots(18, top + 6, 572, 'b-grain', 1)}
  </g>`;
}

let clipSeq = 0;
export function previewSVG(b, { fresh = null, label = '' } = {}){
  const ch = chamberOf(b);
  const sub = find(substrates, b.substrate);
  const soilless = ch && isSoilless(ch.sku);
  const base = soilless ? 430 : sub ? (sub.look === 'aroid' ? 542 : 550) : 590;
  const n = b.plants.length;
  const scale = n <= 3 ? 1.15 : n <= 5 ? 1 : .82;
  // Back row (odd) first so the front row overlaps it.
  const order = b.plants.map((id, i) => ({ id, i })).sort((a, c) => (c.i % 2) - (a.i % 2));
  const plantsSVG = order.map(({ id, i }) => {
    const p = plantOf(id);
    const x = 272 + (i + .5) * (202 / n);
    const y = base - (i % 2 ? 7 : 0);
    const s = scale * (i % 2 ? .88 : 1);
    // Outer <g> places, inner <g> animates: a CSS transform would replace the attribute one.
    return `<g transform="translate(${x.toFixed(1)} ${y}) scale(${s})"><g class="mk-plant${id === fresh ? ' is-new' : ''}">${GLYPH[p.form]}</g></g>`;
  }).join('');

  // Unique per render: a clipPath inside a hidden duplicate (landing recipes) stops clipping.
  const clip = `mkClip${++clipSeq}`;
  return `<svg class="mk-svg" viewBox="240 120 266 506" role="img" aria-label="${esc(label)}">
    <defs><clipPath id="${clip}"><path d="${INNER}"/></clipPath></defs>
    ${ch?.illustration ? `<image class="mk-atmos${sub || n ? ' is-dim' : ''}" href="assets/boxes/${ch.illustration}" x="0" y="0" width="746" height="746"/>` : ''}
    <g clip-path="url(#${clip})">
      ${sub ? bands(sub.look) : ''}
      ${soilless ? `<line class="mk-rod" x1="265" x2="480" y1="${base}" y2="${base}"/>` : ''}
      ${plantsSVG}
    </g>
    <path class="mk-frame outer" d="${OUTER}"/>
    <path class="mk-frame${ch ? '' : ' is-empty'}" d="${INNER}"/>
  </svg>`;
}

const glyphThumb = (p) =>
  `<svg class="mk-thumb" viewBox="-36 -86 72 92" aria-hidden="true"><g class="mk-plant">${GLYPH[p.form]}</g></svg>`;


// ═══ VIEW ═════════════════════════════════════════════════════════════

const arrow = '<svg viewBox="0 0 16 8" fill="none" aria-hidden="true"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>';
const climate = (ch) => `${ch.temp} · ${ch.humidity} humidity`;

function describe(b){
  const ch = chamberOf(b);
  if (!ch) return 'Empty chamber. Choose a chamber to begin.';
  const names = b.plants.map(id => plantOf(id).name);
  const sub = find(substrates, b.substrate);
  return `${ch.name} chamber${sub ? `, ${sub.name} foundation` : ''}${names.length ? `, with ${names.join(', ')}` : ', no plants yet'}.`;
}

function stepsHTML(b, stage){
  return `<ol class="mk-steps-list">${[...STEPS, 'review'].map((s, i) => {
    const open = canEnter(b, s);
    const now = s === stage;
    const tick = s !== 'review' && done(b, s) && STAGES.indexOf(s) < STAGES.indexOf(stage);
    return `<li><button type="button" class="mk-step${now ? ' is-current' : ''}${tick ? ' is-done' : ''}"
      data-act="goto" data-to="${s}" data-key="step-${s}" ${now ? 'aria-current="step"' : ''} ${open ? '' : 'disabled'}>
      <span class="mk-step-n">${s === 'review' ? '✓' : String(i + 1).padStart(2, '0')}</span><span class="mk-step-label">${LABEL[s]}</span>
      ${tick ? '<span class="u-sr-only">(done)</span>' : ''}</button></li>`;
  }).join('')}</ol>
  <p class="mk-steps-compact caption">${stage === 'review' ? 'Review' : `Step ${STEPS.indexOf(stage) + 1} of 4`}</p>`;
}

function head(title, line){
  return `<header class="mk-panel-head"><h2 class="mk-title" tabindex="-1">${title}</h2>${line ? `<p class="mk-line">${line}</p>` : ''}</header>`;
}

function chamberPanel(b){
  return head('Choose a chamber', 'Ten climates. The chamber decides which plants can live inside.')
  + `<p class="mk-note">Elemental chambers are in production. Your design is sent as an enquiry, and we confirm availability and the quote with you.</p>
  <div class="mk-cards">${chambers.map(ch => {
    const on = b.chamber === ch.sku;
    const n = suitedElements(ch.sku).length;
    return `<button type="button" class="mk-card mk-chamber${on ? ' is-on' : ''}" data-act="chamber" data-id="${ch.sku}"
      data-key="ch-${ch.sku}" aria-pressed="${on}">
      <span class="mk-card-img"><img src="assets/boxes/${ch.photo.replace('.webp', '-300.webp')}" alt="" loading="lazy" width="300" height="240"
        onerror="this.parentNode.classList.add('is-missing');this.remove()"></span>
      <span class="mk-card-body">
        <span class="mk-card-name">${ch.name}${ch.edition !== 'Standard' ? ` <span class="mk-tag">${ch.edition}</span>` : ''}</span>
        <span class="mk-card-desc">${ch.tagline}</span>
        <span class="mk-card-meta">${climate(ch)}</span>
        <span class="mk-card-meta">${n === 0 ? 'Mushroom cultures' : n === 9 ? 'Any plant group' : `${chamberElements[ch.sku][0]} plants · up to ${capacity(ch)}`}</span>
        <span class="mk-card-price">${ch.price}</span>
      </span>
      <span class="mk-check" aria-hidden="true">${on ? 'Selected' : 'Choose'}</span>
    </button>`;
  }).join('')}</div>`;
}

function swatch(look){
  return `<svg class="mk-swatch" viewBox="250 530 250 80" aria-hidden="true">${bands(look)}</svg>`;
}

function foundationPanel(b){
  const ch = chamberOf(b);
  if (isSoilless(ch.sku)) return head('Foundation', '')
    + `<div class="mk-empty"><p>The ${ch.name} chamber is soil-free: plants grow in air, fed by mist.</p><p>Nothing to choose here.</p></div>`;
  return head('Build the foundation', 'The layers your plants root into.')
  + `<div class="mk-list">${substrates.map(s => {
    const ok = substrateSuits(s, ch.sku), on = b.substrate === s.id;
    return `<button type="button" class="mk-card mk-row${on ? ' is-on' : ''}" data-act="substrate" data-id="${s.id}"
      data-key="sub-${s.id}" aria-pressed="${on}" ${ok ? '' : 'disabled aria-describedby="why-' + s.id + '"'}>
      ${swatch(s.look)}
      <span class="mk-card-body">
        <span class="mk-card-name">${s.name}</span>
        <span class="mk-card-desc">${s.note}</span>
        ${ok ? '<span class="mk-card-price">Quoted on enquiry</span>'
             : `<span class="mk-why" id="why-${s.id}">Suits ${s.suits.join(', ')} plants, not the ${ch.name} chamber.</span>`}
      </span>
      <span class="mk-check" aria-hidden="true">${on ? 'Selected' : ok ? 'Choose' : 'Unsuited'}</span>
    </button>`;
  }).join('')}</div>`;
}

function plantRow(b, p, ch){
  const on = b.plants.includes(p.id);
  const ok = isSuited(p, ch.sku);
  const full = !on && b.plants.length >= capacity(ch);
  const el = find(elements, p.element);
  return `<li class="mk-plant-row${on ? ' is-on' : ''}${ok ? '' : ' is-off'}">
    ${glyphThumb(p)}
    <span class="mk-card-body">
      <span class="mk-card-name">${esc(p.name)}</span>
      <span class="mk-card-desc">${p.element} · ${el.focus}</span>
      ${ok ? '' : `<span class="mk-why">Needs a ${p.element} chamber’s climate</span>`}
    </span>
    ${ok ? `<button type="button" class="mk-add${on ? ' is-on' : ''}" data-act="plant" data-id="${p.id}" data-key="pl-${p.id}"
      aria-pressed="${on}" ${full ? 'disabled' : ''} aria-label="${on ? 'Remove' : 'Add'} ${esc(p.name)}">
      ${on ? 'Added ✓' : full ? 'Full' : 'Add'}</button>` : ''}
  </li>`;
}

function plantsPanel(b, ui){
  const ch = chamberOf(b);
  const suited = suitedElements(ch.sku);
  if (!suited.length) return head('Plants', '')
    + `<div class="mk-empty"><p>The ${ch.name} chamber grows mushroom cultures, which aren’t on our plant list.</p>
       <p>The studio chooses the strain with you. Continue to tell us about your space.</p></div>`;

  const max = capacity(ch);
  const many = suited.length > 1;   // Lab: filter by group instead of one long list
  const shown = plants.filter(p => suited.includes(p.element) && (!many || ui.filter === 'All' || p.element === ui.filter));
  const others = plants.filter(p => !suited.includes(p.element));

  return head('Add plants', `Chosen for the ${ch.name} chamber’s climate.`)
  + `<p class="mk-count" aria-live="polite"><strong>${b.plants.length}</strong> of ${max} plants${b.plants.length >= max ? ' · chamber full' : ''}</p>
  ${b.plants.length ? `<ul class="mk-tray" aria-label="Selected plants">${b.plants.map(id => `<li>
      <span>${esc(plantOf(id).name)}</span>
      <button type="button" data-act="plant" data-id="${id}" data-key="tray-${id}" aria-label="Remove ${esc(plantOf(id).name)}">×</button></li>`).join('')}</ul>` : ''}
  ${many ? `<div class="mk-filter" role="group" aria-label="Plant group">${['All', ...suited].map(f =>
      `<button type="button" class="selector-chip${ui.filter === f ? ' active' : ''}" data-act="filter" data-id="${f}"
        data-key="f-${f}" aria-pressed="${ui.filter === f}">${f}</button>`).join('')}</div>` : ''}
  <ul class="mk-plants">${shown.map(p => plantRow(b, p, ch)).join('')}</ul>
  ${others.length ? `<details class="mk-more"><summary>View all plants (${others.length} for other climates)</summary>
     <ul class="mk-plants">${others.map(p => plantRow(b, p, ch)).join('')}</ul></details>` : ''}`;
}

function choice(name, value, type, checked){
  return `<label class="mk-choice"><input type="${type}" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}>
    <span>${esc(value.split(' —')[0])}</span></label>`;
}

function spacePanel(b){
  const s = b.space;
  return head('Your space', 'Optional. It helps us quote, and choose species that are safe where it lives.')
  + `<form class="mk-space" onsubmit="return false">
    <fieldset><legend>Where will it live?</legend>
      <div class="mk-choices">${spaceQuestions.room.map(v => choice('room', v, 'radio', s.room === v)).join('')}</div></fieldset>
    <fieldset><legend>Who else lives there?</legend>
      <div class="mk-choices">${spaceQuestions.household.map(v => choice('household', v, 'checkbox', s.household.includes(v))).join('')}</div></fieldset>
    <fieldset><legend>How grown should it arrive?</legend>
      <div class="mk-choices mk-choices-wide">${spaceQuestions.maturity.map(v =>
        `<label class="mk-choice"><input type="radio" name="maturity" value="${esc(v)}" ${s.maturity === v ? 'checked' : ''}><span>${esc(v)}</span></label>`).join('')}</div></fieldset>
    <label class="mk-field"><span>A mood or story, if you have one</span>
      <textarea name="note" rows="3" maxlength="400" placeholder="“A misted Himalayan dawn”">${esc(s.note)}</textarea></label>
  </form>`;
}

function reviewPanel(b){
  const ch = chamberOf(b), sub = find(substrates, b.substrate), s = b.space;
  const group = (title, stage, body) => `<section class="mk-group">
    <header><h3 class="caption">${title}</h3><button type="button" class="mk-edit" data-act="goto" data-to="${stage}" data-key="edit-${stage}">Edit<span class="u-sr-only"> ${title}</span></button></header>${body}</section>`;
  const spaceBits = [s.room, s.household.join(', '), s.maturity.split(' —')[0], s.note && `“${s.note}”`].filter(Boolean).map(esc);
  return head('Your world', '')
  + `<label class="mk-field mk-name"><span>Name it</span>
      <input type="text" name="name" maxlength="60" value="${esc(b.name)}" placeholder="Untitled world" autocomplete="off"></label>
  ${group('Chamber', 'chamber', `<p class="mk-item"><span>${ch.name}</span><span>${ch.price}</span></p>
      <p class="mk-sub">${climate(ch)} · lead time ${ch.lead}</p>`)}
  ${group('Foundation', 'foundation', `<p class="mk-item"><span>${isSoilless(ch.sku) ? 'None, soil-free' : sub.name}</span><span>${isSoilless(ch.sku) ? '—' : 'On enquiry'}</span></p>`)}
  ${group('Plants', 'plants', b.plants.length ? `<ul class="mk-items">${b.plants.map(id => `<li class="mk-item">
      <span>${esc(plantOf(id).name)}</span><span>On enquiry
      <button type="button" class="mk-x" data-act="plant" data-id="${id}" data-key="rv-${id}" aria-label="Remove ${esc(plantOf(id).name)}">×</button></span></li>`).join('')}</ul>`
      : '<p class="mk-sub">The studio chooses with you.</p>')}
  ${group('Your space', 'space', `<p class="mk-sub">${spaceBits.length ? spaceBits.join(' · ') : 'Not given'}</p>`)}
  <div class="mk-total">
    <p class="mk-item"><span>Estimate</span><span>From ${ch.price.split(' – ')[0]}</span></p>
    <p class="mk-sub">Chamber range ${ch.price}. Plants and foundation are quoted with you. Nothing is charged on this page.</p>
  </div>
  <div class="mk-send">
    <a class="cta cta-block" href="${whatsappHref(b)}" target="_blank" rel="noopener" data-act="send" data-key="send">Send this design on WhatsApp ${arrow}</a>
    ${enquiryAltHTML(b.name || `Maker · ${ch.name}`, enquiryText(b))}
    <p class="mk-sent" role="status"></p>
    <div class="mk-secondary">
      <button type="button" class="cta cta-secondary cta-small" data-act="copy" data-key="copy">Copy design link</button>
      <button type="button" class="cta cta-secondary cta-small" data-act="reset" data-key="reset">Start over</button>
    </div>
    <p class="mk-copied" role="status"></p>
  </div>`;
}

const NEXT = { chamber: 'Continue', foundation: 'Continue to plants', plants: 'Continue', space: 'Review design' };
const NEED = { chamber: 'Choose a chamber to continue.', foundation: 'Choose a foundation to continue.', plants: 'Add at least one plant to continue.' };

function barHTML(b, stage, error){
  const ch = chamberOf(b);
  const sum = ch ? `<strong>${ch.name}</strong> · ${ch.price}${b.plants.length ? ` · ${b.plants.length} plant${b.plants.length > 1 ? 's' : ''}` : ''}`
                 : 'Nothing chosen yet';
  return `<p class="mk-sum">${sum}</p>
    ${error ? `<p class="mk-error" role="alert">${error}</p>` : ''}
    <div class="mk-nav">
      <button type="button" class="cta cta-secondary" data-act="back" data-key="back">Back</button>
      ${stage === 'review' ? '' : `<button type="button" class="cta" data-act="next" data-key="next">${NEXT[stage]} ${arrow}</button>`}
    </div>`;
}


// ═══ CONTROLLER ═══════════════════════════════════════════════════════

const track = (name, params = {}) => { if (typeof gtag === 'function') gtag('event', name, params); };

function load(){
  const fromHash = location.hash.length > 3 ? decodeBuild(location.hash) : null;
  if (fromHash) return { build: fromHash, shared: true };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    const b = saved && decodeBuild(saved.code);
    if (b) return { build: { ...b, space: { ...emptyBuild().space, ...saved.space } } };
  } catch { /* private mode / corrupt — start clean */ }
  return null;
}

export function initMaker(){
  const root = document.getElementById('maker');
  if (!root) return;

  const $ = (id) => document.getElementById(id);
  const start = $('mkStart'), build = $('mkBuild');
  const restored = load();
  let b = restored?.build || emptyBuild();
  let stage = 'start';
  let ui = { filter: 'All', fresh: null, error: '', notice: null };

  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ code: encodeBuild(b), space: b.space })); } catch {}
  };

  function render(){
    const key = document.activeElement?.dataset?.key;
    root.dataset.stage = stage;
    start.hidden = stage !== 'start';
    build.hidden = stage === 'start';

    if (stage === 'start'){ renderStart(); return; }

    $('mkSteps').innerHTML = stepsHTML(b, stage);
    const ch = chamberOf(b);
    $('mkPreview').innerHTML = previewSVG(b, { fresh: ui.fresh, label: describe(b) })
      + `<figcaption class="caption">${ch ? `${ch.name} · indicative. The studio places every specimen by hand.` : 'Choose a chamber to begin'}</figcaption>`;
    const panel = { chamber: chamberPanel, foundation: foundationPanel, plants: plantsPanel, space: spacePanel, review: reviewPanel }[stage];
    const notice = ui.notice ? `<div class="mk-notice" role="status"><p>${ui.notice.text}</p>
      ${ui.notice.undo ? '<button type="button" class="cta cta-secondary cta-small" data-act="undo" data-key="undo">Undo</button>' : ''}</div>` : '';
    $('mkPanelBody').innerHTML = notice + panel(b, ui);
    $('mkBar').innerHTML = barHTML(b, stage, ui.error);
    ui.fresh = null;

    if (key) document.querySelector(`[data-key="${key}"]:not([disabled])`)?.focus({ preventScroll: true });
  }

  function renderStart(){
    $('mkResume').hidden = !b.chamber;
    $('mkBegin').hidden = !!b.chamber;
    $('mkRecipes').innerHTML = recipes.map(r => {
      const rb = { ...emptyBuild(), chamber: r.chamber, substrate: r.substrate, plants: r.plants };
      return `<li><button type="button" class="mk-recipe" data-act="recipe" data-id="${r.id}" data-key="rc-${r.id}">
        <span class="mk-recipe-art">${previewSVG(rb, { label: describe(rb) })}</span>
        <span class="mk-card-name">${r.name}</span>
        <span class="mk-card-desc">${r.line}</span>
        <span class="mk-card-meta">${chamberOf(rb).name} chamber · ${r.plants.length} plants</span>
      </button></li>`;
    }).join('');
    const hero = recipes[0];
    $('mkHeroArt').innerHTML = previewSVG(
      { ...emptyBuild(), chamber: hero.chamber, substrate: hero.substrate, plants: hero.plants },
      { label: 'A finished Moss chamber with three mosses' });
  }

  // Every state change goes through here.
  function commit(next, opts = {}){
    b = next;
    ui.error = '';
    ui.notice = opts.notice ?? null;
    if (opts.stage) stage = opts.stage;
    if (opts.fresh) ui.fresh = opts.fresh;
    save();
    render();
    if (opts.stage) root.querySelector('.mk-title')?.focus({ preventScroll: true });
    if (opts.stage) window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  const go = (to) => commit(b, { stage: to });

  function pickChamber(sku){
    if (b.chamber === sku) return;
    const before = b;
    const { build: nb, removed, clearedSubstrate } = swapChamber(b, sku);
    const bits = [];
    if (removed.length) bits.push(`Removed ${removed.join(', ')}: ${removed.length > 1 ? 'they don’t' : 'it doesn’t'} fit the ${chamberOf(nb).name} chamber.`);
    if (clearedSubstrate) bits.push(`Foundation cleared: it doesn’t suit the ${chamberOf(nb).name} chamber.`);
    commit(nb, { notice: bits.length ? { text: bits.join(' '), undo: before } : null });
  }

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const { act, id, to } = el.dataset;

    if (act === 'start')   { track('maker_start'); commit(b, { stage: 'chamber' }); }
    if (act === 'resume')  { commit(b, { stage: furthest(b) }); }
    if (act === 'fresh')   { commit(emptyBuild(), { stage: 'chamber' }); }
    if (act === 'recipe')  {
      const r = find(recipes, id);
      track('maker_recipe', { recipe: id });
      commit({ ...emptyBuild(), name: r.name, chamber: r.chamber, substrate: r.substrate, plants: [...r.plants] }, { stage: 'plants' });
    }
    if (act === 'goto' && canEnter(b, to)) go(to);
    if (act === 'chamber')   pickChamber(id);
    if (act === 'substrate') commit({ ...b, substrate: id });
    if (act === 'filter')    { ui.filter = id; render(); }
    if (act === 'plant') {
      const res = togglePlant(b, id);
      if (res.error) { ui.error = res.error; render(); }
      else commit(res.build, { fresh: res.build.plants.includes(id) ? id : null });
    }
    if (act === 'undo' && ui.notice?.undo) commit(ui.notice.undo);
    if (act === 'back')  go(STAGES[STAGES.indexOf(stage) - 1]);
    if (act === 'next') {
      if (!done(b, stage)) { ui.error = NEED[stage]; render(); return; }
      go(STAGES[STAGES.indexOf(stage) + 1]);
    }
    if (act === 'send') {
      track('maker_send', { method: 'whatsapp', chamber: b.chamber, plants: b.plants.length });
      root.querySelector('.mk-sent').textContent = 'WhatsApp opened with your design. It is sent once you press send there.';
    }
    if (act === 'copy') copyLink();
    if (act === 'reset' && confirm('Start over? This clears your design.')) {
      history.replaceState(null, '', location.pathname);
      commit(emptyBuild(), { stage: 'start' });
    }
  });

  async function copyLink(){
    const url = shareUrl(b);
    const out = root.querySelector('.mk-copied');
    try {
      await navigator.clipboard.writeText(url);
      out.textContent = 'Link copied. Anyone with it can open this design.';
      track('maker_copy_link');
    } catch {
      out.innerHTML = `Copy this link: <input class="input" readonly value="${esc(url)}" onfocus="this.select()">`;
    }
  }

  // "Your space" + name: plain inputs, saved as typed.
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'name') { b = { ...b, name: t.value.slice(0, 60) }; save(); refreshSend(); return; }
    if (!t.closest('.mk-space')) return;
    const s = { ...b.space };
    if (t.name === 'room' || t.name === 'maturity') s[t.name] = t.value;
    if (t.name === 'note') s.note = t.value;
    if (t.name === 'household') {
      s.household = [...t.form.querySelectorAll('[name=household]:checked')].map(x => x.value);
      // "Neither" and the others are mutually exclusive.
      if (t.checked) s.household = t.value === 'Neither' ? ['Neither'] : s.household.filter(v => v !== 'Neither');
      t.form.querySelectorAll('[name=household]').forEach(x => { x.checked = s.household.includes(x.value); });
    }
    b = { ...b, space: s };
    save();   // no re-render: keeps the caret where it is
  });

  // Keep the WhatsApp text and email prefill in step with the name field.
  function refreshSend(){
    const a = root.querySelector('[data-act="send"]');
    if (a) a.href = whatsappHref(b);
    const msg = root.querySelector('.enquiry-form textarea[name="message"]');
    if (msg) msg.value = enquiryText(b);
  }

  // Desktop email route: log it like the WhatsApp send.
  root.addEventListener('submit', (e) => {
    if (e.target.closest('.enquiry-form')) track('maker_send', { method: 'form', chamber: b.chamber, plants: b.plants.length });
  });

  // Entry from a box page: maker.html?box=FireBox
  const boxParam = new URLSearchParams(location.search).get('box');
  if (boxParam && find(chambers, boxParam, 'sku')) {
    stage = 'chamber';
    if (b.chamber !== boxParam) { pickChamber(boxParam); return; }
  }
  if (restored?.shared) { stage = furthest(b); track('maker_open_shared'); }
  render();
}
