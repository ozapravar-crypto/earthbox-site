// ─────────────────────────────────────────────────────────────────────
// lenis.js · smooth scroll wrapper
// Lenis is loaded via CDN <script> in each HTML — exposes window.Lenis.
// We instantiate once, drive a rAF loop, expose getLenis() if other
// modules need scroll events.
//
// Mode: LERP (linear interpolation per frame) instead of duration-based
// easing. Lerp gives a snappy weighted feel without input lag — each
// frame moves a fixed % toward the target scroll position. duration:1
// felt jumpy because every wheel input animated over 1 full second.
//
// Disabled on prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let lenis = null;

export function initLenis(){
  if (reduced) return;
  if (typeof window.Lenis !== 'function') return;

  lenis = new window.Lenis({
    lerp:            0.09,    // ~9% of distance per frame · snappy + smooth
    smoothWheel:     true,
    wheelMultiplier: 1.0,
    touchMultiplier: 2.0
  });

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

export function getLenis(){
  return lenis;
}
