// ─────────────────────────────────────────────────────────────────────
// runhead.js · scroll-percentage counter in the fixed top bar
// Reads document scroll position, writes a 0-100 string into the
// element with id="scrollPct".
// ─────────────────────────────────────────────────────────────────────

export function initRunhead(){
  const pctEl = document.getElementById('scrollPct');
  if (!pctEl) return;

  const update = () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const p = max > 0 ? Math.round((h.scrollTop / max) * 100) : 0;
    pctEl.textContent = String(p).padStart(2, '0');
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}
