// ─────────────────────────────────────────────────────────────────────
// manifesto-spotlight.js · cursor-following radial spotlight
// Sets --mx / --my CSS vars on the .manifesto element so its ::before
// gradient tracks the cursor. CSS owns the visual; JS just supplies
// coordinates.
// ─────────────────────────────────────────────────────────────────────

export function initManifesto(){
  const m = document.querySelector('.manifesto');
  if (!m) return;

  m.addEventListener('mousemove', (e) => {
    const r = m.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width)  * 100;
    const y = ((e.clientY - r.top)  / r.height) * 100;
    m.style.setProperty('--mx', x + '%');
    m.style.setProperty('--my', y + '%');
  });

  m.addEventListener('mouseleave', () => {
    m.style.setProperty('--mx', '50%');
    m.style.setProperty('--my', '50%');
  });
}
