// ─────────────────────────────────────────────────────────────────────
// motion-scroll.js · smooth scroll, parallax, scroll-linked text fades
//
// Owner brief (12 Oct 2026): smooth scrolling, parallax, fade in and out
// on the text, after animejs.com. Taken from it: motion tied to scroll
// position (not timers), soft easing. Kept from MOTION.md: slow and
// archival, nothing blocks input, no layout shift, off for reduced motion.
//
// · Smooth scroll: Lenis (scripts/vendor/lenis.js), desktop mouse and
//   trackpad only. Touch and keyboard stay native. Anything that scrolls
//   on its own (drawers, dialogs, menus, lists) scrolls natively.
// · Parallax: [data-parallax="0.08"] on an image inside a clipping frame.
//   It drifts by up to ±strength of its own height as it crosses the
//   viewport, and is scaled up by the same amount so no edge ever shows.
//   Relative to the viewport, so it works mid-page (the old parallax.js
//   used absolute scrollY and jumped).
// · Text: headings and short intro lines fade and rise in as they come up
//   the screen, and fade as they slide under the header. Never prices,
//   buttons, forms, product details, the Maker, or article body text.
// ─────────────────────────────────────────────────────────────────────

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Which text fades: editorial headings and intros on content pages.
const FADE = 'main h2, main .lede, .about-head .italic, .care-lede, .home-care p, .page-intro p';
const NO_FADE = '#maker, .pd-page, form, dialog, .hero, [data-no-fade]';

const smooth = (/** @type {number} */ t) => t * t * (3 - 2 * t);
const clamp01 = (/** @type {number} */ x) => Math.min(1, Math.max(0, x));

export async function initScrollMotion(){
  if (reduced) return;

  /** @type {import('./vendor/lenis.js').default | null} */
  let lenis = null;
  if (finePointer) {
    try {
      const { default: Lenis } = await import('./vendor/lenis.js');
      const l = lenis = new Lenis({
        lerp: .09,                                   // gentle: "slow enough to feel placed"
        wheelMultiplier: .9,
        allowNestedScroll: true,                     // inner scroll areas scroll themselves
        // Lenis walks the event path, which ends at document and window (no matches()).
        prevent: (/** @type {{ matches?: (s: string) => boolean }} */ node) => node.matches?.('dialog, [role=dialog], .mobile-nav, [data-lenis-prevent]') ?? false,
        autoRaf: true
      });
      // Pause while a modal is open (cart drawer, guided search, menu).
      new MutationObserver(() => (document.querySelector('dialog[open], .mobile-nav.open') ? l.stop() : l.start()))
        .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open', 'class'] });
      window.__earthboxLenis = lenis;                 // tests and debugging
    } catch { lenis = null; }                        // native scroll is the fallback
  }

  const vh = () => innerHeight;
  /** @type {{ el: HTMLElement, k: number }[]} */
  let items = [];
  /** @type {HTMLElement[]} */
  let fades = [];
  const collect = () => {
    items = [.../** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-parallax]'))].map(el => ({ el, k: Math.min(.2, parseFloat(/** @type {string} */ (el.dataset.parallax)) || .08) }));
    fades = [.../** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll(FADE))].filter(el => !el.closest(NO_FADE));
    items.forEach(({ el, k }) => { el.style.willChange = 'transform'; el.style.transform = `scale(${1 + 2 * k})`; });
  };

  const frame = () => {
    const h = vh(), y = scrollY;
    for (const { el, k } of items) {
      const r = /** @type {HTMLElement} */ (el.parentElement).getBoundingClientRect();
      if (r.bottom < -100 || r.top > h + 100) continue;
      const t = ((r.top + r.height / 2) - h / 2) / (h / 2 + r.height / 2);   // -1 … 1 across the screen
      el.style.transform = `translate3d(0, ${(-t * k * r.height).toFixed(1)}px, 0) scale(${1 + 2 * k})`;
    }
    for (const el of fades) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -50 || r.top > h + 50) continue;
      const enter = smooth(clamp01((h - r.top) / (h * .22)));                       // bottom 22 % of the screen
      const exit = y < 40 ? 1 : smooth(clamp01((r.bottom - h * .06) / (h * .22)));  // passing under the header
      const o = Math.min(enter, exit);
      el.style.opacity = o.toFixed(3);
      el.style.transform = o < 1 ? `translate3d(0, ${((1 - enter) * 18).toFixed(1)}px, 0)` : '';
    }
  };

  let queued = false;
  const tick = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; frame(); }); } };
  collect(); frame();
  if (lenis) lenis.on('scroll', tick); else addEventListener('scroll', tick, { passive: true });
  addEventListener('resize', tick);
  // Pages that draw their content later (product, catalogue, journal).
  new MutationObserver(() => { collect(); tick(); }).observe(document.querySelector('main') || document.body, { childList: true, subtree: true });
}
