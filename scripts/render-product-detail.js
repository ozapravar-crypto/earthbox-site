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

import { volumeOne as v1Products, categories as v1Categories, materials } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';
import { getReviews, getAverageRating } from '../data/reviews.js';
import { observeReveals } from './reveal.js';


const ENQUIRY_WHATSAPP = '918104811584';
const SITE_URL = 'https://earthbox.in';

function enquiryHref(opts = {}){
  const { name, sku, material, variant, price, volume = 1 } = opts;
  const productUrl = sku ? `${SITE_URL}/product.html#${encodeURIComponent(sku)}` : '';

  let text = '';

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

  return `https://wa.me/${ENQUIRY_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

function formatPrice(price){
  if (!price) return null;
  return `₹${price.toLocaleString('en-IN')}`;
}

function formatReviewDate(isoDate){
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function renderStars(rating){
  return Array.from({ length: 5 }, (_, i) => `
    <svg viewBox="0 0 12 12" class="${i < rating ? 'filled' : ''}">
      <path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/>
    </svg>
  `).join('');
}

function renderReviewsSection(sku){
  const reviews = getReviews(sku);
  const avgRating = getAverageRating(sku);

  const googleReviewUrl = 'https://share.google/jIhGVZ3frNwyVZ6ZW';

  if (reviews.length === 0) {
    return `
      <section class="pd-reviews reveal" id="reviews">
        <header class="pd-reviews-head">
          <span class="eyebrow">R e v i e w s</span>
        </header>
        <div class="pd-no-reviews">
          <p>No reviews yet. Be the first to share your experience.</p>
          <a class="cta-small pd-review-cta" href="${googleReviewUrl}" target="_blank" rel="noopener">
            Leave a review
            <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
          </a>
        </div>
      </section>
    `;
  }

  return `
    <section class="pd-reviews reveal" id="reviews">
      <header class="pd-reviews-head">
        <span class="eyebrow">R e v i e w s</span>
        <span class="pd-reviews-count">${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}</span>
        ${avgRating ? `
          <span class="pd-reviews-avg">
            <svg viewBox="0 0 12 12"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/></svg>
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
                <svg viewBox="0 0 12 12"><path d="M10 3L4.5 8.5 2 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Verified Purchase
              </span>
            ` : ''}
          </article>
        `).join('')}
      </div>
      <div class="pd-reviews-footer">
        <a class="pd-review-link" href="${googleReviewUrl}" target="_blank" rel="noopener">
          <svg viewBox="0 0 12 12"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/></svg>
          Leave a review on Google
        </a>
      </div>
    </section>
  `;
}


// ─── Find a product by ID across all volumes ───
function findProduct(id){
  console.log('[DEBUG] findProduct called with id:', id);
  console.log('[DEBUG] v1Products count:', v1Products?.length);

  // V1 — 3D Printed products (new)
  const v1 = v1Products.find(p => p.sku === id);
  console.log('[DEBUG] V1 match:', v1 ? v1.name : 'NOT FOUND');
  if (v1) return { volume: 1, kind: 'printed', data: v1 };

  // V2 — Elemental Boxes
  const v2 = volumeTwo.boxes.find(b => b.sku === id);
  if (v2) return { volume: 2, kind: 'box', data: v2 };

  // V3 — Digital Vivariums
  if (id === volumeThree.sku) return { volume: 3, kind: 'vivarium', data: volumeThree };

  return null;
}


// ─── V1 3D Printed product · photo + material selector + variant selector ───
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

  // Extract key points from description (first sentence or up to 100 chars)
  const shortDesc = p.description.split('.')[0] + '.';

  return `
    <article class="pd-page pd-page--printed">

      <nav class="pd-breadcrumb reveal" aria-label="Breadcrumb">
        <a href="index.html">Home</a>
        <span class="pd-breadcrumb-sep">›</span>
        <a href="products.html">Catalogue</a>
        <span class="pd-breadcrumb-sep">›</span>
        <a href="products.html#vol-1">${cat ? cat.title : 'Volume I'}</a>
        <span class="pd-breadcrumb-sep">›</span>
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
            <img src="assets/v1/${p.photo}" alt="${p.name}" width="1200" height="900" onerror="this.parentElement.classList.add('pd-hero-frame--placeholder')"/>
          </div>
        </div>
        <aside class="pd-body-side reveal" style="--d:120ms">

          <!-- Short description -->
          <p class="pd-short-desc">${shortDesc}</p>

          ${isComingSoon ? `
            <div class="pd-coming-soon">
              <span class="eyebrow">Coming Soon</span>
              <p class="caption" style="margin-top:.5rem">This product is in development. Register your interest below.</p>
            </div>
          ` : ''}

          ${hasVariants ? `
            <div class="pd-selector" data-selector="variant">
              <label class="caption">Size / Variant</label>
              <div class="pd-selector-options">
                ${p.variants.map((v, i) => `
                  <button class="pd-selector-btn ${i === 0 ? 'active' : ''}" data-variant="${v.id}">
                    <span class="pd-selector-name">${v.name}</span>
                    <span class="pd-selector-desc">${v.description}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${hasPricing && availableMaterials.length > 0 ? `
            <div class="pd-selector" data-selector="material">
              <label class="caption">Material</label>
              <div class="pd-selector-options pd-selector-options--inline">
                ${availableMaterials.map((m, i) => {
                  const mat = materials.find(x => x.id === m) || { id: m, name: m.toUpperCase(), description: '' };
                  return `
                    <button class="pd-selector-btn pd-selector-btn--chip ${i === 0 ? 'active' : ''}" data-material="${m}">
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

          <a class="cta magnetic pd-cta" id="pdEnquiryCta"
             href="${enquiryHref({
               name: p.name,
               sku: p.sku,
               material: availableMaterials[0],
               variant: hasVariants ? p.variants[0].name : null,
               price: hasPricing ? formatPrice(hasVariants ? p.pricing[p.variants[0].id][availableMaterials[0]] : p.pricing[availableMaterials[0]]) : null,
               volume: 1
             })}"
             target="_blank" rel="noopener"
             data-cursor="ASK">
            Enquire on WhatsApp
            <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
          </a>

          <!-- Trust signals -->
          <div class="pd-trust-signals">
            <div class="pd-lead-time">
              <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2"/><path d="M8 4.5V8l2.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              <span>Made to order · ~1 week</span>
            </div>
            ${reviewCount > 0 ? `
              <a href="#reviews" class="pd-rating-badge">
                <svg viewBox="0 0 12 12"><path d="M6 1l1.5 3 3.5.5-2.5 2.5.5 3.5L6 9l-3 1.5.5-3.5L1 4.5 4.5 4z" fill="currentColor"/></svg>
                <span>${avgRating} · ${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}</span>
              </a>
            ` : ''}
            <div class="pd-delivery">
              <svg viewBox="0 0 16 16" fill="none"><path d="M1 4h9v7H1z" stroke="currentColor" stroke-width="1.2"/><path d="M10 6h3l2 3v2h-5V6z" stroke="currentColor" stroke-width="1.2"/><circle cx="4" cy="12" r="1.5" stroke="currentColor" stroke-width="1.2"/><circle cx="12" cy="12" r="1.5" stroke="currentColor" stroke-width="1.2"/></svg>
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

      ${renderReviewsSection(p.sku)}

      ${related.length ? `
        <section class="pd-related reveal">
          <header class="pd-related-head">
            <span class="eyebrow">M o r e &nbsp; ${cat ? cat.title : 'Products'}</span>
          </header>
          <div class="pd-related-grid">
            ${related.map(o => `
              <a class="pd-related-card" href="product.html#${encodeURIComponent(o.sku)}" data-cursor="VIEW">
                <div class="pd-related-img">
                  <img src="assets/v1/${o.photo}" alt="${o.name}" loading="lazy" onerror="this.style.display='none'"/>
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
    <div class="pd-mobile-cta" id="pdMobileCta">
      <a class="cta magnetic" id="pdMobileCtaBtn"
         href="${enquiryHref({
           name: p.name,
           sku: p.sku,
           material: availableMaterials[0],
           variant: hasVariants ? p.variants[0].name : null,
           price: hasPricing ? formatPrice(hasVariants ? p.pricing[p.variants[0].id][availableMaterials[0]] : p.pricing[availableMaterials[0]]) : null,
           volume: 1
         })}"
         target="_blank" rel="noopener"
         data-cursor="ASK">
        Enquire on WhatsApp
        <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
      </a>
    </div>
  `;
}


// ─── V1 selector interactivity ───
function initPrintedSelectors(p){
  const hasVariants = p.variants && p.variants.length > 0;
  const hasPricing = p.pricing !== null;
  if (!hasPricing) return;

  const priceEl = document.getElementById('pdPrice');
  const ctaEl = document.getElementById('pdEnquiryCta');
  const mobileCtaEl = document.getElementById('pdMobileCtaBtn');
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
    if (mobileCtaEl) mobileCtaEl.href = href;
  }

  // Variant selector
  document.querySelectorAll('[data-variant]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-variant]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVariant = btn.dataset.variant;
      updatePrice();
    });
  });

  // Material selector
  document.querySelectorAll('[data-material]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-material]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMaterial = btn.dataset.material;
      updatePrice();
    });
  });
}


// ─── V2 box detail layout · big photo + rich description + specs ───
function renderBox(b){
  const desc = (b.description || []).map(p => `<p>${p}</p>`).join('');
  const specs = [
    ['Size',     b.size],
    ['Weight',   b.weight],
    ['Temp',     b.temp],
    ['Humidity', b.humidity],
    ['Light',    b.light],
    ['Power',    b.power],
    ['Capacity', b.capacity],
    ['Plants',   b.plants],
    ['Edition',  b.edition],
    ['Lead time',b.lead],
    ['Warranty', b.warranty],
    ['Price',    b.price]
  ].filter(([_, v]) => v);

  const related = volumeTwo.boxes.filter(o => o.sku !== b.sku).slice(0, 4);

  return `
    <article class="pd-page pd-page--box">

      <header class="pd-head reveal">
        <a href="products.html" class="back-link caption">← Catalogue</a>
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
        </div>
        <aside class="pd-body-side reveal" style="--d:120ms">
          <dl class="pd-specs">
            ${specs.map(([k, v]) => `
              <div>
                <dt class="caption">${k}</dt>
                <dd>${v}</dd>
              </div>
            `).join('')}
          </dl>
          <a class="cta magnetic pd-cta"
             href="${enquiryHref({ name: b.sku, sku: b.sku, volume: 2 })}"
             target="_blank" rel="noopener"
             data-cursor="ASK">
            Enquire on WhatsApp
            <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
          </a>
          <p class="caption pd-note">Coming soon · register interest now</p>
        </aside>
      </section>

      ${related.length ? `
        <section class="pd-related reveal">
          <header class="pd-related-head">
            <span class="eyebrow">M o r e &nbsp; f r o m &nbsp; V o l u m e &nbsp; I I</span>
          </header>
          <div class="pd-related-grid">
            ${related.map(o => `
              <a class="pd-related-card" href="product.html#${encodeURIComponent(o.sku)}" data-cursor="VIEW">
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
    <div class="pd-mobile-cta">
      <a class="cta magnetic"
         href="${enquiryHref({ name: b.sku, sku: b.sku, volume: 2 })}"
         target="_blank" rel="noopener"
         data-cursor="ASK">
        Enquire on WhatsApp
        <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
      </a>
    </div>
  `;
}


// ─── V3 vivarium · concept + research note ───
function renderVivarium(v){
  return `
    <article class="pd-page pd-page--vivarium">

      <header class="pd-head reveal">
        <a href="products.html" class="back-link caption">← Catalogue</a>
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
          <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
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
        <svg viewBox="0 0 16 8" fill="none"><path d="M0 4 H14 M10 1 L14 4 L10 7" stroke="currentColor" stroke-width="1.2"/></svg>
      </a>
    </div>
  `;
}


// ─── Render product by ID ───
function renderProduct(id){
  const host = document.getElementById('productDetail');
  if (!host) return;

  // Clear previous content (keep loading/notfound placeholders if they exist)
  const existingArticle = host.querySelector('article');
  if (existingArticle) existingArticle.remove();

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
  const photo = found.kind === 'printed' ? `assets/v1/${found.data.photo}`
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
  updateMeta('meta[property="og:image"]', `https://earthbox.in/${photo}`);
  updateMeta('meta[name="twitter:title"]', `EarthBox — ${name}`);
  updateMeta('meta[name="twitter:description"]', description.slice(0, 160));

  let html;
  if (found.kind === 'printed')    html = renderPrinted(found.data);
  else if (found.kind === 'box')   html = renderBox(found.data);
  else                             html = renderVivarium(found.data);

  document.getElementById('pdLoading')?.remove();
  document.getElementById('pdNotFound')?.remove();
  host.insertAdjacentHTML('beforeend', html);

  // Initialize reveals for dynamically added content
  observeReveals(host);

  // Initialize selectors for V1 products
  if (found.kind === 'printed') {
    initPrintedSelectors(found.data);
  }

  // Scroll to top when navigating to new product
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // GA4: Track product view
  if (typeof gtag === 'function') {
    gtag('event', 'product_view', {
      product_name: name,
      product_sku: id,
      product_volume: found.volume,
      product_type: found.kind
    });
  }

  // GA4: Track enquiry clicks
  host.querySelectorAll('a[href*="wa.me"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'enquire_click', {
          product_name: name,
          product_sku: id,
          product_volume: found.volume
        });
      }
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

  // Initial render
  renderProduct(getProductId());

  // Re-render on hash change (for related product links)
  window.addEventListener('hashchange', () => {
    renderProduct(getProductId());
  });
}
