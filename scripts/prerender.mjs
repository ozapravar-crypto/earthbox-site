#!/usr/bin/env node
/**
 * prerender.mjs — bake article HTML into blog/*.html at build time.
 *
 * WHY: the 2026-09-28 audit measured what a non-JS crawler sees on an article
 * page — 525 characters of navigation, zero <h1>, zero <h2>. Everything real
 * was injected at runtime by scripts/render-article.js. Google renders JS;
 * GPTBot, ClaudeBot, PerplexityBot and CCBot do not. The entire Journal — the
 * only thing on this site an answer engine would ever cite — was invisible to
 * them.
 *
 * This runs the SAME logic as render-article.js, at build time, and writes the
 * result into the file. The client script still runs and re-renders the same
 * markup, so the scramble animation and every interaction are untouched.
 *
 * Run:  npm run prerender    (or: node scripts/prerender.mjs)
 * Check: npm run check:prerender  — fails if any article page has no <h1>.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.earthbox.in';           // canonical host — the apex 307s here
const { articles, categories } = await import(path.join(ROOT, 'data/articles.js'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const catTitle = (slug) => (categories.find((c) => c.slug === slug)?.title) ?? slug;

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN',
  { day: 'numeric', month: 'long', year: 'numeric' });

const articleUrl = (slug) => `${SITE}/blog/${slug}.html`;

function head(a) {
  return `
    <a class="back-link" href="../blog.html">← Back to Journal</a>
    <span class="eyebrow">${esc(catTitle(a.category))}</span>
    <h1 class="scramble">${esc(a.title)}</h1>
    <p class="article-subtitle">${esc(a.subtitle)}</p>
    <p class="article-byline">
      By ${esc(a.author)} <span>·</span> ${fmtDate(a.publishDate)} <span>·</span> ${esc(a.readTime)} read
    </p>
  `;
}

function body(a) {
  const faqs = a.faqs?.length ? `
    <section class="faq-section">
      <h2>Frequently Asked Questions</h2>
      ${a.faqs.map((f) => `
        <div class="faq-item">
          <p class="faq-question">${esc(f.question)}</p>
          <p class="faq-answer">${esc(f.answer)}</p>
        </div>
      `).join('')}
    </section>` : '';

  const rel = (a.relatedArticles ?? []).map((s) => articles.find((x) => x.slug === s)).filter(Boolean);
  const related = rel.length ? `
    <section class="related-section">
      <h2>Continue Reading</h2>
      <div class="related-grid">
        ${rel.map((r) => `
          <a class="article-card" href="${r.slug}.html">
            <div class="article-card-inner">
              <span class="article-category">${esc(catTitle(r.category))}</span>
              <h3>${esc(r.title)}</h3>
            </div>
          </a>
        `).join('')}
      </div>
    </section>` : '';

  return (a.body ?? '') + faqs + related;
}

function meta(a) {
  const url = articleUrl(a.slug);
  const img = a.featuredImage
    ? (a.featuredImage.startsWith('http') ? a.featuredImage : `${SITE}/${a.featuredImage.replace(/^\.?\//, '')}`)
    : `${SITE}/assets/og-journal.jpg`;
  const desc = esc(a.metaDescription ?? a.subtitle ?? '');

  const schema = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, description: a.metaDescription,
    image: img,
    author: { '@type': 'Person', name: a.author, url: `${SITE}/about.html` },
    publisher: { '@type': 'Organization', name: 'EarthBox',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/logo.png` } },
    datePublished: a.publishDate, dateModified: a.updatedDate ?? a.publishDate,
    mainEntityOfPage: url
  };
  const faqSchema = a.faqs?.length ? {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: a.faqs.map((f) => ({ '@type': 'Question', name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer } }))
  } : null;

  const rawTitle = a.metaTitle ?? a.title;
  const title = /\bEarthBox\b/i.test(rawTitle) ? rawTitle : `${rawTitle} | EarthBox`;

  return `  <title>${esc(title)}</title>
  <meta name="description" content="${desc}" />
  <meta name="keywords" content="${esc((a.keywords ?? []).join(', '))}" />
  <meta name="author" content="${esc(a.author)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="EarthBox" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${esc(a.title)}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${img}" />
  <meta property="article:published_time" content="${esc(a.publishDate)}" />
  <meta property="article:author" content="${esc(a.author)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(a.title)}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${img}" />
  <script type="application/ld+json" data-prerendered>${JSON.stringify(schema)}</script>${
    faqSchema ? `\n  <script type="application/ld+json" data-prerendered>${JSON.stringify(faqSchema)}</script>` : ''}`;
}

const START = '<!-- prerender:start -->';
const END = '<!-- prerender:end -->';

function injectHead(html, block) {
  // Replace a previous prerender block, or insert before </head>.
  if (html.includes(START)) {
    return html.replace(new RegExp(`${START}[\\s\\S]*?${END}`), `${START}\n${block}\n  ${END}`);
  }
  // Drop the placeholder <title> and generic description the template ships with.
  html = html.replace(/^[ \t]*<title>EarthBox Journal<\/title>\n/m, '')
             .replace(/^[ \t]*<meta name="description" content="EarthBox Journal[^"]*" \/>\n/m, '');
  return html.replace('</head>', `  ${START}\n${block}\n  ${END}\n</head>`);
}

const fill = (html, id, inner) =>
  html.replace(new RegExp(`(<section[^>]*id="${id}"[^>]*>)[\\s\\S]*?(</section>)`),
               (_m, open, close) => `${open}${inner}${close}`);

const files = (await readdir(path.join(ROOT, 'blog'))).filter((f) => f.endsWith('.html'));
let done = 0, skipped = [];

for (const f of files.sort()) {
  const p = path.join(ROOT, 'blog', f);
  let html = await readFile(p, 'utf8');
  const slug = html.match(/<body[^>]*data-article="([^"]+)"/)?.[1];
  const a = articles.find((x) => x.slug === slug);
  if (!a) { skipped.push(`${f} (no article for slug "${slug ?? '?'}")`); continue; }

  html = injectHead(html, meta(a));
  html = fill(html, 'articleHead', head(a));
  html = fill(html, 'articleBody', body(a));
  await writeFile(p, html, 'utf8');
  done++;
}

console.log(`prerendered ${done} article page(s)`);
if (skipped.length) {
  console.log(`  skipped ${skipped.length}:`);
  for (const s of skipped) console.log(`    ${s}`);
}
