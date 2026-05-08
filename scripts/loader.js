// ─────────────────────────────────────────────────────────────────────
// loader.js · First-load intro animation
// Plays once per session. ~2.4s sequence: letters rise, rule draws,
// panel slides up. Uses sessionStorage so refresh skips it.
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'earthbox-loader-seen';
const TOTAL_DURATION = 2500;

export function initLoader(onComplete) {
  const loader = document.querySelector('.loader');
  if (!loader) {
    onComplete?.();
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alreadySeen = sessionStorage.getItem(STORAGE_KEY) === '1';

  if (reducedMotion || alreadySeen) {
    loader.remove();
    document.body.classList.remove('is-loading');
    onComplete?.();
    return;
  }

  document.body.classList.add('is-loading');

  requestAnimationFrame(() => {
    loader.classList.add('is-playing');
  });

  setTimeout(() => {
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    sessionStorage.setItem(STORAGE_KEY, '1');

    setTimeout(() => {
      loader.remove();
    }, 100);

    onComplete?.();
  }, TOTAL_DURATION);
}
