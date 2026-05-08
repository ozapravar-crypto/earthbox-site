// ─────────────────────────────────────────────────────────────────────
// reveal.js · IntersectionObserver scroll reveals
// Adds .in to any element with .reveal when it enters viewport.
// One-shot — unobserves after firing.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initReveal(){
  const sel = '.reveal, .reveal-clip';

  if (reduced){
    document.querySelectorAll(sel).forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll(sel).forEach(el => io.observe(el));
}
