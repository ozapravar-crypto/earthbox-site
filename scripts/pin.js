// ─────────────────────────────────────────────────────────────────────
// pin.js · sticky-pinned scroll sections
// Markup pattern:
//   <section class="pin-spacer">                  ← tall (e.g. 200vh)
//     <div class="pin-content">                   ← position:sticky
//       ... .pin-target (the items that highlight in turn)
//       <div class="pin-progress-bar">
//         <div class="pin-progress-fill"></div>
//       </div>
//     </div>
//   </section>
// As the user scrolls through pin-spacer, one .pin-target at a time
// gets .is-active; the progress bar fills 0→100%.
// ─────────────────────────────────────────────────────────────────────

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initPin(){
  if (reduced) return;

  const spacers = document.querySelectorAll('.pin-spacer');
  if (!spacers.length) return;

  spacers.forEach(setupSpacer);
}

function setupSpacer(spacer){
  const targets  = spacer.querySelectorAll('.pin-target');
  const progress = spacer.querySelector('.pin-progress-fill');
  if (!targets.length) return;

  let ticking = false;

  const update = () => {
    const r     = spacer.getBoundingClientRect();
    const total = spacer.offsetHeight - window.innerHeight;
    const p     = Math.max(0, Math.min(1, -r.top / total));

    const idx = Math.min(
      Math.floor(p * targets.length),
      targets.length - 1
    );

    targets.forEach((t, i) => {
      t.classList.toggle('is-active', i === idx);
    });

    if (progress) progress.style.width = (p * 100) + '%';

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
