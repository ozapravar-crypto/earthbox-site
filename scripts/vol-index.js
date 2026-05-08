// ─────────────────────────────────────────────────────────────────────
// vol-index.js · sticky side index for the Catalogue page
// As the user scrolls, marks the currently-visible volume section
// (I · II · III) as .is-active. Click any number → smooth-scroll to
// that section.
// No-op on pages without .vol-index.
// ─────────────────────────────────────────────────────────────────────

export function initVolIndex(){
  const items = Array.from(document.querySelectorAll('.vol-index a'));
  if (!items.length) return;

  const sections = items
    .map(a => {
      const id = (a.getAttribute('href') || '').replace('#', '');
      return { item: a, section: document.getElementById(id) };
    })
    .filter(s => s.section);

  if (!sections.length) return;

  let ticking = false;
  const update = () => {
    // "Active" = the section whose top is closest to (but above) 40% of viewport
    const probe = window.scrollY + window.innerHeight * 0.4;
    let active = sections[0];
    sections.forEach(s => {
      if (s.section.offsetTop <= probe) active = s;
    });
    sections.forEach(s => {
      s.item.classList.toggle('is-active', s === active);
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
