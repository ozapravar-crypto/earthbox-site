// ─────────────────────────────────────────────────────────────────────
// scramble.js · headings cycle through random glyphs as a
// "loading-in" animation when they first enter the viewport.
//
// Triggered ONCE per element via IntersectionObserver — NOT on hover.
// Hover-trigger interrupts reading; viewport-entry reads as polish.
//
// Each character cycles through random glyphs and resolves left-to-right.
// Total ~520ms. Uses a seeded PRNG so the same text always scrambles
// the same way (deterministic, not chaotic).
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ§†¶·';

function seedFor(text){
  let h = 0;
  for (let i = 0; i < text.length; i++){
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}
function mulberry32(seed){
  return () => {
    let t = (seed += 0x6D2B79F5) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


function scramble(el){
  if (el.dataset.scrambled) return;
  el.dataset.scrambled = '1';

  const original = el.textContent;
  const chars    = original.split('');
  const rand     = mulberry32(seedFor(original));

  const total   = 520;        // total ms
  const cycles  = 4;
  const start   = performance.now();
  const perChar = total / Math.max(chars.length, 1);

  const step = (now) => {
    const elapsed = now - start;

    const out = chars.map((c, i) => {
      if (c === ' ' || c === '\n' || c === ' ') return c;

      const myStart = i * perChar * 0.5;
      const myDur   = total - myStart;
      const myProg  = (elapsed - myStart) / myDur;

      if (myProg <= 0) return c;
      if (myProg >= 1) return c;

      const cycleIdx = Math.floor(myProg * cycles);
      if (cycleIdx >= cycles - 1) return c;

      return GLYPHS[Math.floor(rand() * GLYPHS.length)];
    });

    el.textContent = out.join('');

    if (elapsed < total){
      requestAnimationFrame(step);
    } else {
      el.textContent = original;
    }
  };

  requestAnimationFrame(step);
}


export function initScramble(){
  if (reduced) return;

  const items = document.querySelectorAll('.scramble');
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        scramble(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4, rootMargin: '0px 0px -10% 0px' });

  items.forEach(el => io.observe(el));
}
