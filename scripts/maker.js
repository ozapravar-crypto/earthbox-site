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
// The last step adds the design to the cart (cart.js), where it's tallied
// with anything else, or sends it alone: WhatsApp + the email form.
// ─────────────────────────────────────────────────────────────────────

import { chambers, plants, substrates, elements, recipes,
         chamberElements, spaceQuestions, forms, guide } from '../data/maker.js';
import { enquiryAltHTML, ENQUIRY_PHONE } from './enquiry-form.js';
import { syncCartButtons } from './cart.js';
import { emptyDiscovery, searchPlants, dropChip, clearGuided, climateOrder } from './plant-search.js';

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

// Build shape, lookups and share-link codec live in build-codec.js.
import { emptyBuild, chamberOf, plantOf, isSoilless, suitedElements, isSuited, capacity, substrateSuits, encodeBuild, decodeBuild } from './build-codec.js';
export { emptyBuild, chamberOf, plantOf, isSoilless, suitedElements, isSuited, capacity, substrateSuits, encodeBuild, decodeBuild };

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
    line('Care wanted', s.care),
    line('Note', s.note.trim()),
    '',
    `Design: ${shareUrl(b)}`,
    '',
    'Could you share a quote and lead time?'
  ].filter(x => x !== null).join('\n');
}

// The cart keeps the composition only (same as the share link).
export const cartLine = (b) => ({ kind: 'build', code: encodeBuild(b) });

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
export const rng = (seed) => () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

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

// 3D thumbnail once maker-3d.js has drawn it; the line drawing until then (or without WebGL).
const glyphThumb = (p) => {
  const src = view3d?.thumb(p.id);
  return src ? `<img class="mk-thumb" src="${src}" alt="" width="56" height="64">`
    : `<svg class="mk-thumb" viewBox="-36 -86 72 92" aria-hidden="true" data-thumb="${p.id}"><g class="mk-plant">${GLYPH[p.form]}</g></svg>`;
};


// ═══ PREVIEW (3D) ═════════════════════════════════════════════════════
// scripts/maker-3d.js draws the same build in low-poly 3D. It's loaded only
// on this page, only with WebGL, and it reads THIS spec on every commit,
// so the build stays the one source of truth. Until it loads, or if WebGL
// fails, everything above is the fallback.

let view3d = null;

const plantSpec = (p) => ({ id: p.id, form: p.form, element: p.element, name: p.name });

// What the 3D view draws: the same facts previewSVG reads, nothing more.
export function sceneSpec(b){
  const ch = chamberOf(b), sub = find(substrates, b.substrate);
  return {
    chamber: ch ? { sku: ch.sku, name: ch.name, size: ch.size, temp: ch.temp, humidity: ch.humidity, light: ch.light } : null,
    soilless: !!ch && isSoilless(ch.sku),
    substrate: ch && !isSoilless(ch.sku) && sub ? sub.look : null,
    plants: b.plants.map(id => plantSpec(plantOf(id)))
  };
}

function webglOK(){
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch { return false; }
}


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
  const src = view3d?.swatch(look);
  if (src) return `<img class="mk-swatch" src="${src}" alt="" width="96" height="44">`;
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

// ─── Plants step: discovery (search · list/map · guided) ──────────────
// Rules live in plant-search.js; this only draws its output. List and map
// render the same `results`, so a view switch never changes what is shown.

// A plant's own chamber (one group), else Lab, which takes every group.
const homeOf = (p) => chambers.find(c => chamberElements[c.sku]?.length === 1 && chamberElements[c.sku][0] === p.element)
  || find(chambers, 'LabBox', 'sku');
const fitsIn = (p) => chambers.filter(c => isSuited(p, c.sku)).map(c => c.name);

function plantAction(b, p, ch){
  const on = b.plants.includes(p.id);
  if (!isSuited(p, ch.sku)) {
    const home = homeOf(p);
    return `<button type="button" class="mk-add mk-switch" data-act="switch" data-id="${p.id}" data-key="sw-${p.id}"
      aria-label="Switch to the ${home.name} chamber and add ${esc(p.name)}">Use ${home.name}</button>`;
  }
  const full = !on && b.plants.length >= capacity(ch);
  return `<button type="button" class="mk-add${on ? ' is-on' : ''}" data-act="plant" data-id="${p.id}" data-key="pl-${p.id}"
    aria-pressed="${on}" ${full ? 'disabled' : ''} aria-label="${on ? 'Remove' : 'Add'} ${esc(p.name)}">
    ${on ? 'Added ✓' : full ? 'Full' : 'Add'}</button>`;
}

// Only what the studio has published. Empty workbook columns say so, never guess.
function plantDetail(p){
  const el = find(elements, p.element), home = homeOf(p);
  const own = home.sku !== 'LabBox';
  return `<dl class="mk-dl">
    <div><dt>Group</dt><dd>${p.element} · ${el.heading}</dd></div>
    <div><dt>Shape</dt><dd>${forms[p.form]}</dd></div>
    <div><dt>Climate</dt><dd>${own ? `${home.temp} · ${home.humidity} humidity (${home.name} chamber)` : 'Set by hand in the Lab chamber'}</dd></div>
    <div><dt>Grows in</dt><dd>${fitsIn(p).join(', ')}</dd></div>
    <div><dt>Light · care</dt><dd>Not rated yet. The studio advises with your quote.</dd></div>
    <div><dt>Price</dt><dd>Quoted on enquiry</dd></div>
  </dl>`;
}

function plantRow(b, p, ch){
  const on = b.plants.includes(p.id), ok = isSuited(p, ch.sku);
  return `<li class="mk-plant-row${on ? ' is-on' : ''}${ok ? '' : ' is-off'}">
    ${glyphThumb(p)}
    <span class="mk-card-body">
      <span class="mk-card-name">${esc(p.name)}</span>
      <span class="mk-bot">${esc(p.botanical)}</span>
      <span class="mk-card-meta">${p.element} · ${forms[p.form]}</span>
      ${ok ? '' : `<span class="mk-why">Needs the ${homeOf(p).name} chamber’s climate</span>`}
    </span>
    ${plantAction(b, p, ch)}
    <details class="mk-detail"><summary>Details<span class="u-sr-only"> for ${esc(p.name)}</span></summary>${plantDetail(p)}</details>
  </li>`;
}

const climateLine = (c) => (c ? `${c.humidity} · ${c.temp}` : 'Lab chamber only');

function mapHTML(b, ch, results, ui){
  const fits = suitedElements(ch.sku);
  return `<p class="mk-map-key caption">Mapped by climate, driest to most humid. Tap a plant.</p>
  <ol class="mk-map">${climateOrder(chambers, chamberElements).map(({ id, chamber }) => {
    const here = results.filter(p => p.element === id);
    const pin = here.find(p => p.id === ui.pin);
    return `<li class="mk-region${fits.includes(id) ? ' is-fit' : ''}${here.length ? '' : ' is-empty'}">
      <p class="mk-region-head"><span class="mk-region-name">${id}</span>${fits.includes(id) ? '<span class="mk-tag">Your chamber</span>' : ''}</p>
      <p class="mk-card-meta">${climateLine(chamber)}</p>
      ${here.length ? `<div class="mk-pins">${here.map(p => `<button type="button" class="mk-pin${b.plants.includes(p.id) ? ' is-on' : ''}"
          data-act="pin" data-id="${p.id}" data-key="pin-${p.id}" aria-pressed="${p.id === ui.pin}"
          aria-label="${esc(p.name)}${b.plants.includes(p.id) ? ', added' : ''}" title="${esc(p.name)}">${glyphThumb(p)}</button>`).join('')}</div>`
        : '<p class="mk-region-none">No matches</p>'}
      ${pin ? `<div class="mk-pin-card">
          <p class="mk-card-name">${esc(pin.name)}</p><p class="mk-bot">${esc(pin.botanical)}</p>
          ${isSuited(pin, ch.sku) ? '' : `<p class="mk-why">Needs the ${homeOf(pin).name} chamber’s climate</p>`}
          ${plantAction(b, pin, ch)}
          <details class="mk-detail"><summary>Details</summary>${plantDetail(pin)}</details>
        </div>` : ''}
    </li>`;
  }).join('')}</ol>`;
}

const disCtx = (b) => {
  const ch = chamberOf(b);
  return { suited: suitedElements(ch.sku), chamber: ch.name, space: b.space };
};

function resultsHTML(b, ui){
  const ch = chamberOf(b), d = ui.disc;
  const { results, constraints: cs, preferences: prefs, relax } = searchPlants(d, disCtx(b));
  const look = find(guide.looks, d.g.look);
  const guided = cs.some(c => c.guided) || prefs.length > 0;
  const chip = (c) => `<button type="button" class="mk-chip${c.guided || !('test' in c) ? ' is-guided' : ''}" data-act="chip" data-id="${esc(c.key)}"
    data-key="chip-${esc(c.key)}" aria-label="Remove ${esc(c.label)}">${esc(c.label)} <span aria-hidden="true">×</span></button>`;
  const head = `<p class="mk-found" aria-live="polite" tabindex="-1">${look ? `Showing ${results.length} plant${results.length === 1 ? '' : 's'} for your ${look.label.toLowerCase()} terrarium`
      : `${results.length} of ${plants.length} plants`}</p>
    ${cs.length || prefs.length ? `<div class="mk-chips" role="group" aria-label="Active filters">${[...cs, ...prefs].map(chip).join('')}
      ${guided ? '<button type="button" class="mk-clear" data-act="clear-guided" data-key="clear-guided">Clear guided filters</button>' : ''}
      ${cs.length + prefs.length > 1 ? '<button type="button" class="mk-clear" data-act="clear-all" data-key="clear-all">Clear all</button>' : ''}</div>` : ''}
    ${prefs.some(x => x.key === 'light') ? '<p class="mk-hint">Every chamber has its own grow light, so room light only changes the order.</p>' : ''}`;
  if (!results.length) return head + `<div class="mk-empty mk-none">
    <p>No plant matches all of these together.</p>
    ${relax.length ? `<p class="mk-sub">Loosen one:</p><ul class="mk-relax">${relax.map(r => `<li><button type="button" class="cta cta-secondary cta-small"
      data-act="chip" data-id="${esc(r.key)}" data-key="rx-${esc(r.key)}">Remove ${esc(r.label)} · ${r.count} plant${r.count === 1 ? '' : 's'}</button></li>`).join('')}</ul>` : ''}
  </div>`;
  return head + (d.view === 'map' ? mapHTML(b, ch, results, ui)
    : `<ul class="mk-plants">${results.map(p => plantRow(b, p, ch)).join('')}</ul>`);
}

function refineHTML(d, ui){
  const chipBtn = (kind, id, label, on) => `<button type="button" class="selector-chip${on ? ' active' : ''}" data-act="refine"
    data-id="${kind}:${id}" data-key="rf-${kind}-${id}" aria-pressed="${on}">${label}</button>`;
  return `<details class="mk-refine"${ui.refineOpen ? ' open' : ''}><summary>Filter &amp; sort</summary>
    <div class="mk-refine-body">
      <label class="mk-check-row"><input type="checkbox" data-act="fit" data-key="fit" ${d.f.fit ? 'checked' : ''}> Only plants that fit my chamber</label>
      <fieldset><legend class="caption">Plant group</legend><div class="mk-filter">${elements.map(e => chipBtn('group', e.id, e.id, d.f.groups.includes(e.id))).join('')}</div></fieldset>
      <fieldset><legend class="caption">Shape</legend><div class="mk-filter">${Object.entries(forms).map(([id, l]) => chipBtn('form', id, l, d.f.forms.includes(id))).join('')}</div></fieldset>
      <label class="mk-sort caption">Sort <select name="sort" data-key="sort">${[['recommended', 'Recommended'], ['name', 'Name A–Z'], ['group', 'Plant group']]
        .map(([v, l]) => `<option value="${v}"${d.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    </div></details>`;
}

function plantsPanel(b, ui){
  const ch = chamberOf(b);
  if (!suitedElements(ch.sku).length) return head('Plants', '')
    + `<div class="mk-empty"><p>The ${ch.name} chamber grows mushroom cultures, which aren’t on our plant list.</p>
       <p>The studio chooses the strain with you. Continue to tell us about your space.</p></div>`;

  const max = capacity(ch), d = ui.disc;
  return head('Add plants', `Search all ${plants.length}, or let us guide you. Each one shows whether it suits the ${ch.name} chamber.`)
  + `<p class="mk-count"><strong>${b.plants.length}</strong> of ${max} plants${b.plants.length >= max ? ' · chamber full' : ''}</p>
  ${b.plants.length ? `<ul class="mk-tray" aria-label="Selected plants">${b.plants.map(id => `<li>
      <span>${esc(plantOf(id).name)}</span>
      <button type="button" data-act="plant" data-id="${id}" data-key="tray-${id}" aria-label="Remove ${esc(plantOf(id).name)}">×</button></li>`).join('')}</ul>` : ''}
  <div class="mk-disc" role="search">
    <label class="mk-search"><span class="u-sr-only">Search plants</span>
      <input type="search" name="q" value="${esc(d.q)}" placeholder="Search plants, groups or shapes…" autocomplete="off" data-key="q"></label>
    <button type="button" class="mk-guide-btn" data-act="guide" data-key="guide" aria-haspopup="dialog">Guided search</button>
  </div>
  <div class="mk-disc-tools">
    <div class="mk-views" role="group" aria-label="View">${['list', 'map'].map(v =>
      `<button type="button" data-act="view" data-id="${v}" data-key="view-${v}" aria-pressed="${d.view === v}">${v === 'list' ? 'List' : 'Map'}</button>`).join('')}</div>
    ${refineHTML(d, ui)}
  </div>
  <div id="mkResults">${resultsHTML(b, ui)}</div>`;
}

// ─── Guided search (native <dialog>: focus trap + Esc for free) ──────
const GD = [
  { id: 'look',  q: 'What kind of world are you imagining?', line: 'This chooses the plant groups we show.' },
  { id: 'room',  q: 'Where will your terrarium live?',       line: 'Passed to the studio with your design. It doesn’t hide plants.' },
  { id: 'light', q: 'What light does the space get?',        line: 'Every EarthBox chamber has its own grow light, so this only changes the order. Low light still means some light.' },
  { id: 'care',  q: 'How much care are you happy to give?',  line: 'We haven’t rated care per plant yet. The studio uses this when it quotes.' },
  { id: 'roles', q: 'What should the plants add?',           line: 'Optional. Pick any.' }
];

function guideOptions(step, a){
  const opt = (name, value, label, line, type = 'radio') => `<label class="mk-gd-opt">
    <input type="${type}" name="gd-${name}" value="${esc(value)}" data-key="gd-${name}-${esc(value)}" ${(type === 'radio' ? a[name] === value : a[name].includes(value)) ? 'checked' : ''}>
    <span><strong>${esc(label)}</strong>${line ? `<em>${esc(line)}</em>` : ''}</span></label>`;
  if (step === 'look')  return guide.looks.map(o => opt('look', o.id, o.label, o.line)).join('');
  if (step === 'room')  return spaceQuestions.room.map(v => opt('room', v, v, '')).join('');
  if (step === 'light') return guide.light.map(o => opt('light', o.id, o.label, '')).join('');
  if (step === 'care')  return guide.care.map(o => opt('care', o.id, o.label, o.line)).join('');
  return guide.roles.map(o => opt('roles', o.id, o.label, '', 'checkbox')).join('');
}

function guideHTML(b, ui){
  const { step, a } = ui.gd, i = step, cur = GD[i];
  const answered = (s) => (s.id === 'roles' ? a.roles.length > 0 : !!a[s.id]);
  const last = i === GD.length - 1;
  const n = searchPlants({ ...ui.disc, g: { look: a.look, light: a.light, roles: a.roles } }, disCtx(b)).results.length;
  return `<form class="mk-gd" method="dialog">
    <header class="mk-gd-head"><p class="caption">Guided search · Step ${i + 1} of ${GD.length}</p>
      <button type="button" class="mk-gd-x" data-act="gd-close" data-key="gd-close" aria-label="Close guided search">×</button></header>
    <ol class="mk-gd-steps">${GD.map((s, k) => `<li><button type="button" data-act="gd-step" data-id="${k}" data-key="gd-s${k}"
      class="${k === i ? 'is-current' : ''}${answered(s) ? ' is-done' : ''}" ${k === i ? 'aria-current="step"' : ''}
      aria-label="Step ${k + 1}${answered(s) ? ', answered' : ''}"></button></li>`).join('')}</ol>
    <h2 class="mk-title" id="mkGuideTitle" tabindex="-1">${cur.q}</h2>
    <p class="mk-line">${cur.line}</p>
    <fieldset class="mk-gd-opts${cur.id === 'room' ? ' is-compact' : ''}"><legend class="u-sr-only">${cur.q}</legend>${guideOptions(cur.id, a)}</fieldset>
    <footer class="mk-gd-foot">
      ${i ? '<button type="button" class="cta cta-secondary" data-act="gd-back" data-key="gd-back">Back</button>' : '<span></span>'}
      ${last ? `<button type="button" class="cta" data-act="gd-apply" data-key="gd-apply"${n ? '' : ' aria-describedby="gdNone"'}>Show ${n} plant${n === 1 ? '' : 's'} ${arrow}</button>`
             : `<button type="button" class="cta" data-act="gd-next" data-key="gd-next">${answered(cur) ? 'Continue' : 'Skip'} ${arrow}</button>`}
    </footer>
    ${last && !n ? '<p class="mk-hint" id="gdNone">No plant matches every answer with your current search. You can still apply and loosen one on the page.</p>' : ''}
  </form>`;
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
  const spaceBits = [s.room, s.household.join(', '), s.maturity.split(' —')[0], s.care && `${s.care} care`, s.note && `“${s.note}”`].filter(Boolean).map(esc);
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
    <div class="pd-buy">
      <button type="button" class="cta" data-add-line="${esc(JSON.stringify(cartLine(b)))}" data-key="cart">Add to cart ${arrow}</button>
      <button type="button" class="cta cta-secondary save-btn" data-save-line="${esc(JSON.stringify(cartLine(b)))}" aria-pressed="false" data-key="save"><span>Save</span><span class="u-sr-only"> design</span></button>
    </div>
    <p class="mk-sub">The cart tallies this build with anything else you add. Or send just this design:</p>
    <a class="cta cta-secondary cta-block" href="${whatsappHref(b)}" target="_blank" rel="noopener" data-act="send" data-key="send">Send this design on WhatsApp ${arrow}</a>
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

// Saved discovery state is untrusted: keep only values we know.
function cleanDisc(d){
  const e = emptyDiscovery();
  if (!d || typeof d !== 'object') return e;
  const ids = (list, key = 'id') => list.map(x => x[key]);
  const pick = (v, ok) => (ok.includes(v) ? v : '');
  const many = (v, ok) => (Array.isArray(v) ? v.filter(x => ok.includes(x)) : []);
  return {
    q: String(d.q || '').slice(0, 80),
    sort: pick(d.sort, ['name', 'group']) || 'recommended',
    view: d.view === 'map' ? 'map' : 'list',
    f: { groups: many(d.f?.groups, ids(elements)), forms: many(d.f?.forms, Object.keys(forms)), fit: d.f?.fit !== false },
    g: { look: pick(d.g?.look, ids(guide.looks)), light: pick(d.g?.light, ids(guide.light)), roles: many(d.g?.roles, ids(guide.roles)) }
  };
}

function load(){
  const fromHash = location.hash.length > 3 ? decodeBuild(location.hash) : null;
  if (fromHash) return { build: fromHash, shared: true };
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    const b = saved && decodeBuild(saved.code);
    if (b) return { build: { ...b, space: { ...emptyBuild().space, ...saved.space } }, disc: cleanDisc(saved.disc) };
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
  let ui = { fresh: null, error: '', notice: null, disc: restored?.disc || emptyDiscovery(), pin: null, refineOpen: false, gd: null };
  const dialog = $('mkGuide');

  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify({ code: encodeBuild(b), space: b.space, disc: ui.disc })); } catch { /* private mode / full storage: the build lives for this page only */ }
  };

  // Search typing, view switch, chips: redraw only the results, so the
  // search box keeps its caret and the page keeps its scroll.
  function renderResults(){
    const key = document.activeElement?.dataset?.key;
    const box = $('mkResults');
    if (!box) return render();
    box.innerHTML = resultsHTML(b, ui);
    root.querySelectorAll('.mk-views [data-act=view]').forEach(x => x.setAttribute('aria-pressed', x.dataset.id === ui.disc.view));
    save();
    // The clicked chip may be gone: land on the result count instead of <body>.
    if (key && !root.contains(document.activeElement)) (box.querySelector(`[data-key="${key}"]`) || box.querySelector('.mk-found'))?.focus({ preventScroll: true });
  }
  const setDisc = (d) => { ui.disc = d; renderResults(); };

  function renderGuide(){
    const key = document.activeElement?.dataset?.key;
    dialog.innerHTML = guideHTML(b, ui);
    (key && dialog.querySelector(`[data-key="${key}"]`) || dialog.querySelector('.mk-title')).focus({ preventScroll: true });
  }
  function openGuide(){
    const { look, light, roles } = ui.disc.g;
    ui.gd = { step: 0, a: { look, light, roles: [...roles], room: b.space.room, care: b.space.care } };   // reopen = prefilled
    dialog.showModal();
    renderGuide();
    track('maker_guided_open');
  }
  function closeGuide(){ ui.gd = null; if (dialog.open) dialog.close(); }   // the draft is dropped; search + plants untouched
  dialog?.addEventListener('close', () => { ui.gd = null; root.querySelector('[data-key="guide"]')?.focus({ preventScroll: true }); });

  function render(){
    const key = document.activeElement?.dataset?.key;
    root.dataset.stage = stage;
    start.hidden = stage !== 'start';
    build.hidden = stage === 'start';

    if (stage === 'start'){ renderStart(); return; }

    $('mkSteps').innerHTML = stepsHTML(b, stage);
    const ch = chamberOf(b);
    const caption = ch ? `${ch.name} · indicative. The studio places every specimen by hand.` : 'Choose a chamber to begin';
    const fig = $('mkPreview');
    if (view3d){
      view3d.show(fig, sceneSpec(b), { fresh: ui.fresh, label: describe(b) });
      fig.append(Object.assign(fig.querySelector('figcaption') || document.createElement('figcaption'), { className: 'caption', textContent: caption }));
    } else fig.innerHTML = previewSVG(b, { fresh: ui.fresh, label: describe(b) }) + `<figcaption class="caption">${caption}</figcaption>`;
    const panel = { chamber: chamberPanel, foundation: foundationPanel, plants: plantsPanel, space: spacePanel, review: reviewPanel }[stage];
    const notice = ui.notice ? `<div class="mk-notice" role="status"><p>${ui.notice.text}</p>
      ${ui.notice.undo ? '<button type="button" class="cta cta-secondary cta-small" data-act="undo" data-key="undo">Undo</button>' : ''}</div>` : '';
    $('mkPanelBody').innerHTML = notice + panel(b, ui);
    $('mkBar').innerHTML = barHTML(b, stage, ui.error);
    ui.fresh = null;
    syncCartButtons();
    if (stage === 'plants') startThumbs();

    if (key) document.querySelector(`[data-key="${key}"]:not([disabled])`)?.focus({ preventScroll: true });
  }

  function renderStart(){
    $('mkResume').hidden = !b.chamber;
    $('mkBegin').hidden = !!b.chamber;
    $('mkRecipes').innerHTML = recipes.map(r => {
      const rb = { ...emptyBuild(), chamber: r.chamber, substrate: r.substrate, plants: r.plants };
      // A 3D still; it's redrawn once its plant models arrive.
      const still = view3d?.still(r.id, sceneSpec(rb), 300, 440, (src) => {
        const img = $('mkRecipes').querySelector(`[data-id="${r.id}"] img`);
        if (img && src) img.src = src;
      });
      return `<li><button type="button" class="mk-recipe" data-act="recipe" data-id="${r.id}" data-key="rc-${r.id}">
        <span class="mk-recipe-art">${still ? `<img src="${still}" alt="${esc(describe(rb))}" width="150" height="220">` : previewSVG(rb, { label: describe(rb) })}</span>
        <span class="mk-card-name">${r.name}</span>
        <span class="mk-card-desc">${r.line}</span>
        <span class="mk-card-meta">${chamberOf(rb).name} chamber · ${r.plants.length} plants</span>
      </button></li>`;
    }).join('');
    const hero = recipes[0];
    const hb = { ...emptyBuild(), chamber: hero.chamber, substrate: hero.substrate, plants: hero.plants };
    if (view3d) view3d.show($('mkHeroArt'), sceneSpec(hb), { label: 'A finished Moss chamber with three mosses.' });
    else $('mkHeroArt').innerHTML = previewSVG(hb, { label: 'A finished Moss chamber with three mosses' });
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
    if (act === 'plant') {
      const res = togglePlant(b, id);
      if (res.error) { ui.error = res.error; render(); }
      else commit(res.build, { fresh: res.build.plants.includes(id) ? id : null });
    }
    if (act === 'undo' && ui.notice?.undo) commit(ui.notice.undo);
    // Discovery
    if (act === 'view')  { ui.disc = { ...ui.disc, view: id }; renderResults(); }
    if (act === 'pin')   { ui.pin = ui.pin === id ? null : id; renderResults(); }
    if (act === 'chip') {
      if (id === 'room' || id === 'care') commit({ ...b, space: { ...b.space, [id]: '' } });
      else setDisc(dropChip(ui.disc, id));
    }
    if (act === 'clear-guided') { ui.disc = clearGuided(ui.disc); commit({ ...b, space: { ...b.space, room: '', care: '' } }); }
    if (act === 'clear-all') { ui.disc = { ...emptyDiscovery(), view: ui.disc.view, sort: ui.disc.sort, f: { ...emptyDiscovery().f, fit: false } };
      commit({ ...b, space: { ...b.space, room: '', care: '' } }); }
    if (act === 'refine') {
      const [kind, v] = id.split(':'), k = kind === 'group' ? 'groups' : 'forms', list = ui.disc.f[k];
      ui.disc = { ...ui.disc, f: { ...ui.disc.f, [k]: list.includes(v) ? list.filter(x => x !== v) : [...list, v] } };
      render(); save();
    }
    if (act === 'switch') switchFor(id);
    if (act === 'guide') openGuide();
    if (act === 'gd-close') closeGuide();
    if (act === 'gd-step') { ui.gd.step = +id; renderGuide(); }
    if (act === 'gd-back') { ui.gd.step--; renderGuide(); }
    if (act === 'gd-next') { ui.gd.step++; renderGuide(); }
    if (act === 'gd-apply') {
      const { look, light, roles, room, care } = ui.gd.a;
      ui.disc = { ...ui.disc, g: { look, light, roles } };
      ui.pin = null;
      track('maker_guided_apply', { look, light, care });
      closeGuide();
      commit({ ...b, space: { ...b.space, room, care } });
      root.querySelector('.mk-found')?.scrollIntoView({ block: 'nearest' });
    }
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

  // A plant from another climate: move to its chamber (keeping what fits,
  // with Undo), then add it. A new chamber may need a new foundation first.
  function switchFor(id){
    const p = plantOf(id), home = homeOf(p), before = b;
    const { build: nb, removed, clearedSubstrate } = swapChamber(b, home.sku);
    const res = togglePlant(nb, id);
    const next = res.build || nb;
    const bits = [`Switched to the ${home.name} chamber${res.build ? ` and added ${p.name}` : ''}.`];
    if (res.error) bits.push(res.error);
    if (removed.length) bits.push(`Removed ${removed.join(', ')}: ${removed.length > 1 ? 'they don’t' : 'it doesn’t'} fit.`);
    if (clearedSubstrate) bits.push('Your foundation doesn’t suit it, so choose one again.');
    const notice = { text: bits.join(' '), undo: before };
    if (!done(next, 'foundation')) commit(next, { notice, stage: 'foundation' });
    else commit(next, { notice, fresh: res.build ? id : null });
  }

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

  root.addEventListener('toggle', (e) => { if (e.target.classList?.contains('mk-refine')) ui.refineOpen = e.target.open; }, true);

  // "Your space" + name: plain inputs, saved as typed.
  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name === 'q') { ui.disc = { ...ui.disc, q: t.value.slice(0, 80) }; renderResults(); return; }
    if (t.name === 'sort') { ui.disc = { ...ui.disc, sort: t.value }; renderResults(); return; }
    if (t.dataset.act === 'fit') { ui.disc = { ...ui.disc, f: { ...ui.disc.f, fit: t.checked } }; renderResults(); return; }
    if (t.name?.startsWith('gd-') && ui.gd) {
      const k = t.name.slice(3);
      ui.gd.a[k] = k === 'roles' ? [...dialog.querySelectorAll('[name=gd-roles]:checked')].map(x => x.value) : t.value;
      renderGuide();
      return;
    }
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
    const line = JSON.stringify(cartLine(b));
    root.querySelectorAll('[data-add-line]').forEach(x => { x.dataset.addLine = line; });
    root.querySelectorAll('[data-save-line]').forEach(x => { x.dataset.saveLine = line; });
    syncCartButtons();
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
  load3D();

  // The 3D view arrives after first paint; the line drawings show until then.
  function load3D(){
    if (!webglOK()) return;
    import('./maker-3d.js').then(({ create3D }) => {
      view3d = create3D({ onLost(){ view3d = null; render(); } });
      if (!view3d) return;
      render();
    }).catch(() => { view3d = null; });
  }

  // Plant thumbnails are drawn the first time the Plants step shows, so
  // their 3D models load only then (line drawings until each is ready).
  let thumbsStarted = false;
  function startThumbs(){
    if (thumbsStarted || !view3d) return;
    thumbsStarted = true;
    view3d.thumbs(plants.map(plantSpec), () => {
      root.querySelectorAll('svg.mk-thumb[data-thumb]').forEach(svg => {
        const src = view3d?.thumb(svg.dataset.thumb);
        if (src) svg.outerHTML = `<img class="mk-thumb" src="${src}" alt="" width="56" height="64">`;
      });
    });
  }
}
