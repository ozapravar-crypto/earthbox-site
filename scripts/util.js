// ─────────────────────────────────────────────────────────────────────
// util.js · three helpers every renderer needs (pure, safe in Node)
// ─────────────────────────────────────────────────────────────────────

// HTML-escape for text and double- or single-quoted attributes.
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// 1299 → "₹1,299"
export const rupees = (n) => `₹${n.toLocaleString('en-IN')}`;

// GA4 event; a no-op when analytics is blocked or not loaded.
export const track = (name, params = {}) => { if (typeof gtag === 'function') gtag('event', name, params); };
