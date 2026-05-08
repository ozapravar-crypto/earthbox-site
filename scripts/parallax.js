// ─────────────────────────────────────────────────────────────────────
// parallax.js · multi-layer scroll parallax
// Apply data-parallax="0.7" to any element. 1.0 = normal scroll
// (no parallax). 0.7 = element appears to move slower than scroll
// (lags behind, looks "further away"). 1.3 = faster than scroll.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initParallax(){
  if (reduced) return;

  const items = Array.from(document.querySelectorAll('[data-parallax]'))
    .map(el => ({
      el,
      speed: parseFloat(el.dataset.parallax) || 1
    }));
  if (!items.length) return;

  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    items.forEach(it => {
      const offset = y * (1 - it.speed);
      it.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking){
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}
