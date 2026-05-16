// ─────────────────────────────────────────────────────────────────────
// render-article.js · Individual article page renderer
// Reads slug from data-article attribute on body
// ─────────────────────────────────────────────────────────────────────

import { articles, categories } from '../data/articles.js';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getCategoryTitle = (slug) => {
  const cat = categories.find(c => c.slug === slug);
  return cat ? cat.title : slug;
};

function renderArticleHead(article) {
  const host = document.getElementById('articleHead');
  if (!host) return;

  host.innerHTML = `
    <a class="back-link" href="../blog.html">← Back to Journal</a>
    <span class="eyebrow">${getCategoryTitle(article.category)}</span>
    <h1 class="scramble">${article.title}</h1>
    <p class="article-subtitle">${article.subtitle}</p>
    <p class="article-byline">
      By ${article.author} <span>·</span> ${formatDate(article.publishDate)} <span>·</span> ${article.readTime} read
    </p>
  `;
}

function renderArticleBody(article) {
  const host = document.getElementById('articleBody');
  if (!host) return;

  // Main body content (full prose with images)
  const bodyContent = article.body || '';

  // FAQ section
  const faqSection = article.faqs && article.faqs.length ? `
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      ${article.faqs.map(faq => `
        <div class="faq-item">
          <p class="faq-question">${faq.question}</p>
          <p class="faq-answer">${faq.answer}</p>
        </div>
      `).join('')}
    </section>
  ` : '';

  // Related articles
  const related = (article.relatedArticles || [])
    .map(slug => articles.find(a => a.slug === slug))
    .filter(Boolean);

  const relatedSection = related.length ? `
    <section class="related-section">
      <h2>Continue Reading</h2>
      <div class="related-grid">
        ${related.map(r => `
          <a class="article-card" href="${r.slug}.html">
            <div class="article-card-inner">
              <span class="article-category">${getCategoryTitle(r.category)}</span>
              <h3>${r.title}</h3>
            </div>
          </a>
        `).join('')}
      </div>
    </section>
  ` : '';

  host.innerHTML = bodyContent + faqSection + relatedSection;
}

function injectSeoMeta(article) {
  // Dynamic page title
  document.title = `${article.metaTitle || article.title} | EarthBox`;

  // Helper to create or update meta tags
  const setMeta = (attr, key, content) => {
    let tag = document.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // Standard meta tags
  setMeta('name', 'description', article.metaDescription);
  setMeta('name', 'keywords', (article.keywords || []).join(', '));
  setMeta('name', 'author', article.author);

  // Open Graph tags (Facebook, LinkedIn, WhatsApp)
  setMeta('property', 'og:type', 'article');
  setMeta('property', 'og:url', `https://earthbox.in/blog/${article.slug}`);
  setMeta('property', 'og:title', article.title);
  setMeta('property', 'og:description', article.metaDescription);
  setMeta('property', 'og:image', article.featuredImage || 'https://earthbox.in/assets/og-journal.jpg');
  setMeta('property', 'og:site_name', 'EarthBox');
  setMeta('property', 'article:published_time', article.publishDate);
  setMeta('property', 'article:author', article.author);

  // Twitter Card tags
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', article.title);
  setMeta('name', 'twitter:description', article.metaDescription);
  setMeta('name', 'twitter:image', article.featuredImage || 'https://earthbox.in/assets/og-journal.jpg');

  // Canonical URL
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', `https://earthbox.in/blog/${article.slug}`);
}

function injectSchema(article) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.metaDescription,
    "author": {
      "@type": "Person",
      "name": article.author,
      "url": "https://earthbox.in/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "EarthBox",
      "logo": { "@type": "ImageObject", "url": "https://earthbox.in/assets/logo.webp" }
    },
    "datePublished": article.publishDate,
    "mainEntityOfPage": `https://earthbox.in/blog/${article.slug}`
  };

  const faqSchema = article.faqs && article.faqs.length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": article.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
    }))
  } : null;

  const script1 = document.createElement('script');
  script1.type = 'application/ld+json';
  script1.textContent = JSON.stringify(schema);
  document.head.appendChild(script1);

  if (faqSchema) {
    const script2 = document.createElement('script');
    script2.type = 'application/ld+json';
    script2.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script2);
  }
}

export function initArticle() {
  const slug = document.body.dataset.article;
  if (!slug) return;

  const article = articles.find(a => a.slug === slug);
  if (!article) return;

  injectSeoMeta(article);
  renderArticleHead(article);
  renderArticleBody(article);
  injectSchema(article);
}
