// Cookie consent. Google Analytics loads only after the visitor taps Accept
// (DPDP / GDPR). Cart, Saved, the Maker design and the theme stay in the
// visitor's browser and are needed for the site to work, so they don't ask.
// The gtag() queue is set up at the top of this file, so track() calls are
// harmless until GA loads, and are dropped if it never does.
// gtag queue: track() calls before or without consent just queue here.
window.dataLayer = window.dataLayer || [];
// dataLayer is set on the line above, before gtag can ever run.
window.gtag = function gtag(){ /** @type {unknown[]} */ (window.dataLayer).push(arguments); };
window.gtag('js', new Date());
window.gtag('config', 'G-1HHZETMVWP');

(() => {
  const KEY = 'earthbox-consent';
  const GA = 'https://www.googletagmanager.com/gtag/js?id=G-1HHZETMVWP';
  const get = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  /** @param {string} v */
  const set = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode: ask again next page */ } };
  const loadGA = () => {
    if (document.querySelector(`script[src="${GA}"]`)) return;
    const s = document.createElement('script');
    s.async = true; s.src = GA;
    document.head.append(s);
  };

  // "Change cookie choice" on the privacy page.
  document.addEventListener('click', (e) => {
    if (!/** @type {Element} */ (e.target).closest('[data-consent-reset]')) return;
    try { localStorage.removeItem(KEY); } catch { /* nothing stored */ }
    location.reload();
  });

  const choice = get();
  if (choice === 'granted') { loadGA(); return; }
  if (choice === 'denied') return;

  const show = () => {
    const box = document.createElement('section');
    box.className = 'consent';
    box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML = `
      <p class="consent-text">We use Google Analytics to see which pages help, only if you agree. Your cart and saved pieces stay in your browser either way. <a href="/privacy">Privacy</a></p>
      <div class="consent-actions">
        <!-- Equal weight on purpose: neither choice is nudged (both outline, rule E1's exception) -->
        <button type="button" class="cta cta-small cta-secondary" data-consent="granted">Accept</button>
        <button type="button" class="cta cta-small cta-secondary" data-consent="denied">Decline</button>
      </div>`;
    box.addEventListener('click', (e) => {
      const b = /** @type {HTMLElement | null} */ (/** @type {Element} */ (e.target).closest('[data-consent]'));
      if (!b) return;
      set(/** @type {string} */ (b.dataset.consent));
      if (b.dataset.consent === 'granted') loadGA();
      box.remove();
    });
    document.body.append(box);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show);
  else show();
})();
