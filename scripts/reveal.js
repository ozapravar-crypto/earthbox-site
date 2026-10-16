// ─────────────────────────────────────────────────────────────────────
// reveal.js · IntersectionObserver scroll reveals
// Adds .in to any element with .reveal when it enters viewport.
// One-shot — unobserves after firing.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sel = '.reveal, .reveal-clip';

/** @type {IntersectionObserver | null} */
let io = null;

export function initReveal(){
  if (reduced){
    document.querySelectorAll(sel).forEach(el => el.classList.add('in'));
    return;
  }

  const obs = io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll(sel).forEach(el => obs.observe(el));
}

// Observe new elements added dynamically (e.g., product detail page)
/** @param {ParentNode} container */
export function observeReveals(container){
  if (reduced){
    container.querySelectorAll(sel).forEach(el => el.classList.add('in'));
    return;
  }
  const obs = io;
  if (obs){
    container.querySelectorAll(sel).forEach(el => obs.observe(el));
  } else {
    // Fallback: if called before initReveal, just show the content
    container.querySelectorAll(sel).forEach(el => el.classList.add('in'));
  }
}
