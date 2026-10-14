// ─────────────────────────────────────────────────────────────────────
// util.js · small helpers every renderer needs (safe in Node)
// ─────────────────────────────────────────────────────────────────────

// HTML-escape for text and double- or single-quoted attributes.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// 1299 → "₹1,299"
export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

// GA4 event; a no-op when analytics is blocked or not loaded.
export const track = (name, params = {}) => { if (typeof gtag === 'function') gtag('event', name, params); };

// The shopper's "Where will it live?" choice (data/volume-one.js places),
// kept on this device so the Catalogue and product pages agree.
const PLACE = 'earthbox-place';
export const savedPlace = (places) => { try { return places.find(x => x.id === localStorage.getItem(PLACE)) || places[0]; } catch { return places[0]; } };
export const rememberPlace = (id) => { try { localStorage.setItem(PLACE, id); } catch { /* private mode: this page only */ } };
