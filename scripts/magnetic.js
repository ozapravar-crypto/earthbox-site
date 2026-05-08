// ─────────────────────────────────────────────────────────────────────
// magnetic.js · buttons drift toward cursor when mouse is near
// Apply by adding .magnetic class to any element.
// Translates element up to MAX px toward cursor when within RADIUS px.
// Pure transform — no layout shift.
// Disabled on touch + reduced-motion.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const RADIUS = 80;   // activation distance in px
const MAX    = 8;    // max travel in px (toward cursor)
const LERP   = 0.18;

export function initMagnetic(){
  if (reduced || !fine) return;

  const items = Array.from(document.querySelectorAll('.magnetic'));
  if (!items.length) return;

  // Per-element animation state
  const state = items.map(el => ({
    el,
    cur: { x: 0, y: 0 },
    tgt: { x: 0, y: 0 },
    active: false
  }));

  const update = (e) => {
    state.forEach(s => {
      const r = s.el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top  + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < RADIUS){
        const k = (RADIUS - dist) / RADIUS;
        s.tgt.x = (dx / RADIUS) * MAX * k;
        s.tgt.y = (dy / RADIUS) * MAX * k;
        s.active = true;
        s.el.classList.add('is-magnetized');
      } else if (s.active){
        s.tgt.x = 0;
        s.tgt.y = 0;
        s.active = false;
        s.el.classList.remove('is-magnetized');
      }
    });
  };

  window.addEventListener('mousemove', update, { passive: true });

  const tick = () => {
    state.forEach(s => {
      s.cur.x += (s.tgt.x - s.cur.x) * LERP;
      s.cur.y += (s.tgt.y - s.cur.y) * LERP;
      s.el.style.setProperty('--mx', `${s.cur.x.toFixed(2)}px`);
      s.el.style.setProperty('--my', `${s.cur.y.toFixed(2)}px`);
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
