// ─────────────────────────────────────────────────────────────────────
// render-product-detail.js
//
// Reads ?id=<SKU> from the URL, looks up the matching product in V1
// / V2 / V3 data, and renders the right layout for that volume.
//
// V1 (3D Printed): Material selector (ABS/ASA/PETG CF) + variant selector
// V2 (Elemental Boxes): Rich specs + photo
// V3 (Digital Vivariums): Concept page
// ─────────────────────────────────────────────────────────────────────

import { SITE, PHONE } from '../data/site.js';
import { esc, rupees, track } from './util.js';
import { volumeOne as v1Products, categories as v1Categories, materials, photoPath } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';
import { getReviews, getAverageRating } from '../data/reviews.js';
import { observeReveals } from './reveal.js';
import { enquiryAltHTML } from './enquiry-form.js';
import { syncCartButtons } from './cart.js';
import { groupsOf, kitFor, encodePlan } from './care.js';
import { elements, chamberElements } from '../data/maker.js';
import { icon } from '../data/icons.js';



function enquiryHref(opts = {}){
  const { name, sku, material, variant, price, volume = 1 } = opts;
  const productUrl = sku ? `${SITE}/product#${encodeURIComponent(sku)}` : '';

  let text;

  if (volume === 1) {
    // V1: 3D Printed products — warm craftsman tone
    text = `Hi — I was just looking at the ${name}`;
    if (variant) text += ` (${variant})`;
    if (material) text += ` in ${material.toUpperCase()}`;
    text += `.\n\n`;
    text += `It's one of my favourites from Volume I. `;
    text += `Each is 3D-printed here in Mumbai, takes about a week.\n\n`;
    if (price) text += `Noted price: ${price}\n\n`;
    text += `Happy to answer any questions or talk through material options.\n\n`;
    text += `${productUrl}`;
  }
  else if (volume === 2) {
    // V2: Elemental Boxes — slightly more formal, anticipation tone
    text = `Hi — I was looking at the ${name} from Volume II.\n\n`;
    text += `I understand it's coming soon. Would love to know more about availability, `;
    text += `specs, or how to reserve one.\n\n`;
    text += `${productUrl}`;
  }
  else if (volume === 3) {
    // V3: Digital Vivariums — curiosity/research tone
    text = `Hi — I came across the Digital Vivariums concept (Volume III).\n\n`;
    text += `Really intrigued by the idea. Is there a way to register interest `;
    text += `or learn more about where this is headed?\n\n`;
    text += `${productUrl}`;
  }
  else {
    // Fallback
    text = `Hi — I was looking at ${name}. Could you share more details?`;
    if (productUrl) text += `\n\n${productUrl}`;
  }

  return `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
}

// Add to cart + Save, then WhatsApp as the quieter route. `line` is a cart
// line (cart.js); the selectors rewrite it when size or material changes.
const attr = (o) => JSON.stringify(o).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const ARROW = icon('arrow-long');
function buyHTML(line, waHref, name){
  return `
    <div class="pd-buy">
      <button type="button" class="cta magnetic pd-cta" data-add-line="${attr(line)}" data-cursor="ADD">Add to cart ${ARROW}</button>
      <button type="button" class="cta cta-secondary save-btn" data-save-line="${attr(line)}" aria-pressed="false">${icon('heart')}<span>Save</span><span class="u-sr-only"> ${name}</span></button>
    </div>
    <details class="pd-other-ways">
      <summary>Other ways to order ${icon('chevron-down', { size: 'xs' })}</summary>
      <a class="pd-alt-wa" id="pdEnquiryCta" href="${waHref}" target="_blank" rel="noopener">Ask a question on WhatsApp ${icon('arrow-up-right', { size: 'xs' })}</a>
      ${enquiryAltHTML(name)}
    </details>`;   // one primary action; WhatsApp + email folded (iconography audit P4)
}
// Coming-soon chambers can't go in the cart (studio decision, 12 Oct 2026):
// the primary action registers interest on WhatsApp; Save still bookmarks it.
function interestHTML(line, waHref, name){
  return `
    <div class="pd-buy">
      <a class="cta magnetic pd-cta" id="pdEnquiryCta" href="${waHref}" target="_blank" rel="noopener" data-cursor="ASK">Register interest ${icon('arrow-up-right', { size: 'xs' })}<span class="u-sr-only"> on WhatsApp (opens in a new tab)</span></a>
      <button type="button" class="cta cta-secondary save-btn" data-save-line="${attr(line)}" aria-pressed="false">${icon('heart')}<span>Save</span><span class="u-sr-only"> ${name}</span></button>
    </div>
    <details class="pd-other-ways">
      <summary>Prefer email? ${icon('chevron-down', { size: 'xs' })}</summary>
      ${enquiryAltHTML(name)}
    </details>`;
}
// Phone sticky bar shows the price beside the button (audit P8): it follows
// size/material via updatePrice().
const mobileBuyHTML = (line, price) => `
    <div class="pd-mobile-cta" id="pdMobileCta">
      <span class="pd-mobile-price" id="pdMobilePrice">${price}</span>
      <button type="button" class="cta" data-add-line="${attr(line)}">Add to cart ${ARROW}</button>
    </div>`;

const formatPrice = (price) => (price ? rupees(price) : null);

function formatReviewDate(isoDate){
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// Five stars read as one sentence, not five unnamed pictures (audit P5).
function renderStars(rating){
  return `<span class="pd-stars" role="img" aria-label="Rated ${rating} out of 5">${Array.from({ length: 5 }, (_, i) => `
    <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false" class="${i < rating ? 'filled' : ''}">
      <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/>
    </svg>`).join('')}</span>`;
}

function renderReviewsSection(sku){
  const reviews = getReviews(sku);
  const avgRating = getAverageRating(sku);

  const googleReviewUrl = 'https://share.google/jIhGVZ3frNwyVZ6ZW';

  if (reviews.length === 0) {
    return `
      <section class="pd-reviews reveal" id="reviews">
        <header class="pd-reviews-head">
          <h2 class="u-sr-only">Reviews</h2>
        </header>
        <div class="pd-no-reviews">
          <p>No reviews yet. Be the first to share your experience.</p>
          <a class="cta-small pd-review-cta" href="${googleReviewUrl}" target="_blank" rel="noopener">
            Leave a review<span class="u-sr-only"> on Google (opens in a new tab)</span>
            ${icon('arrow-up-right', { size: 'xs' })}
          </a>
        </div>
      </section>
    `;
  }

  return `
    <section class="pd-reviews reveal" id="reviews">
      <header class="pd-reviews-head">
        <h2 class="u-sr-only">Reviews</h2>
        <span class="pd-reviews-count">${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}</span>
        ${avgRating ? `
          <span class="pd-reviews-avg">
            <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/></svg>
            ${avgRating}
          </span>
        ` : ''}
      </header>
      <div class="pd-reviews-list">
        ${reviews.map(r => `
          <article class="pd-review">
            <header class="pd-review-header">
              <div class="pd-review-author">
                <span class="pd-review-name">${r.name}</span>
                ${r.location ? `<span class="pd-review-location">${r.location}</span>` : ''}
              </div>
              <span class="pd-review-date">${formatReviewDate(r.date)}</span>
            </header>
            <div class="pd-review-rating">${renderStars(r.rating)}</div>
            <p class="pd-review-text">${r.text}</p>
            ${r.verified ? `
              <span class="pd-review-verified">
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M10 3L4.5 8.5 2 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Verified Purchase
              </span>
            ` : ''}
          </article>
        `).join('')}
      </div>
      <div class="pd-reviews-footer">
        <a class="pd-review-link" href="${googleReviewUrl}" target="_blank" rel="noopener">
          <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/></svg>
          Leave a review on Google<span class="u-sr-only"> (opens in a new tab)</span> ${icon('arrow-up-right', { size: 'xs' })}
        </a>
      </div>
    </section>
  `;
}


// ─── Find a product by ID across all volumes ───
function findProduct(id){

  // V1 — 3D Printed products (new)
  const v1 = v1Products.find(p => p.sku === id);
  if (v1) return { volume: 1, kind: 'printed', data: v1 };

  // V2 — Elemental Boxes
  const v2 = volumeTwo.boxes.find(b => b.sku === id);
  if (v2) return { volume: 2, kind: 'box', data: v2 };

  // V3 — Digital Vivariums
  if (id === volumeThree.sku) return { volume: 3, kind: 'vivarium', data: volumeThree };

  return null;
}


// ─── V1 3D Printed product · photo + material selector + variant selector ───
// "Keep it thriving": the matching refill kit (chambers) and a visit plan,
// prefilled for this piece on /care. Plan: CARE-PLAN.md.
function careHTML(sku){
  const kitsFor = groupsOf(sku).map(kitFor).filter(Boolean);
  const plan = encodePlan({ s: 'piece', r: sku, d: '12m', f: 'monthly', g: groupsOf(sku) });
  return `
      <section class="pd-care reveal" aria-labelledby="pdCareTitle">
        <h2 id="pdCareTitle" class="pd-care-title">Keep it thriving</h2>
        <p class="pd-care-text">${kitsFor.length ? 'A refill kit matched to its plants, or' : 'Ask for'} visits from the studio to look after it, in Mumbai.</p>
        <div class="pd-care-actions">
          ${kitsFor.map(k => `<button type="button" class="cta cta-small cta-secondary" data-add-line='${JSON.stringify({ kind: 'product', sku: k.sku })}'>Add ${k.name}</button>`).join('')}
          <a class="cta cta-small cta-secondary" href="/care#${plan}">Plan care visits</a>
        </div>
      </section>`;
}

function renderPrinted(p){
  const cat = v1Categories.find(c => c.slug === p.category);
  const hasVariants = p.variants && p.variants.length > 0;
  const hasPricing = p.pricing !== null;
  const isComingSoon = p.status === 'coming-soon';

  // Get available materials for this product
  const availableMaterials = hasPricing
    ? (hasVariants
        ? Object.keys(p.pricing[p.variants[0].id])
        : Object.keys(p.pricing))
    : [];

  // Related products from same category
  const related = v1Products
    .filter(o => o.sku !== p.sku && o.category === p.category)
    .slice(0, 4);

  // Reviews summary for trust signal
  const reviews = getReviews(p.sku);
  const avgRating = getAverageRating(p.sku);
  const reviewCount = reviews.length;

  const line = { kind: 'product', sku: p.sku, variant: hasVariants ? p.variants[0].id : null,
                 material: availableMaterials[0] || null, qty: 1 };

  // Extract key points from description (first sentence or up to 100 chars)
  const shortDesc = p.description.split('.')[0] + '.';

  return `
    <article class="pd-page pd-page--printed">

      <nav class="pd-breadcrumb reveal" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span class="pd-breadcrumb-sep" aria-hidden="true">${icon('chevron-right', { size: 'xs' })}</span>
        <a href="/products">Catalogue</a>
        <span class="pd-breadcrumb-sep" aria-hidden="true">${icon('chevron-right', { size: 'xs' })}</span>
        <a href="/products#vol-1">${cat ? cat.title : 'Volume I'}</a>
        <span class="pd-breadcrumb-sep" aria-hidden="true">${icon('chevron-right', { size: 'xs' })}</span>
        <span class="pd-breadcrumb-current">${p.name}</span>
      </nav>

      <header class="pd-head reveal">
        <span class="eyebrow">Volume I &nbsp;·&nbsp; ${cat ? cat.title : '3D Printed'}</span>
        <h1 class="pd-title scramble">${p.name}</h1>
        ${p.unit ? `<p class="pd-unit caption">${p.unit}</p>` : ''}
      </header>

      <section class="pd-showcase">
        <div class="pd-hero reveal">
          <div class="pd-hero-frame">
            <img src="${photoPath(p)}" alt="${esc(p.name)}" width="1200" height="900" data-fallback="parent:pd-hero-frame--placeholder"/>
          </div>
        </div>
        <aside class="pd-body-side reveal" style="--d:120ms">

          <!-- Short description -->
          <p class="pd-short-desc">${shortDesc}</p>

          ${isComingSoon ? `
            <div class="pd-coming-soon">
              <p class="caption">This product is in development. Register your interest below.</p>
            </div>
          ` : ''}

          ${hasVariants ? `
            <div class="pd-selector" data-selector="variant">
              <span class="caption" id="pdVariantLabel">Size / Variant</span>
              <div class="pd-selector-options" role="radiogroup" aria-labelledby="pdVariantLabel">
                ${p.variants.map((v, i) => `
                  <button type="button" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="pd-selector-btn ${i === 0 ? 'active' : ''}" data-variant="${v.id}">
                    <span class="pd-selector-name">${v.name}</span>
                    <span class="pd-selector-desc">${v.description}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${hasPricing && availableMaterials.length > 0 ? `
            <div class="pd-selector" data-selector="material">
              <span class="caption" id="pdMaterialLabel">Material</span>
              <div class="pd-selector-options pd-selector-options--inline" role="radiogroup" aria-labelledby="pdMaterialLabel">
                ${availableMaterials.map((m, i) => {
                  const mat = materials.find(x => x.id === m) || { id: m, name: m.toUpperCase(), description: '' };
                  return `
                    <button type="button" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" class="pd-selector-btn pd-selector-btn--chip ${i === 0 ? 'active' : ''}" data-material="${m}">
                      ${mat.name}
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <div class="pd-price-display">
            ${hasPricing ? `
              <span class="pd-price" id="pdPrice">
                ${hasVariants
                  ? formatPrice(p.pricing[p.variants[0].id][availableMaterials[0]])
                  : formatPrice(p.pricing[availableMaterials[0]])}
              </span>
              ${p.priceRange ? `<span class="pd-price-range caption">${p.priceRange[availableMaterials[0]]}</span>` : ''}
            ` : `
              <span class="pd-price pd-price--enquiry">Price on enquiry</span>
            `}
          </div>

          ${buyHTML(line, enquiryHref({
               name: p.name,
               sku: p.sku,
               material: availableMaterials[0],
               variant: hasVariants ? p.variants[0].name : null,
               price: hasPricing ? formatPrice(hasVariants ? p.pricing[p.variants[0].id][availableMaterials[0]] : p.pricing[availableMaterials[0]]) : null,
               volume: 1
             }), p.name)}

          <!-- Trust signals -->
          <div class="pd-trust-signals">
            <div class="pd-lead-time">
              ${icon('clock')}
              <span>Made to order · ~1 week</span>
            </div>
            ${reviewCount > 0 ? `
              <a href="#reviews" class="pd-rating-badge">
                <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/></svg>
                <span>${avgRating} · ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}</span>
              </a>
            ` : ''}
            <div class="pd-delivery">
              ${icon('truck')}
              <span>Delivery within Mumbai</span>
            </div>
          </div>
        </aside>
      </section>

      <section class="pd-intro reveal">
        <div class="pd-body-text">
          <p>${p.description}</p>
        </div>
      </section>
${['planters', 'plant-packets', 'plant-support'].includes(p.category) ? careHTML(p.sku) : ''}

      ${renderReviewsSection(p.sku)}

      ${related.length ? `
        <section class="pd-related reveal">
          <header class="pd-related-head">
            <h2 class="u-sr-only">More ${cat ? cat.title : 'products'}</h2>
          </header>
          <div class="pd-related-grid">
            ${related.map(o => `
              <a class="pd-related-card" href="/product#${encodeURIComponent(o.sku)}" data-cursor="VIEW">
                <div class="pd-related-img">
                  <img src="${photoPath(o, '600')}" alt="${esc(o.name)}" loading="lazy" data-fallback="hide"/>
                </div>
                <div class="pd-related-meta">
                  <span class="caption">Volume I</span>
                  <h3>${o.name}</h3>
                  ${o.status === 'coming-soon' ? '<p class="italic">Coming soon</p>' : ''}
                </div>
              </a>
            `).join('')}
          </div>
        </section>
      ` : ''}

    </article>

    <!-- Mobile sticky CTA -->
    ${mobileBuyHTML(line, hasPricing ? formatPrice(hasVariants ? p.pricing[p.variants[0].id][availableMaterials[0]] : p.pricing[availableMaterials[0]]) : 'Price on enquiry')}
  `;
}


// ─── V1 selector interactivity ───
function initPrintedSelectors(p){
  const hasVariants = p.variants && p.variants.length > 0;
  const hasPricing = p.pricing !== null;
  if (!hasPricing) return;

  const priceEl = document.getElementById('pdPrice');
  const ctaEl = document.getElementById('pdEnquiryCta');
  if (!priceEl || !ctaEl) return;

  let currentVariant = hasVariants ? p.variants[0].id : null;
  let currentMaterial = hasVariants
    ? Object.keys(p.pricing[p.variants[0].id])[0]
    : Object.keys(p.pricing)[0];

  function updatePrice(){
    const price = hasVariants
      ? p.pricing[currentVariant]?.[currentMaterial]
      : p.pricing[currentMaterial];
    priceEl.textContent = price ? formatPrice(price) : 'Price on enquiry';
    const mobilePrice = document.getElementById('pdMobilePrice');
    if (mobilePrice) mobilePrice.textContent = priceEl.textContent;

    const variantName = hasVariants ? p.variants.find(v => v.id === currentVariant)?.name : null;
    const href = enquiryHref({
      name: p.name,
      sku: p.sku,
      material: currentMaterial,
      variant: variantName,
      price: price ? formatPrice(price) : null,
      volume: 1
    });
    ctaEl.href = href;
    const line = JSON.stringify({ kind: 'product', sku: p.sku, variant: currentVariant, material: currentMaterial, qty: 1 });
    document.querySelectorAll('#productDetail [data-add-line], #productDetail [data-save-line]').forEach(b => {
      b.dataset[b.hasAttribute('data-add-line') ? 'addLine' : 'saveLine'] = line;
    });
    syncCartButtons();
  }

  // Size and material are radio groups (iconography audit P1): the choice is
  // announced (aria-checked), Tab reaches the group once, arrows move within it.
  const pick = (attr, btn) => {
    document.querySelectorAll(`[${attr}]`).forEach(b => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (attr === 'data-variant') currentVariant = btn.dataset.variant; else currentMaterial = btn.dataset.material;
    updatePrice();
  };
  for (const attr of ['data-variant', 'data-material']) {
    const btns = [...document.querySelectorAll(`[${attr}]`)];
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => pick(attr, btn));
      btn.addEventListener('keydown', (e) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!step) return;
        e.preventDefault();
        const next = btns[(i + step + btns.length) % btns.length];
        pick(attr, next); next.focus();
      });
    });
  }
}


// ─── V2 box detail layout · big photo + rich description + specs ───
// ─── Numbered points under the photo (bead site-kry) ───
// Three discreet points that reveal one short panel each on hover/focus
// (desktop) or tap (touch), so the photo stays the focus and the facts are
// there on demand. Built from the chamber's own data; a box can override
// them with `points: [{ label, title, text }]` in data/upcoming.js.
export function boxPoints(b){
  if (Array.isArray(b.points) && b.points.length) return b.points.slice(0, 3);
  const groups = (chamberElements[b.sku] === 'all' ? elements : elements.filter(e => (chamberElements[b.sku] || []).includes(e.id))).map(e => e.heading.toLowerCase());
  return [
    { label: b.plants, title: `What grows: ${b.plants.toLowerCase()}`, text: [b.capacity, groups.length ? `Suits ${groups.join(', ')}.` : 'The studio picks the culture with you.'].filter(Boolean).join(' · ') },
    { label: 'Climate', title: 'The climate inside', text: `${b.temp} · ${b.humidity} humidity · ${b.light}` },
    { label: 'The object', title: 'The object', text: `${b.size} · ${b.weight} · ${b.power} · ${b.edition} edition · made in ${b.lead} · ${b.warranty} warranty` }
  ];
}
function pointsHTML(points){
  return `<div class="pd-points" data-points>
    <ol class="pd-points-list">${points.map((pt, i) => `
      <li><button type="button" class="pd-point" data-point="${i}" aria-expanded="false" aria-controls="pdPoint${i}">
        <span class="pd-point-n">${String(i + 1).padStart(2, '0')}</span><span class="pd-point-label">${pt.label}</span>
      </button></li>`).join('')}
    </ol>
    <div class="pd-points-stage">
      ${points.map((pt, i) => `<div class="pd-point-panel" id="pdPoint${i}" role="region" aria-label="${pt.label}" hidden>
        <h3 class="pd-point-title">${pt.title}</h3><p>${pt.text}</p></div>`).join('')}
      <p class="pd-points-hint caption" aria-hidden="true"><span class="pd-hint-hover">Hover over the points to explore</span><span class="pd-hint-tap">Tap a point to explore</span></p>
    </div>
  </div>`;
}

function renderBox(b){
  const desc = (b.description || []).map(p => `<p>${p}</p>`).join('');

  const related = volumeTwo.boxes.filter(o => o.sku !== b.sku).slice(0, 4);

  return `
    <article class="pd-page pd-page--box">

      <header class="pd-head reveal">
        <a href="/products" class="back-link caption">${icon('arrow-left', { size: 'xs' })}Catalogue</a>
        <span class="eyebrow">Volume II &nbsp;·&nbsp; Elemental Boxes</span>
        <h1 class="pd-title scramble">${b.sku}</h1>
        <p class="pd-tagline italic">${b.tagline}</p>
      </header>

      <section class="pd-intro reveal">
        <div class="pd-body-text">
          ${desc}
        </div>
      </section>

      <section class="pd-showcase">
        <div class="pd-hero reveal">
          <div class="pd-hero-frame">
            <img src="assets/boxes/${b.photo}" alt="${b.sku} product photograph" width="1200" height="900"/>
          </div>
          ${pointsHTML(boxPoints(b))}
        </div>
        <aside class="pd-body-side reveal" style="--d:120ms">
          ${interestHTML({ kind: 'product', sku: b.sku, qty: 1 }, enquiryHref({ name: b.sku, sku: b.sku, volume: 2 }), b.sku)}
          <p class="caption pd-note">Coming soon · not yet in the cart</p>
          <a class="caption pd-maker-link" href="/maker?box=${b.sku}">Design yours in the Maker &rarr;</a>
        </aside>
      </section>

      ${related.length ? `
        <section class="pd-related reveal">
          <header class="pd-related-head">
            <h2 class="u-sr-only">More from Volume II</h2>
          </header>
          <div class="pd-related-grid">
            ${related.map(o => `
              <a class="pd-related-card" href="/product#${encodeURIComponent(o.sku)}" data-cursor="VIEW">
                <div class="pd-related-img">
                  <img src="assets/boxes/${o.photo}" alt="${o.sku}" loading="lazy"/>
                </div>
                <div class="pd-related-meta">
                  <span class="caption">Volume II</span>
                  <h3>${o.sku}</h3>
                </div>
              </a>
            `).join('')}
          </div>
        </section>
      ` : ''}

    </article>

    <!-- Mobile sticky CTA -->
    <div class="pd-mobile-cta" id="pdMobileCta">
      <span class="pd-mobile-price">${b.price}</span>
      <a class="cta" href="${enquiryHref({ name: b.sku, sku: b.sku, volume: 2 })}" target="_blank" rel="noopener">Register interest ${icon('arrow-up-right', { size: 'xs' })}</a>
    </div>
  `;
}


// ─── V3 vivarium · concept + research note ───
function renderVivarium(v){
  return `
    <article class="pd-page pd-page--vivarium">

      <header class="pd-head reveal">
        <a href="/products" class="back-link caption">${icon('arrow-left', { size: 'xs' })}Catalogue</a>
        <span class="eyebrow">Volume III &nbsp;·&nbsp; Horizon</span>
        <h1 class="pd-title scramble">${v.title}</h1>
        <p class="pd-tagline italic">${v.subtitle}</p>
      </header>

      <section class="pd-body pd-body--single reveal">
        <p class="lede">${v.description}</p>
        <p class="italic" style="margin-top:1.5rem;color:var(--mute)">${v.note}</p>
        <a class="cta magnetic pd-cta"
           style="margin-top:2rem"
           href="${enquiryHref({ name: 'Digital Vivariums', sku: v.sku, volume: 3 })}"
           target="_blank" rel="noopener"
           data-cursor="ASK">
          Write in on WhatsApp
          ${icon('arrow-up-right', { size: 'xs' })}
        </a>
        <p class="caption pd-note">${v.status}</p>
      </section>

    </article>

    <!-- Mobile sticky CTA -->
    <div class="pd-mobile-cta">
      <a class="cta magnetic"
         href="${enquiryHref({ name: 'Digital Vivariums', sku: v.sku, volume: 3 })}"
         target="_blank" rel="noopener"
         data-cursor="ASK">
        Write in on WhatsApp
        ${icon('arrow-up-right', { size: 'xs' })}
      </a>
    </div>
  `;
}


// ─── Render product by ID ───
function renderProduct(id){
  const host = document.getElementById('productDetail');
  if (!host) return;

  // Clear previous content (keep loading/notfound placeholders if they exist)
  // The article and its mobile sticky CTA are siblings: remove both.
  host.querySelectorAll('article, .pd-mobile-cta').forEach(el => el.remove());

  if (!id){
    document.getElementById('pdLoading')?.setAttribute('hidden', 'true');
    document.getElementById('pdNotFound')?.removeAttribute('hidden');
    return;
  }

  const found = findProduct(id);
  if (!found){
    document.getElementById('pdLoading')?.setAttribute('hidden', 'true');
    document.getElementById('pdNotFound')?.removeAttribute('hidden');
    return;
  }

  const name = found.kind === 'box' ? found.data.sku
             : found.kind === 'printed' ? found.data.name
             : found.data.title;
  const description = found.data.description || found.data.tagline || '';
  const photo = found.kind === 'printed' ? photoPath(found.data)
              : found.kind === 'box' ? `assets/boxes/${found.data.photo}`
              : 'assets/og-home.jpg';

  document.title = `EarthBox — ${name}`;

  // Update meta tags for social sharing
  const updateMeta = (selector, content) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', content);
  };
  updateMeta('meta[name="description"]', description.slice(0, 160));
  updateMeta('meta[property="og:title"]', `EarthBox — ${name}`);
  updateMeta('meta[property="og:description"]', description.slice(0, 160));
  updateMeta('meta[property="og:image"]', `https://www.earthbox.in/${photo}`);
  updateMeta('meta[name="twitter:title"]', `EarthBox — ${name}`);
  updateMeta('meta[name="twitter:description"]', description.slice(0, 160));

  let html;
  if (found.kind === 'printed')    html = renderPrinted(found.data);
  else if (found.kind === 'box')   html = renderBox(found.data);
  else                             html = renderVivarium(found.data);

  // Hide, don't remove: a later bad id must still be able to show "not found".
  document.getElementById('pdLoading')?.setAttribute('hidden', 'true');
  document.getElementById('pdNotFound')?.setAttribute('hidden', 'true');
  host.insertAdjacentHTML('beforeend', html);

  // Initialize reveals for dynamically added content
  observeReveals(host);

  syncCartButtons();

  // Initialize selectors for V1 products
  if (found.kind === 'printed') {
    initPrintedSelectors(found.data);
  }

  // Scroll to top when navigating to new product
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // GA4: Track product view
  track('product_view', {
      product_name: name,
      product_sku: id,
      product_volume: found.volume,
      product_type: found.kind
    });

  // GA4: Track enquiry clicks
  host.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      track('enquire_click', {
          product_name: name,
          product_sku: id,
          product_volume: found.volume
        });
    });
  });
}


// ─── Get product ID from URL ───
function getProductId(){
  const hashId = location.hash ? decodeURIComponent(location.hash.slice(1)) : null;
  const params = new URLSearchParams(location.search);
  const queryId = params.get('id');
  return hashId || queryId;
}


// ─── Boot ───
export function initProductDetail(){
  const host = document.getElementById('productDetail');
  if (!host) return;

  // The URL hash is the product id, so the skip link must not change it.
  document.querySelector('.skip-link')?.addEventListener('click', (e) => {
    e.preventDefault(); host.tabIndex = -1; host.focus();
  });

  // Initial render
  renderProduct(getProductId());

  // Re-render on hash change (for related product links)
  // The hash is the product id, so in-page links (#reviews) must scroll
  // without touching it, or the page re-renders as product "reviews".
  host.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    const target = a && document.getElementById(a.getAttribute('href').slice(1));
    if (!target || findProduct(a.getAttribute('href').slice(1))) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('hashchange', () => {
    renderProduct(getProductId());
  });

  // Numbered points: one open at a time. Mouse: hover opens, leaving the
  // points closes. Keyboard: focus opens, Escape or tabbing away closes.
  // Touch / click: tap toggles, tapping another switches.
  const show = (wrap, i) => {
    wrap.querySelectorAll('.pd-point').forEach((b, n) => b.setAttribute('aria-expanded', String(n === i)));
    wrap.querySelectorAll('.pd-point-panel').forEach((p, n) => { p.hidden = n !== i; });
    wrap.classList.toggle('is-open', i !== null);
  };
  const wrapOf = (e) => e.target.closest?.('[data-points]');
  // Hover only where the device really hovers: iPhone Safari turns a tap into
  // mouse-looking events, which reopened a panel the tap had just closed
  // (found by the WebKit job, 12 Oct 2026).
  const canHover = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
  host.addEventListener('pointerover', (e) => {
    const b = canHover() && e.pointerType === 'mouse' && e.target.closest('.pd-point');
    if (b) show(wrapOf(e), +b.dataset.point);
  });
  host.addEventListener('pointerout', (e) => {
    const w = canHover() && e.pointerType === 'mouse' && wrapOf(e);
    if (w && !w.contains(e.relatedTarget) && !w.contains(document.activeElement)) show(w, null);
  });
  host.addEventListener('focusin', (e) => { const b = e.target.closest('.pd-point'); if (b && b.matches(':focus-visible')) show(wrapOf(e), +b.dataset.point); });
  host.addEventListener('focusout', (e) => { const w = wrapOf(e); if (w && !w.contains(e.relatedTarget)) show(w, null); });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('.pd-point');
    if (!b) return;
    const w = wrapOf(e), i = +b.dataset.point;
    // With hover, a click on the open point keeps it (hover opened it). Without
    // hover (touch), a tap toggles. Keyboard (detail 0) always opens.
    if (b.getAttribute('aria-expanded') === 'true' && !canHover() && e.detail !== 0) show(w, null);
    else show(w, i);
  });
  host.addEventListener('keydown', (e) => { const w = wrapOf(e); if (w && e.key === 'Escape') { show(w, null); } });
}
