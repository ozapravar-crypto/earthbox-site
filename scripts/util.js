// ─────────────────────────────────────────────────────────────────────
// util.js · small helpers every renderer needs (safe in Node)
// ─────────────────────────────────────────────────────────────────────

/** @type {Record<string, string>} */
const ENTITY = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// HTML-escape for text and double- or single-quoted attributes.
/** @param {string | number | null | undefined} s */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ENTITY[c]);

// 1299 → "₹1,299"
// Botanical drawing as an ink mask painted in currentColor (styles/components.css .art),
// so it follows light/dark mode and the inverted "selected" state. Always decorative:
// the words next to it carry the meaning.
/** @param {string | undefined} id @param {string} [cls] */
export const art = (id, cls = '') => id ? `<i class="art${cls ? ' ' + cls : ''}" aria-hidden="true" style="--art:url(/assets/illustrations/${id}.webp)"></i>` : '';

/** @param {number} n */
export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

/** @typedef {(...args: unknown[]) => void} Gtag  the GA4 queue consent.js puts on window */

// GA4 event; a no-op when analytics is blocked or not loaded.
/**
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export const track = (name, params = {}) => {
  const gtag = /** @type {typeof globalThis & { gtag?: Gtag }} */ (globalThis).gtag;
  if (typeof gtag === 'function') gtag('event', name, params);
};

// The shopper's "Where will it live?" choice (data/volume-one.js places),
// kept on this device so the Catalogue and product pages agree.
const PLACE = 'earthbox-place';
/**
 * @template {{ id: string }} T
 * @param {T[]} places
 */
export const savedPlace = (places) => { try { return places.find(x => x.id === localStorage.getItem(PLACE)) || places[0]; } catch { return places[0]; } };
/** @param {string} id */
export const rememberPlace = (id) => { try { localStorage.setItem(PLACE, id); } catch { /* private mode: this page only */ } };

/**
 * One-of-many buttons (role=radio): click picks, arrow keys move and pick.
 * @param {HTMLElement[]} btns
 * @param {(btn: HTMLElement) => void} choose
 */
export function radioKeys(btns, choose){
  /** @type {Record<string, number | undefined>} */
  const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  btns.forEach((btn, i) => {
    btn.addEventListener('click', () => choose(btn));
    btn.addEventListener('keydown', (e) => {
      const step = STEP[e.key];
      if (!step) return;
      e.preventDefault();
      const next = btns[(i + step + btns.length) % btns.length];
      choose(next); next.focus();
    });
  });
}
