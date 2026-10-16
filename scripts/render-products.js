// ─────────────────────────────────────────────────────────────────────
// render-products.js · Builds the /products page from data files.
//
// Volume I = 3D Printed accessories (16 products), grouped by category.
// Volume II = 10 Elemental Boxes, all "Coming Soon".
// Volume III = Digital Vivariums, research note.
// ─────────────────────────────────────────────────────────────────────

import { PHONE } from '../data/site.js';
import { icon } from '../data/icons.js';
import { track, esc, rupees, savedPlace, rememberPlace, radioKeys } from './util.js';
import { syncCartButtons } from './cart.js';
import { volumeOne, categories as v1Categories, photoPath, places, materials, priceOf } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';
import { observeReveals } from './reveal.js';
import { enquiryAltHTML } from './enquiry-form.js';


// Prices follow the shopper's place (Indoors / Sunny window / Balcony →
// one material), so a card shows the exact price, not "From ₹…".
// A piece with sizes shows its first size, the one its page opens on.
/**
 * @typedef {import('../data/volume-one.js').Product} Product
 * @typedef {import('../data/volume-one.js').Place} Place
 */
/**
 * @param {Product} p
 * @param {Place} place
 */
const cardLine = (p, place) => ({ kind: 'product', sku: p.sku, variant: p.variants?.[0]?.id ?? null, material: p.pricing ? place.material : null, qty: 1 });
/** @param {unknown} o */
const attr = (o) => esc(JSON.stringify(o));
/**
 * @param {Product} p
 * @param {Place} place
 */
const cardPrice = (p, place) => {
  const price = priceOf(p, place.material);
  return price ? rupees(price) : 'Price on enquiry';
};
/** @param {Product} p */
const sizeNote = (p) => (p.variants && p.variants.length > 1 ? `${p.variants[0].name} · ${p.variants.length} sizes` : '');

// "₹129 – ₹1,799" across every size of the category's orderable pieces, in this place.
/**
 * @param {Product[]} products
 * @param {Place} place
 */
function categoryRange(products, place){
  const all = /** @type {number[]} */ (products.filter(p => p.status === 'available' && p.pricing)
    .flatMap(p => (p.variants?.length ? p.variants.map(v => priceOf(p, place.material, v.id)) : [priceOf(p, place.material)]))
    .filter(Boolean));
  if (!all.length) return null;
  const lo = Math.min(...all), hi = Math.max(...all);
  return lo === hi ? rupees(lo) : `${rupees(lo)} – ${rupees(hi)}`;
}

/** @param {Product[]} products */
function sortByAvailability(products){
  const available = products.filter(p => p.status === 'available');
  const comingSoon = products.filter(p => p.status === 'coming-soon');
  return { available, comingSoon };
}

/** @param {string} itemName */
function enquiryHref(itemName){
  const text = `Hi Aayush, I'm interested in ${itemName}. Could you share availability, customisation, and pricing?`;
  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}


// ─── Volume I · 3D Printed Products by Category ───
function renderVolumeOne(){
  const host = document.getElementById('volumeOneList');
  if (!host) return;

  // Group products by category
  const grouped = v1Categories.map(cat => ({
    cat,
    products: volumeOne.filter(p => p.category === cat.slug)
  }));

  const place = savedPlace(places);
  host.innerHTML = placeSwitchHTML(place) + grouped.map(({ cat, products }, catIndex) => {
    const priceRange = categoryRange(products, place);
    const { available, comingSoon } = sortByAvailability(products);
    const hasAvailable = available.length > 0;
    const hasComingSoon = comingSoon.length > 0;

    // Image-first, quiet card: Save sits on the photo, Add beside the price.
    // Buttons are siblings of the link (a button can't live inside a link).
    /** @param {Product} p */
    const renderCard = (p) => {
      const soon = p.status === 'coming-soon', line = cardLine(p, place);
      return `
      <article class="v1-card ${soon ? 'v1-card--soon' : ''}" data-sku="${p.sku}">
        <a class="v1-card-link" href="/product/${encodeURIComponent(p.sku)}" data-cursor="VIEW">
          <div class="v1-card-img">
            <img
              src="${photoPath(p, '600')}"
              srcset="${photoPath(p, '300')} 300w, ${photoPath(p, '600')} 600w, ${photoPath(p)} 1200w"
              sizes="(max-width: 560px) 50vw, (max-width: 1100px) 33vw, 280px"
              alt="${p.name}"
              loading="lazy"
              decoding="async"
              data-fallback="parent:v1-card-img--placeholder"/>
          </div>
          <div class="v1-card-meta">
            <h3 class="v1-card-name">${p.name}</h3>
            <p class="v1-card-price">
              ${soon ? '<span class="badge v1-soon-badge">Coming soon</span>' : `<span class="v1-card-amount">${cardPrice(p, place)}</span>`}
            </p>
            ${!soon && sizeNote(p) ? `<p class="v1-card-note">${sizeNote(p)}</p>` : ''}
          </div>
        </a>
        <button type="button" class="v1-card-save" data-save-line="${attr(line)}" aria-pressed="false">${icon('heart')}<span class="u-sr-only">Save ${esc(p.name)}</span></button>
        ${soon ? '' : `<button type="button" class="v1-card-add" data-add-line="${attr(line)}">${icon('plus', { size: 'xs' })}Add<span class="u-sr-only"> ${esc(p.name)} to cart</span></button>`}
      </article>
    `;
    };

    return `
    <section class="v1-category reveal" id="cat-${cat.slug}">
      <header class="v1-cat-header">
        <span class="caption v1-cat-num">${String(catIndex + 1).padStart(2, '0')}</span>
        <h2 class="v1-cat-title">${cat.title}</h2>
        <p class="v1-cat-desc">${cat.description}</p>
        ${priceRange ? `<span class="v1-cat-price">${priceRange}</span>` : ''}
      </header>

      ${hasAvailable ? `
        <div class="v1-grid v1-grid--available">
          ${available.map(renderCard).join('')}
        </div>
      ` : ''}

      ${hasComingSoon ? `
        ${hasAvailable ? '<div class="v1-coming-divider"><span class="caption">Coming Soon</span></div>' : ''}
        <div class="v1-grid v1-grid--soon">
          ${comingSoon.map(renderCard).join('')}
        </div>
      ` : ''}
    </section>
  `;}).join('');

  observeReveals(host);
  initPlaceSwitch(host);
  syncCartButtons();
}

// ─── "Where will it live?" ───
// One choice for the whole catalogue; it sets the material behind every
// price, Add and Save, and the product pages open on it too.
/** @param {Place} place */
const materialNote = (place) => {
  const m = /** @type {typeof materials[number]} */ (materials.find(x => x.id === place.material));   // every place names a material
  return `Prices in ${m.name}: ${m.description.toLowerCase()}.`;
};
/** @param {Place} place */
function placeSwitchHTML(place){
  return `
    <div class="place-switch">
      <span class="caption" id="placeLabel">Where will it live?</span>
      <div class="place-options" role="radiogroup" aria-labelledby="placeLabel">
        ${places.map(x => `<button type="button" role="radio" class="place-btn" data-place="${x.id}" aria-checked="${x.id === place.id}" tabindex="${x.id === place.id ? 0 : -1}">${x.name}</button>`).join('')}
      </div>
      <p class="place-note caption" id="placeNote" aria-live="polite">${materialNote(place)}</p>
    </div>`;
}
/** @param {HTMLElement} host */
function initPlaceSwitch(host){
  const btns = [.../** @type {NodeListOf<HTMLElement>} */ (host.querySelectorAll('[data-place]'))];
  /** @param {HTMLElement} btn */
  const choose = (btn) => {
    const place = /** @type {Place} */ (places.find(x => x.id === btn.dataset.place));   // the buttons are drawn from places
    rememberPlace(place.id);
    btns.forEach(b => { const on = b === btn; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
    /** @type {HTMLElement} */ (host.querySelector('#placeNote')).textContent = materialNote(place);
    /** @type {NodeListOf<HTMLElement>} */ (host.querySelectorAll('.v1-card[data-sku]')).forEach(card => {
      const p = /** @type {Product} */ (volumeOne.find(x => x.sku === card.dataset.sku));   // cards are drawn from volumeOne
      const line = JSON.stringify(cardLine(p, place));
      /** @type {NodeListOf<HTMLElement>} */ (card.querySelectorAll('[data-add-line]')).forEach(b => { b.dataset.addLine = line; });
      /** @type {NodeListOf<HTMLElement>} */ (card.querySelectorAll('[data-save-line]')).forEach(b => { b.dataset.saveLine = line; });
      const amount = card.querySelector('.v1-card-amount');
      if (amount) amount.textContent = cardPrice(p, place);
    });
    v1Categories.forEach(cat => {
      const el = host.querySelector(`#cat-${cat.slug} .v1-cat-price`);
      if (el) el.textContent = categoryRange(volumeOne.filter(p => p.category === cat.slug), place) || '';
    });
    syncCartButtons();
    track('place_select', { place: place.id });
  };
  radioKeys(btns, choose);
}


// ─── Volume II · 10 Elemental Boxes ───
function renderVolumeTwo(){
  const host = document.getElementById('volumeTwoList');
  if (!host) return;

  host.innerHTML = `
    <div class="boxes-grid reveal">
      ${volumeTwo.boxes.map((b, i) => {
        const hasIllust = !!b.illustration;
        const photoBase = b.photo.replace('.webp', '');
        const imageHTML = hasIllust
          ? `
              <img class="box-art" src="assets/boxes/${b.illustration}" alt="${b.sku} illustration" loading="lazy" decoding="async"/>
              <img class="box-photo"
                src="assets/boxes/${photoBase}-600.webp"
                srcset="assets/boxes/${photoBase}-300.webp 300w, assets/boxes/${photoBase}-600.webp 600w, assets/boxes/${b.photo} 1200w"
                sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 400px"
                alt="${b.sku} product photograph"
                loading="lazy"
                decoding="async"/>
            `
          : `
              <img class="box-photo box-photo--solo"
                src="assets/boxes/${photoBase}-600.webp"
                srcset="assets/boxes/${photoBase}-300.webp 300w, assets/boxes/${photoBase}-600.webp 600w, assets/boxes/${b.photo} 1200w"
                sizes="(max-width: 560px) 100vw, (max-width: 1100px) 50vw, 400px"
                alt="${b.sku} product photograph"
                loading="lazy"
                decoding="async"/>
            `;
        return `
        <article class="box-card">
          <a class="box-card-link" href="/product/${encodeURIComponent(b.sku)}" data-cursor="VIEW">
            <div class="box-image box-image--art ${hasIllust ? '' : 'box-image--photo-only'}" aria-label="${b.sku}">
              ${imageHTML}
            </div>
            <div class="box-meta">
              <span class="box-num">${String(i + 1).padStart(2, '0')}</span>
              <h3 class="box-name">${b.sku}</h3>
              <p class="box-tagline italic">${b.tagline}</p>
              <span class="box-cta caption">View details &nbsp;→</span>
            </div>
          </a>
        </article>
      `;}).join('')}
    </div>
  `;

  observeReveals(host);
}


// ─── Volume III · Digital Vivariums research ───
function renderVolumeThree(){
  const host = document.getElementById('volumeThreeBlock');
  if (!host) return;

  host.innerHTML = `
    <div class="vol3-card reveal">
      <p class="vol3-sub">${volumeThree.subtitle}</p>
      <span class="rule-s" style="margin:2rem 0"></span>
      <p class="vol3-desc">${volumeThree.description}</p>
      <div class="caption" style="margin-top:2rem">${volumeThree.status}</div>
      <p class="vol3-note italic">${volumeThree.note}</p>
      <a class="cta magnetic"
         style="margin-top:1.5rem"
         href="${enquiryHref('Digital Vivariums (Volume III) — early signal')}"
         target="_blank" rel="noopener"
         data-cursor="ASK">
        Write in on WhatsApp
        ${icon('arrow-up-right', { size: 'xs' })}
      </a>
      ${enquiryAltHTML('Digital Vivariums (Volume III)')}
    </div>
  `;

  observeReveals(host);
}


export function initProducts(){
  renderVolumeOne();
  renderVolumeTwo();
  renderVolumeThree();

  // GA4: Track enquiry clicks on catalogue page
  document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      track('enquire_click', {
          product_name: 'Digital Vivariums',
          product_volume: 3,
          source: 'catalogue'
        });
    });
  });
}
