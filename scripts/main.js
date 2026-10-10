// ─────────────────────────────────────────────────────────────────────
// main.js · entry on every page
//
// Shared modules (header, theme, cart, motion) load everywhere. Page
// modules load only when their root element is on the page, via import():
// an article page no longer downloads the Maker, the catalogue or the
// product renderer. A page module that fails is logged and skipped; the
// rest of the page keeps working.
//
// Order is unchanged: renderers run first, then the motion primitives,
// so scramble / magnetic / reveal find the rendered DOM.
//
// NOTE: Lenis smooth scroll is currently disabled — using native
// browser scroll. lenis.js + the CDN <script> are still in the
// codebase but un-imported, ready if we want to switch back.
// ─────────────────────────────────────────────────────────────────────

import { initTheme }         from './theme.js';
import { initLoader }        from './loader.js';
import { initRunhead }       from './runhead.js';
import { initMenu }          from './menu.js';
import { initReveal }        from './reveal.js';
import { initManifesto }  from './manifesto-spotlight.js';
import { initParallax }   from './parallax.js';
import { initPin }        from './pin.js';
import { initCursor }     from './cursor.js';
import { initMagnetic }   from './magnetic.js';
import { initScramble }   from './scramble.js';
import { initEnquiryForm } from './enquiry-form.js';
import { initCart }        from './cart.js';

// [root selector, loader] · run in this order (catalogue reads what products rendered).
const PAGE_MODULES = [
  ['#volumeOneList, #volumeTwoList, #volumeThreeBlock', () => import('./render-products.js').then(m => m.initProducts())],
  ['.vol-pills',                                        () => import('./catalogue.js').then(m => m.initCatalogue())],
  ['#productDetail',                                    () => import('./render-product-detail.js').then(m => m.initProductDetail())],
  ['#aboutSections',                                    () => import('./render-about.js').then(m => m.initAbout())],
  ['#journalGrid, #journalFilters',                     () => import('./render-blog.js').then(m => m.initBlog())],
  ['#maker',                                            () => import('./maker.js').then(m => m.initMaker())]
];

async function initPage(){
  for (const [sel, load] of PAGE_MODULES) {
    if (!document.querySelector(sel)) continue;
    try { await load(); }
    catch (err) { console.error(`[earthbox] ${sel} failed to load`, err); }
  }
}

const boot = async () => {
  initTheme();
  initRunhead();
  initCart();         // after initTheme: wraps the desktop toggle
  initMenu();
  initReveal();       // Must run before catalogue so observeReveals() works
  await initPage();
  initManifesto();
  initParallax();
  initPin();
  initCursor();
  initMagnetic();
  initScramble();
  initEnquiryForm();

  // GA4: Track floating WhatsApp clicks
  const floatingWa = document.querySelector('.floating-wa');
  if (floatingWa) {
    floatingWa.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'floating_wa_click', {
          page: window.location.pathname
        });
      }
    });
  }

  // GA4: Track hero CTA clicks
  const heroCta = document.querySelector('.hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'hero_cta_click');
      }
    });
  }

  // GA4: Track desktop enquiry-fallback clicks (email / phone under the CTA).
  // Delegated: the CTAs are rendered after this runs.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-enquiry-fallback]');
    if (el && typeof gtag === 'function') {
      gtag('event', 'enquire_fallback_click', {
        method: el.dataset.enquiryFallback,
        page: window.location.pathname
      });
    }
  });

  // GA4: Track manifesto CTA clicks
  const manifestoCta = document.querySelector('.manifesto-cta');
  if (manifestoCta) {
    manifestoCta.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'manifesto_cta_click');
      }
    });
  }
};

const start = () => {
  initLoader(boot);
};

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
