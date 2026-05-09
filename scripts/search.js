// ─────────────────────────────────────────────────────────────────────
// search.js · Full-screen search overlay
//
// Icon in nav → expands to overlay with instant search
// Searches: products, blog articles, pages
// ─────────────────────────────────────────────────────────────────────

import { volumeOne } from '../data/volume-one.js';
import { articles } from '../data/articles.js';

const PAGES = [
  { title: 'Home', url: 'index.html', keywords: ['home', 'earthbox', 'terrariums', 'planters'] },
  { title: 'Catalogue', url: 'products.html', keywords: ['catalogue', 'catalog', 'products', 'shop', 'buy'] },
  { title: 'Journal', url: 'blog.html', keywords: ['journal', 'blog', 'articles', 'guides'] },
  { title: 'About', url: 'about.html', keywords: ['about', 'story', 'mumbai', 'studio'] }
];

let overlay = null;
let input = null;
let resultsContainer = null;
let isOpen = false;

function createOverlay() {
  overlay = document.createElement('div');
  overlay.className = 'search-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="search-container">
      <div class="search-header">
        <div class="search-input-wrap">
          <svg class="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" class="search-input" placeholder="Search products, articles..." autocomplete="off" />
        </div>
        <button class="search-close" type="button" aria-label="Close search">
          <span>ESC</span>
        </button>
      </div>
      <div class="search-results"></div>
      <div class="search-empty">
        <p class="search-empty-text">Start typing to search...</p>
        <div class="search-suggestions">
          <span class="caption">Try:</span>
          <button type="button" class="search-suggestion">Terrarium</button>
          <button type="button" class="search-suggestion">Moss Pole</button>
          <button type="button" class="search-suggestion">Planters</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  input = overlay.querySelector('.search-input');
  resultsContainer = overlay.querySelector('.search-results');

  // Event listeners
  overlay.querySelector('.search-close').addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeSearch();
  });

  input.addEventListener('input', debounce(handleSearch, 150));

  // Suggestion clicks
  overlay.querySelectorAll('.search-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      input.value = btn.textContent;
      handleSearch();
    });
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeSearch();
  });
}

function createSearchButton() {
  const btn = document.createElement('button');
  btn.className = 'search-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Search');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  `;
  btn.addEventListener('click', openSearch);
  return btn;
}

function openSearch() {
  if (!overlay) createOverlay();
  isOpen = true;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => input.focus(), 100);
}

function closeSearch() {
  if (!overlay) return;
  isOpen = false;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  input.value = '';
  resultsContainer.innerHTML = '';
  overlay.querySelector('.search-empty').style.display = '';
}

function handleSearch() {
  const query = input.value.trim().toLowerCase();
  const emptyState = overlay.querySelector('.search-empty');

  if (!query) {
    resultsContainer.innerHTML = '';
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  const products = searchProducts(query);
  const articleResults = searchArticles(query);
  const pages = searchPages(query);

  if (products.length === 0 && articleResults.length === 0 && pages.length === 0) {
    resultsContainer.innerHTML = `
      <div class="search-no-results">
        <p>No results for "<strong>${escapeHtml(query)}</strong>"</p>
        <p class="muted">Try a different search term</p>
      </div>
    `;
    return;
  }

  let html = '';

  if (products.length > 0) {
    html += `
      <div class="search-group">
        <h3 class="search-group-title caption">Products</h3>
        <ul class="search-list">
          ${products.map(p => `
            <li>
              <a href="product.html#${p.sku}" class="search-result">
                <span class="search-result-name">${highlightMatch(p.name, query)}</span>
                <span class="search-result-meta">${p.category}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (articleResults.length > 0) {
    html += `
      <div class="search-group">
        <h3 class="search-group-title caption">Articles</h3>
        <ul class="search-list">
          ${articleResults.map(a => `
            <li>
              <a href="blog/${a.slug}.html" class="search-result">
                <span class="search-result-name">${highlightMatch(a.title, query)}</span>
                <span class="search-result-meta">${a.category}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  if (pages.length > 0) {
    html += `
      <div class="search-group">
        <h3 class="search-group-title caption">Pages</h3>
        <ul class="search-list">
          ${pages.map(p => `
            <li>
              <a href="${p.url}" class="search-result">
                <span class="search-result-name">${highlightMatch(p.title, query)}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  resultsContainer.innerHTML = html;
}

function searchProducts(query) {
  if (!volumeOne) return [];
  return volumeOne.filter(p => {
    const searchable = `${p.name} ${p.category} ${p.description || ''}`.toLowerCase();
    return searchable.includes(query);
  }).slice(0, 5);
}

function searchArticles(query) {
  if (!articles) return [];
  return articles.filter(a => {
    const searchable = `${a.title} ${a.category} ${a.excerpt || ''}`.toLowerCase();
    return searchable.includes(query);
  }).slice(0, 5);
}

function searchPages(query) {
  return PAGES.filter(p => {
    const searchable = `${p.title} ${p.keywords.join(' ')}`.toLowerCase();
    return searchable.includes(query);
  });
}

function highlightMatch(text, query) {
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function debounce(fn, ms) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function initSearch() {
  const runhead = document.querySelector('.runhead');
  if (!runhead) return;

  // Desktop: add search button before theme toggle
  const searchBtn = createSearchButton();
  searchBtn.classList.add('search-btn-desktop');
  const themeToggle = runhead.querySelector('.theme-toggle-desktop');
  if (themeToggle) {
    runhead.insertBefore(searchBtn, themeToggle);
  } else {
    runhead.appendChild(searchBtn);
  }

  // Mobile: add to menu panel after it's created
  setTimeout(() => {
    const mobileNav = document.querySelector('.mobile-nav nav ul');
    if (mobileNav) {
      const li = document.createElement('li');
      li.className = 'mobile-nav-search';
      li.innerHTML = `<button type="button" class="mobile-search-trigger">Search</button>`;
      li.querySelector('button').addEventListener('click', () => {
        document.body.classList.remove('menu-open');
        document.querySelector('.mobile-nav')?.classList.remove('is-open');
        document.querySelector('.mobile-nav-overlay')?.classList.remove('is-open');
        setTimeout(openSearch, 100);
      });
      mobileNav.appendChild(li);
    }
  }, 100);

  // Keyboard shortcut: Cmd/Ctrl + K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (isOpen) closeSearch();
      else openSearch();
    }
  });
}
