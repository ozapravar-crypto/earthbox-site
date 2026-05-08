// ─────────────────────────────────────────────────────────────────────
// render-products.js · Builds the /products page from data files.
//
// Volume I = 3D Printed accessories (16 products), grouped by category.
// Volume II = 10 Elemental Boxes, all "Coming Soon".
// Volume III = Digital Vivariums, research note.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne, categories as v1Categories, materials } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';

const ENQUIRY_WHATSAPP = '918104811584';

function formatPrice(pricing, materials){
  if (!pricing) return 'Coming soon';
  const firstMat = Object.keys(pricing)[0];
  const price = pricing[firstMat];
  return `From ₹${price.toLocaleString('en-IN')}`;
}

function enquiryHref(itemName){
  const text = `Hi Aayush, I'm interested in ${itemName}. Could you share availability, customisation, and pricing?`;
  return `https://wa.me/${ENQUIRY_WHATSAPP}?text=${encodeURIComponent(text)}`;
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

  host.innerHTML = grouped.map(({ cat, products }, catIndex) => `
    <section class="v1-category reveal" id="cat-${cat.slug}">
      <header class="v1-cat-header">
        <span class="caption v1-cat-num">${String(catIndex + 1).padStart(2, '0')}</span>
        <h3 class="v1-cat-title">${cat.title}</h3>
        <p class="v1-cat-desc">${cat.description}</p>
      </header>

      <div class="v1-grid">
        ${products.map(p => `
          <article class="v1-card ${p.status === 'coming-soon' ? 'v1-card--soon' : ''}">
            <a class="v1-card-link" href="product.html#${encodeURIComponent(p.sku)}" data-cursor="VIEW">
              <div class="v1-card-img">
                <img src="assets/v1/${p.photo}" alt="${p.name}" loading="lazy" onerror="this.parentElement.classList.add('v1-card-img--placeholder')"/>
              </div>
              <div class="v1-card-meta">
                <h4 class="v1-card-name">${p.name}</h4>
                <p class="v1-card-price">
                  ${p.status === 'coming-soon'
                    ? '<span class="v1-soon-badge">Coming soon</span>'
                    : formatPrice(p.pricing)}
                </p>
              </div>
            </a>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');
}


// ─── Volume II · 10 Elemental Boxes ───
function renderVolumeTwo(){
  const host = document.getElementById('volumeTwoList');
  if (!host) return;

  host.innerHTML = `
    <div class="boxes-grid reveal">
      ${volumeTwo.boxes.map((b, i) => {
        const hasIllust = !!b.illustration;
        const imageHTML = hasIllust
          ? `
              <img class="box-art"   src="assets/boxes/${b.illustration}" alt="${b.sku} illustration" loading="lazy"/>
              <img class="box-photo" src="assets/boxes/${b.photo}"        alt="${b.sku} product photograph" loading="lazy"/>
            `
          : `
              <img class="box-photo box-photo--solo" src="assets/boxes/${b.photo}" alt="${b.sku} product photograph" loading="lazy"/>
            `;
        return `
        <article class="box-card">
          <a class="box-card-link" href="product.html#${encodeURIComponent(b.sku)}" data-cursor="VIEW">
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
        <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
      </a>
    </div>
  `;
}


export function initProducts(){
  renderVolumeOne();
  renderVolumeTwo();
  renderVolumeThree();
}
