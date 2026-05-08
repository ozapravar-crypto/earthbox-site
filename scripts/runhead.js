// ─────────────────────────────────────────────────────────────────────
// runhead.js · scroll-percentage counter + frosted glass on scroll
// Reads document scroll position, writes a 0-100 string into the
// element with id="scrollPct". Adds .is-scrolled class for glass effect.
// ─────────────────────────────────────────────────────────────────────

const SCROLL_THRESHOLD = 50;

export function initRunhead(){
  const pctEl = document.getElementById('scrollPct');
  const runhead = document.querySelector('.runhead');
  if (!runhead) return;

  const update = () => {
    const h = document.documentElement;
    const scrollY = h.scrollTop || window.scrollY;

    // Update scroll percentage
    if (pctEl) {
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? Math.round((scrollY / max) * 100) : 0;
      pctEl.textContent = String(p).padStart(2, '0');
    }

    // Toggle frosted glass effect
    runhead.classList.toggle('is-scrolled', scrollY > SCROLL_THRESHOLD);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}
