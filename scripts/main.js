// ─────────────────────────────────────────────────────────────────────
// main.js · entry on every page
//
// Shared modules (header, theme, cart, motion) load everywhere. Page
// modules load only when their root element is on the page, via import():
// an article page no longer downloads the catalogue or the
// product renderer. A page module that fails is logged and skipped; the
// rest of the page keeps working.
//
// Order is unchanged: renderers run first, then the motion primitives,
// so scramble / magnetic / reveal find the rendered DOM.
//
// Smooth scroll (Lenis) is loaded by motion-scroll.js from scripts/vendor.
// ─────────────────────────────────────────────────────────────────────

import { track } from './util.js';
import { initTheme }         from './theme.js';
import { initLoader }        from './loader.js';
import { initRunhead }       from './runhead.js';
import { initMenu }          from './menu.js';
import { initReveal }        from './reveal.js';
import { initScrollMotion } from './motion-scroll.js';
import { initPin }        from './pin.js';
import { initCursor }     from './cursor.js';
import { initMagnetic }   from './magnetic.js';
import { initScramble }   from './scramble.js';
import { initEnquiryForm } from './enquiry-form.js';
import { initCart, reloadCart } from './cart.js';
import { SITE_ACCOUNTS }   from '../data/site.js';

// Broken images (no inline onerror, so the CSP can forbid inline script):
//   data-fallback="hide" | "parent:<class>" | "parent:<class> remove"
// error doesn't bubble, so listen in the capture phase.
document.addEventListener('error', (e) => {
  const img = e.target;
  const how = img instanceof HTMLImageElement && img.dataset.fallback;
  if (!how) return;
  if (how === 'hide') { img.style.display = 'none'; return; }
  const [, cls, remove] = how.match(/^parent:(\S+)( remove)?$/) || [];
  if (cls) img.parentElement?.classList.add(cls);
  if (remove) img.remove();
}, true);

// [root selector, loader] · run in this order (catalogue reads what products rendered).
/** @type {[string, () => Promise<unknown>][]} */
const PAGE_MODULES = [
  ['#volumeOneList, #volumeTwoList, #volumeThreeBlock', () => import('./render-products.js').then(m => m.initProducts())],
  ['.vol-pills',                                        () => import('./catalogue.js').then(m => m.initCatalogue())],
  ['#productDetail',                                    () => import('./render-product-detail.js').then(m => m.initProductDetail())],
  ['#aboutSections',                                    () => import('./render-about.js').then(m => m.initAbout())],
  ['#journalGrid, #journalFilters',                     () => import('./render-blog.js').then(m => m.initBlog())],
  ['#carePlanner',                                      () => import('./care-page.js').then(m => m.initCare())],
  ['#heroTitle',                                        () => import('./hero-garden.js').then(m => m.initHeroGarden())],
  ['#account',                                          () => import('./account.js').then(m => m.initAccountPage(/** @type {HTMLElement} */ (document.getElementById('account')), reloadCart))]
];

async function initPage(){
  for (const [sel, load] of PAGE_MODULES) {
    if (!document.querySelector(sel)) continue;
    try { await load(); }
    catch (err) { console.error(`[earthbox] ${sel} failed to load`, err); }
  }
}

const boot = async () => {
  // The catalogue search loads a moment after the page shows: a tap in that
  // gap is remembered and opens search when it's ready, not lost (site-ksq).
  document.getElementById('catalogueSearchBtn')?.addEventListener('click', (e) => { /** @type {HTMLElement} */ (e.currentTarget).dataset.pending = '1'; }, { once: true });
  initTheme();
  initRunhead();
  initCart();         // after initTheme: wraps the desktop toggle
  if (SITE_ACCOUNTS) void import('./account.js').then(m => m.initSync(reloadCart));
  initMenu();
  initReveal();       // Must run before catalogue so observeReveals() works
  await initPage();
  void initScrollMotion();   // background: Lenis loads after the page is usable
  initPin();
  initCursor();
  initMagnetic();
  initScramble();
  initEnquiryForm();

  // GA4: Track floating WhatsApp clicks
  const floatingWa = document.querySelector('.floating-wa');
  if (floatingWa) {
    floatingWa.addEventListener('click', () => {
      track('floating_wa_click', {
          page: window.location.pathname
        });
    });
  }

  // GA4: Track hero CTA clicks
  const heroCta = document.querySelector('.hero-cta');
  if (heroCta) {
    heroCta.addEventListener('click', () => {
      track('hero_cta_click');
    });
  }

  // GA4: Track desktop enquiry-fallback clicks (email / phone under the CTA).
  // Delegated: the CTAs are rendered after this runs.
  document.addEventListener('click', (e) => {
    const el = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-enquiry-fallback]'));
    if (el) track('enquire_fallback_click', {
        method: el.dataset.enquiryFallback,
        page: window.location.pathname
      });
  });
};

const start = () => {
  initLoader(boot);
};

if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
