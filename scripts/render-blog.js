// ─────────────────────────────────────────────────────────────────────
// render-blog.js · Journal index page renderer
// ─────────────────────────────────────────────────────────────────────

import { articles, categories } from '../data/articles.js';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getCategoryTitle = (slug) => {
  const cat = categories.find(c => c.slug === slug);
  return cat ? cat.title : slug;
};

function renderArticleCard(article) {
  return `
    <a class="article-card reveal" href="blog/${article.slug}.html" data-category="${article.category}">
      <div class="article-card-inner">
        <div class="article-meta">
          <span class="article-category">${getCategoryTitle(article.category)}</span>
          <span class="article-date">${formatDate(article.publishDate)}</span>
        </div>
        <h3>${article.title}</h3>
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

  host.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      host.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      filterArticles(btn.dataset.filter);
    });
  });
}

function filterArticles(category) {
  const cards = document.querySelectorAll('.article-card');
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
    new Date(b.publishDate) - new Date(a.publishDate)
  );

  host.innerHTML = sorted.map(renderArticleCard).join('');
}

export function initBlog() {
  renderFilters();
  renderArticleGrid();
}
