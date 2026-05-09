// ─────────────────────────────────────────────────────────────────────
// main.js · entry · imports + boots each motion primitive
// One entry shared across all 3 pages. Each init() is a no-op if
// its target isn't on the current page. Renderers run first so the
// DOM exists for primitives to find.
//
// NOTE: Lenis smooth scroll is currently disabled — using native
// browser scroll. lenis.js + the CDN <script> are still in the
// codebase but un-imported, ready if we want to switch back.
// ─────────────────────────────────────────────────────────────────────

import { initTheme }         from './theme.js';
import { initLoader }        from './loader.js';
import { initRunhead }       from './runhead.js';
import { initMenu }          from './menu.js';
import { initProducts }      from './render-products.js';
import { initCatalogue }     from './catalogue.js';
import { initProductDetail } from './render-product-detail.js';
import { initAbout }         from './render-about.js';
import { initBlog }          from './render-blog.js';
import { initArticle }       from './render-article.js';
import { initReveal }        from './reveal.js';
import { initManifesto }  from './manifesto-spotlight.js';
import { initParallax }   from './parallax.js';
import { initPin }        from './pin.js';
import { initCursor }     from './cursor.js';
import { initMagnetic }   from './magnetic.js';
import { initScramble }   from './scramble.js';
import { initSearch }     from './search.js';

const boot = () => {
  initTheme();
  initRunhead();
  initMenu();
  initProducts();
  initCatalogue();
  initProductDetail();
  initAbout();
  initBlog();
  initArticle();
  initReveal();
  initManifesto();
  initParallax();
  initPin();
  initCursor();
  initMagnetic();
  initScramble();
  initSearch();
};

const start = () => {
  initLoader(boot);
};

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
