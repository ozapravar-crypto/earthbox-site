// ─────────────────────────────────────────────────────────────────────
// render-blog.js · Journal index page renderer
// ─────────────────────────────────────────────────────────────────────

import { articles, categories } from '../data/articles.js';
import { observeReveals } from './reveal.js';

/** @typedef {import('../data/articles.js').Article} Article */

/** @param {string} dateStr */
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** @param {string} slug */
const getCategoryTitle = (slug) => {
  const cat = categories.find(c => c.slug === slug);
  return cat ? cat.title : slug;
};

/** @param {Article} article */
function renderArticleCard(article) {
  return `
    <a class="article-card reveal" href="/blog/${article.slug}" data-category="${article.category}">
      <div class="article-card-inner">
        <div class="article-meta">
          <span class="article-category">${getCategoryTitle(article.category)}</span>
          <span class="article-date">${formatDate(article.publishDate)}</span>
        </div>
        <h2>${article.title}</h2>
        <p class="article-excerpt">${article.excerpt}</p>
        <span class="article-read">${article.readTime} read →</span>
      </div>
    </a>
  `;
}

function renderFilters() {
  const host = document.getElementById('journalFilters');
  if (!host) return;

  const allBtn = `<button class="filter-btn is-active" data-filter="all">All</button>`;
  const catBtns = categories.map(c =>
    `<button class="filter-btn" data-filter="${c.slug}">${c.title}</button>`
  ).join('');

  host.innerHTML = allBtn + catBtns;

  host.querySelectorAll('.filter-btn').forEach(el => {
    const btn = /** @type {HTMLButtonElement} */ (el);
    btn.addEventListener('click', () => {
      host.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      filterArticles(/** @type {string} */ (btn.dataset.filter));
    });
  });
}

/** @param {string} category */
function filterArticles(category) {
  const cards = /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('.article-card'));
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

function renderArticleGrid() {
  const host = document.getElementById('journalGrid');
  if (!host) return;

  const sorted = [...articles].sort((a, b) =>
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );

  host.innerHTML = sorted.map(renderArticleCard).join('');
  observeReveals(host);   // drawn after initReveal: unregistered cards stayed invisible (QA-017)
}

export function initBlog() {
  renderFilters();
  renderArticleGrid();
}
