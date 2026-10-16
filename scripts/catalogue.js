// ─────────────────────────────────────────────────────────────────────
// catalogue.js · single-page catalogue: pill tabs + search overlay
//
// Pills swap content via the [hidden] attribute. URL hash updates for
// shareable links (#vol-1, #vol-2, #vol-3).
//
// Search opens as an overlay, filters across all volumes.
// No-op on pages without .vol-pills.
// ─────────────────────────────────────────────────────────────────────

import { track } from './util.js';
import { volumeOne, categories as v1Categories } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';

// ─── Tab switching ───
/** @param {string} volNum  '1' | '2' | '3' */
function setActiveTab(volNum, isUserAction = false){
  const pills  = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.vol-pill'));
  const panels = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.vol-panel'));

  pills.forEach(p => {
    const isActive = p.dataset.vol === String(volNum);
    p.classList.toggle('is-active', isActive);
    p.setAttribute('aria-selected', String(isActive));
    p.tabIndex = isActive ? 0 : -1;   // one Tab stop; arrows move between tabs
  });

  let activePanel = /** @type {HTMLElement | null} */ (null);
  panels.forEach(p => {
    const shouldShow = p.dataset.vol === String(volNum);
    p.hidden = !shouldShow;
    if (shouldShow) activePanel = p;
  });

  // Force reveal animation for tab content - IntersectionObserver doesn't
  // reliably fire for elements that are already in viewport when observed
  if (activePanel) {
    requestAnimationFrame(() => {
      /** @type {HTMLElement} */ (activePanel).querySelectorAll('.reveal, .reveal-clip').forEach(el => {
        el.classList.add('in');
      });
    });
  }

  history.replaceState(null, '', `#vol-${volNum}`);

  // GA4: Track volume switches (only user-initiated, not initial load)
  if (isUserAction) {
    /** @type {Record<string, string | undefined>} */
    const volNames = { 1: 'Volume I - Now', 2: 'Volume II - Next', 3: 'Volume III - Horizon' };
    track('volume_switch', {
      volume_number: volNum,
      volume_name: volNames[volNum] || `Volume ${volNum}`
    });
  }
}


// ─── Search index — flatten all volumes ───
/** @typedef {ReturnType<typeof buildIndex>[number]} SearchItem */
function buildIndex(){
  const items = [];

  volumeOne.forEach(p => {
    const cat = v1Categories.find(c => c.slug === p.category);
    items.push({
      vol: 1,
      sku:   p.sku,
      name:  p.name,
      sub:   cat ? cat.title : '',
      desc:  p.description,
      blob: [p.name, p.category, p.description, p.sku].join(' ').toLowerCase()
    });
  });

  volumeTwo.boxes.forEach(b => {
    items.push({
      vol: 2,
      sku:  b.sku,
      name: b.sku,
      sub:  b.tagline,
      desc: `${b.tagline} ${b.plants}`,
      blob: [b.sku, b.name, b.tagline, b.plants].join(' ').toLowerCase()
    });
  });

  items.push({
    vol: 3,
    sku:  'VIV-III',
    name: volumeThree.title,
    sub:  volumeThree.subtitle,
    desc: volumeThree.description,
    blob: [volumeThree.title, volumeThree.subtitle, volumeThree.description].join(' ').toLowerCase()
  });

  return items;
}


/**
 * @param {string} query
 * @param {SearchItem[]} items
 */
function renderSearchResults(query, items){
  const list  = document.getElementById('searchResultsList');
  const empty = document.getElementById('searchEmpty');
  const hint  = document.getElementById('searchHint');
  if (!list) return;

  const q = query.toLowerCase().trim();

  if (q.length === 0){
    list.innerHTML = '';
    if (empty) empty.hidden = true;
    if (hint) hint.hidden = false;
    return 0;
  }

  if (hint) hint.hidden = true;
  const matches = items.filter(it => it.blob.includes(q));

  if (matches.length === 0){
    list.innerHTML = '';
    if (empty) empty.hidden = false;
    return 0;
  }
  if (empty) empty.hidden = true;

  list.innerHTML = matches.map(m => `
    <a class="search-result"
       href="/product/${encodeURIComponent(m.sku)}"
       data-cursor="VIEW">
      <div class="search-result-vol caption">Vol. ${m.vol === 1 ? 'I' : m.vol === 2 ? 'II' : 'III'}</div>
      <div class="search-result-meta">
        <h3 class="search-result-name">${m.name}</h3>
        <p class="search-result-desc italic">${m.sub || m.desc}</p>
      </div>
      <span class="search-result-cta caption">View →</span>
    </a>
  `).join('');

  return matches.length;
}


// ─── Boot ───
export function initCatalogue(){
  const pills = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.vol-pill'));
  // Tabs keyboard pattern (iconography audit C1): arrows, Home/End.
  pills.forEach((p, i) => p.addEventListener('keydown', (e) => {
    const n = /** @type {Record<string, number | undefined>} */ ({ ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: pills.length - 1 })[e.key];
    if (n === undefined) return;
    e.preventDefault();
    const next = pills[(n + pills.length) % pills.length];
    next.click(); next.focus();
  }));
  if (!pills.length) return;

  const index = buildIndex();

  // ─── Pill clicks ───
  pills.forEach(pill => {
    pill.addEventListener('click', () => setActiveTab(/** @type {string} */ (pill.dataset.vol), true));
  });

  // ─── Initial tab from URL hash ───
  const hash = location.hash.match(/^#vol-([123])$/);
  const initialVol = hash ? hash[1] : '1';
  setActiveTab(initialVol);

  // ─── Search overlay ───
  const searchBtn     = document.getElementById('catalogueSearchBtn');
  const searchOverlay = document.getElementById('catalogueSearchOverlay');
  const searchClose   = document.getElementById('catalogueSearchClose');
  const searchInput   = /** @type {HTMLInputElement | null} */ (document.getElementById('cat-search'));
  const backdrop      = searchOverlay?.querySelector('.search-overlay-backdrop');

  function openSearch(){
    if (!searchOverlay) return;
    searchOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => searchInput?.focus(), 50);
  }

  function closeSearch(){
    if (!searchOverlay) return;
    searchOverlay.hidden = true;
    document.body.style.overflow = '';
    if (searchInput) searchInput.value = '';
    renderSearchResults('', index);
  }

  if (searchBtn){
    searchBtn.addEventListener('click', openSearch);
    if (searchBtn.dataset.pending) openSearch();   // tapped before this loaded (main.js)
    delete searchBtn.dataset.pending;
  }

  if (searchClose){
    searchClose.addEventListener('click', closeSearch);
  }

  if (backdrop){
    backdrop.addEventListener('click', closeSearch);
  }

  // Keyboard: Escape to close, Cmd/Ctrl+K to open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchOverlay && !searchOverlay.hidden){
      closeSearch();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k'){
      e.preventDefault();
      if (searchOverlay?.hidden){
        openSearch();
      } else {
        closeSearch();
      }
    }
  });

  // Search input
  if (searchInput){
    searchInput.addEventListener('input', () => {
      renderSearchResults(searchInput.value, index);
    });
  }

  // ─── Sticky bar detection ───
  const catalogueBar = document.querySelector('.catalogue-bar');
  if (catalogueBar){
    const observer = new IntersectionObserver(
      ([entry]) => {
        catalogueBar.classList.toggle('is-stuck', !entry.isIntersecting);
      },
      { rootMargin: '-61px 0px 0px 0px', threshold: 0 }
    );

    const sentinel = document.createElement('div');
    sentinel.className = 'sticky-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    /** @type {ParentNode} */ (catalogueBar.parentNode).insertBefore(sentinel, catalogueBar);
    observer.observe(sentinel);
  }
}
