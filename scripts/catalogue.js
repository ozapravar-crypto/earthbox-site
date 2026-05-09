// ─────────────────────────────────────────────────────────────────────
// catalogue.js · single-page catalogue: tab switching + search
//
// Tabs swap content in/out via the [hidden] attribute. URL hash
// (#vol-1, #vol-2, #vol-3) updates so links can be shared.
//
// Search filters across all three volumes by name / sub / description.
// While search has text, tabs hide and a flat search-results panel
// shows. Clearing the search restores the active tab.
//
// No-op on pages without .vol-tabs.
// ─────────────────────────────────────────────────────────────────────

import { volumeOne, categories as v1Categories } from '../data/volume-one.js';
import { volumeTwo, volumeThree } from '../data/upcoming.js';

const ENQUIRY_WHATSAPP = '918104811584';

function enquiryHref(itemName){
  const text = `Hi Aayush, I'm interested in ${itemName}. Could you share availability, customisation, and pricing?`;
  return `https://wa.me/${ENQUIRY_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

// ─── Tab switching ───
function setActiveTab(volNum){
  const tabs   = document.querySelectorAll('.vol-tab');
  const panels = document.querySelectorAll('.vol-panel');

  tabs.forEach(t => {
    const isActive = t.dataset.vol === String(volNum);
    t.classList.toggle('is-active', isActive);
    t.setAttribute('aria-selected', String(isActive));
  });

  panels.forEach(p => {
    p.hidden = p.dataset.vol !== String(volNum);
  });

  // Reflect in URL hash so links are shareable; replace (don't push) so
  // back button doesn't fill with tab clicks.
  if (history.replaceState){
    history.replaceState(null, '', `#vol-${volNum}`);
  }
}


// ─── Search index — flatten all volumes into a searchable shape ───
function buildIndex(){
  const items = [];

  // Volume I — 3D Printed accessories
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

  // Volume II — boxes
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

  // Volume III — single horizon entry
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


function renderSearchResults(query, items){
  const list  = document.getElementById('searchResultsList');
  const empty = document.getElementById('searchEmpty');
  if (!list || !empty) return;

  const q = query.toLowerCase().trim();
  const matches = items.filter(it => it.blob.includes(q));

  if (matches.length === 0){
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  list.innerHTML = matches.map(m => `
    <a class="search-result"
       href="product.html#${encodeURIComponent(m.sku)}"
       data-cursor="VIEW">
      <div class="search-result-vol caption">Vol. ${m.vol === 1 ? 'I' : m.vol === 2 ? 'II' : 'III'}</div>
      <div class="search-result-meta">
        <h3 class="search-result-name">${m.name}</h3>
        <p class="search-result-desc italic">${m.sub || m.desc}</p>
      </div>
      <span class="search-result-cta caption">View details →</span>
    </a>
  `).join('');

  return matches.length;
}


// ─── Boot ───
export function initCatalogue(){
  const tabs       = document.querySelectorAll('.vol-tab');
  if (!tabs.length) return;

  const tabsSection   = document.querySelector('.catalogue-tabs');
  const panelsWrap    = document.querySelector('.vol-panels');
  const newlySection  = document.getElementById('newlyLaunchedSection');
  const searchInput   = document.getElementById('cat-search');
  const searchClear   = document.getElementById('cat-search-clear');
  const searchCount   = document.getElementById('cat-search-count');
  const searchPanel   = document.getElementById('searchResults');
  const searchEmpty   = document.getElementById('searchEmpty');
  const searchClearLink = document.getElementById('searchEmptyClear');

  const index = buildIndex();
  const totalItems = index.length;

  // ─── Tab clicks ───
  tabs.forEach(tab => {
    tab.addEventListener('click', () => setActiveTab(tab.dataset.vol));
  });

  // ─── Initial tab from URL hash, else default to Volume I ───
  const hash = location.hash.match(/^#vol-([123])$/);
  const initialVol = hash ? hash[1] : '1';
  setActiveTab(initialVol);

  // ─── Search behaviour ───
  if (searchInput){
    const update = () => {
      const q = searchInput.value.trim();

      if (q.length === 0){
        // Empty query: show tabs + active panel, hide search panel
        if (tabsSection)  tabsSection.hidden  = false;
        if (panelsWrap)   panelsWrap.hidden   = false;
        if (newlySection) newlySection.hidden = false;
        if (searchPanel)  searchPanel.hidden  = true;
        if (searchClear)  searchClear.hidden  = true;
        if (searchCount)  searchCount.textContent = '';
        return;
      }

      // Has query: hide tabs + panels, show flat search results
      if (tabsSection)  tabsSection.hidden  = true;
      if (panelsWrap)   panelsWrap.hidden   = true;
      if (newlySection) newlySection.hidden = true;
      if (searchPanel)  searchPanel.hidden  = false;
      if (searchClear)  searchClear.hidden  = false;

      const count = renderSearchResults(q, index);
      if (searchCount){
        searchCount.textContent = count != null
          ? `Showing ${count} of ${totalItems} pieces`
          : '';
      }
    };

    searchInput.addEventListener('input', update);
    if (searchClear){
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        update();
      });
    }
    if (searchClearLink){
      searchClearLink.addEventListener('click', () => {
        searchInput.value = '';
        searchInput.focus();
        update();
      });
    }
  }

  // ─── Sticky tabs detection ───
  const catalogueTabs = document.querySelector('.catalogue-tabs');
  if (catalogueTabs){
    const observer = new IntersectionObserver(
      ([entry]) => {
        catalogueTabs.classList.toggle('is-stuck', !entry.isIntersecting);
      },
      { rootMargin: '-61px 0px 0px 0px', threshold: 0 }
    );

    // Create a sentinel element just above the tabs
    const sentinel = document.createElement('div');
    sentinel.className = 'sticky-sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    catalogueTabs.parentNode.insertBefore(sentinel, catalogueTabs);
    observer.observe(sentinel);
  }
}
