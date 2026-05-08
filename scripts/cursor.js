// ─────────────────────────────────────────────────────────────────────
// cursor.js · germinating-sprig custom cursor
// Two stacked elements (ring + dot) lerp toward mouse. As the mouse
// travels, drop trail dots every 24px; every 8th drop, plant a sprig
// SVG that grows then fades. Ring shape morphs on hover targets.
// Disabled on touch + reduced-motion.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine    = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const SPRIG_SVG = `
  <svg viewBox="0 0 14 18" preserveAspectRatio="xMidYMax meet">
    <path d="M7 18 L7 4"/>
    <path d="M7 10 Q3 8, 2 4"/>
    <path d="M7 8  Q11 6, 12 2"/>
    <path d="M7 12 Q4 11, 3 8"/>
  </svg>
`;

// Hover label per element type · element can override via data-cursor
const labelFor = (el) => {
  if (el.dataset.cursor) return el.dataset.cursor;
  if (el.closest('a[href*="mailto"]')) return 'WRITE';
  if (el.closest('button')) return 'OPEN';
  if (el.closest('a'))      return 'VIEW';
  return '';
};

const isFrameTarget = (el) =>
  el.matches('img, .vis svg, .product-vis svg, .chamber-visual svg, .logo-svg');

const isDarkSection = (el) =>
  !!el.closest('.manifesto');


export function initCursor(){
  if (reduced || !fine) return;

  // ─── DOM scaffolding ───
  const ring  = document.createElement('div');
  ring.className = 'cursor-ring';
  const label = document.createElement('span');
  label.className = 'cursor-label';
  ring.appendChild(label);

  const dot   = document.createElement('div');
  dot.className = 'cursor-dot';

  const layer = document.createElement('div');
  layer.className = 'cursor-sprigs';

  document.body.appendChild(layer);
  document.body.appendChild(ring);
  document.body.appendChild(dot);
  document.body.classList.add('cursor-ready');

  // ─── Position state ───
  const mouse  = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ringP  = { x: mouse.x, y: mouse.y };
  const dotP   = { x: mouse.x, y: mouse.y };

  let lastSampleX = mouse.x;
  let lastSampleY = mouse.y;
  let trailCounter = 0;

  // ─── Mouse listener ───
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;

    // Drop a trail breadcrumb every 24px of travel
    const dx = mouse.x - lastSampleX;
    const dy = mouse.y - lastSampleY;
    if (dx * dx + dy * dy > 24 * 24){
      trailCounter++;
      // Every 8th sample is a sprig; rest are tiny dots
      if (trailCounter % 8 === 0){
        plantSprig(mouse.x, mouse.y, layer);
      } else {
        plantDot(mouse.x, mouse.y, layer);
      }
      lastSampleX = mouse.x;
      lastSampleY = mouse.y;
    }
  }, { passive: true });

  // ─── Hover detection (event delegation) ───
  document.addEventListener('mouseover', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const interactive = t.closest('a, button, input, label, .product-row');
    const frameish    = isFrameTarget(t);
    const dark        = isDarkSection(t);

    ring.classList.toggle('is-hover', !!interactive);
    dot.classList .toggle('is-hover', !!interactive);
    ring.classList.toggle('is-frame', frameish && !interactive);
    ring.classList.toggle('is-dark',  dark);
    dot.classList .toggle('is-dark',  dark);

    label.textContent = interactive ? labelFor(interactive) : '';
  });

  // ─── Animation loop · lerp ring + dot toward mouse ───
  const RING_LERP = 0.12;
  const DOT_LERP  = 0.28;

  const tick = () => {
    ringP.x += (mouse.x - ringP.x) * RING_LERP;
    ringP.y += (mouse.y - ringP.y) * RING_LERP;
    dotP.x  += (mouse.x - dotP.x)  * DOT_LERP;
    dotP.y  += (mouse.y - dotP.y)  * DOT_LERP;

    ring.style.transform = `translate3d(${ringP.x}px, ${ringP.y}px, 0) translate(-50%, -50%)`;
    dot.style.transform  = `translate3d(${dotP.x}px,  ${dotP.y}px,  0) translate(-50%, -50%)`;

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Hide on window blur, restore on focus
  window.addEventListener('blur',  () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  window.addEventListener('focus', () => { ring.style.opacity = '';  dot.style.opacity = '';  });
}


// ─── Trail helpers ───
function plantSprig(x, y, layer){
  const el = document.createElement('div');
  el.className = 'cursor-sprig';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.innerHTML  = SPRIG_SVG;
  layer.appendChild(el);
  // Remove after total animation duration
  setTimeout(() => el.remove(), 2100);
}

function plantDot(x, y, layer){
  const el = document.createElement('div');
  el.className = 'cursor-trail-dot';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  layer.appendChild(el);
  setTimeout(() => el.remove(), 900);
}
