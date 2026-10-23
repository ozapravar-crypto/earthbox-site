// ─────────────────────────────────────────────────────────────────────
// account.js · sign-in by emailed code, cart/saved sync, /account page
//
// Talks to worker/index.js (/api/*), which exists only on the Cloudflare
// host. Until SITE_ACCOUNTS is true (data/site.js) nothing here runs on
// ordinary pages, so the Vercel site behaves exactly as before.
//
// Sync: the browser's cart stays the working copy (cart.js, localStorage).
// On each page load a signed-in visitor's server copy is merged in
// (union, higher quantity wins), and every change is pushed back.
// The merge rule is checked by account.test.mjs.
// ─────────────────────────────────────────────────────────────────────

import { keyOf, emptyCart } from './cart.js';

const STORE = 'earthbox-cart';
const FLAG = 'earthbox-signed-in';   // a hint only; the HttpOnly cookie is the real session

/** @typedef {{ cart: any[], saved: any[] }} Cart */

/** Union of two carts by line identity; the same line keeps the higher quantity.
 * @param {Cart | null | undefined} a  @param {Cart | null | undefined} b  @returns {Cart} */
export function merge(a, b){
  const out = emptyCart();
  for (const list of /** @type {const} */ (['cart', 'saved'])) {
    const byKey = new Map();
    for (const l of [...(a?.[list] || []), ...(b?.[list] || [])]) {
      const prev = byKey.get(keyOf(l));
      byKey.set(keyOf(l), prev && (prev.qty || 1) >= (l.qty || 1) ? prev : l);
    }
    out[list] = [...byKey.values()];
  }
  // A line saved on one device and in the cart on another: the cart wins.
  const inCart = new Set(out.cart.map(keyOf));
  out.saved = out.saved.filter(l => !inCart.has(keyOf(l)));
  return out;
}


// ═══ BROWSER ══════════════════════════════════════════════════════════

const flag = { get: () => { try { return localStorage.getItem(FLAG) === '1'; } catch { return false; } },
  set: (/** @type {boolean} */ on) => { try { on ? localStorage.setItem(FLAG, '1') : localStorage.removeItem(FLAG); } catch { /* private mode */ } } };
const local = () => { try { return JSON.parse(localStorage.getItem(STORE) || 'null') || emptyCart(); } catch { return emptyCart(); } };

/** @param {string} method  @param {string} path  @param {unknown} [body]  @returns {Promise<any>} */
async function call(method, path, body){
  const r = await fetch(path, {
    method, credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) flag.set(false);
  if (!r.ok) throw Object.assign(new Error(data.error || "Couldn't reach EarthBox. Check your connection."), { status: r.status });
  return data;
}

/** @type {ReturnType<typeof setTimeout> | undefined} */
let pushTimer;
const push = () => { clearTimeout(pushTimer); pushTimer = setTimeout(() => call('PUT', '/api/cart', local()).catch(() => {}), 800); };

/** Merge the server copy in, then keep the server up to date. `reload` re-reads cart.js state.
 * @param {{ cart: Cart }} me  @param {() => void} reload */
function adopt(me, reload){
  const merged = merge(local(), me.cart);
  try { localStorage.setItem(STORE, JSON.stringify(merged)); } catch { /* private mode */ }
  reload();
  push();
}

/** Every page: if this browser is signed in, sync. @param {() => void} reload */
export async function initSync(reload){
  document.addEventListener('cart:change', () => { if (flag.get()) push(); });
  if (!flag.get()) return;
  try { adopt(await call('GET', '/api/me'), reload); } catch { /* offline or signed out: the local cart still works */ }
}


// ═══ /account ═════════════════════════════════════════════════════════

/** @param {HTMLElement} root  @param {() => void} reload */
export async function initAccountPage(root, reload){
  const $ = (/** @type {string} */ s) => /** @type {any} */ (root.querySelector(s));
  const signIn = $('#acSignIn'), codeForm = $('#acCode'), panel = $('#acPanel'), msg = $('#acMsg');
  const say = (/** @type {string} */ text) => { msg.textContent = text; };
  const show = (/** @type {HTMLElement} */ el) => { for (const x of [signIn, codeForm, panel]) x.hidden = x !== el; say(''); };
  let email = '';

  const fill = (/** @type {any} */ me) => {
    $('#acWho').textContent = me.email;
    for (const k of ['name', 'phone', 'address', 'pincode']) panel.elements[k].value = me[k];
    panel.elements.newsletter.checked = me.newsletter;
    show(panel);
  };

  const busy = async (/** @type {HTMLFormElement} */ form, /** @type {() => Promise<void>} */ fn) => {
    const btn = /** @type {HTMLButtonElement} */ (form.querySelector('button[type="submit"]'));
    btn.disabled = true;
    try { await fn(); } catch (e) { say(/** @type {Error} */ (e).message); } finally { btn.disabled = false; }
  };

  signIn.addEventListener('submit', (/** @type {Event} */ e) => { e.preventDefault(); void busy(signIn, async () => {
    email = signIn.elements.email.value.trim();
    await call('POST', '/api/auth/start', { email });
    $('#acSentTo').textContent = email;
    show(codeForm);
    codeForm.elements.code.focus();
  }); });

  codeForm.addEventListener('submit', (/** @type {Event} */ e) => { e.preventDefault(); void busy(codeForm, async () => {
    const me = await call('POST', '/api/auth/verify', { email, code: codeForm.elements.code.value.trim() });
    flag.set(true);
    adopt(me, reload);   // what's in this browser is kept
    fill(me);
    say('Signed in. Your cart and saved pieces now follow you to any device.');
  }); });
  $('#acBack').addEventListener('click', () => show(signIn));

  panel.addEventListener('submit', (/** @type {Event} */ e) => { e.preventDefault(); void busy(panel, async () => {
    const f = panel.elements;
    fill(await call('PUT', '/api/me', { name: f.name.value, phone: f.phone.value, address: f.address.value, pincode: f.pincode.value, newsletter: f.newsletter.checked }));
    say('Saved.');
  }); });

  $('#acSignOut').addEventListener('click', async () => {
    await call('POST', '/api/auth/logout', {}).catch(() => {});
    flag.set(false);
    show(signIn);
    say('Signed out. Your cart stays in this browser.');
  });

  $('#acDelete').addEventListener('click', async () => {
    if (!confirm('Delete your EarthBox account and everything saved in it? This cannot be undone.')) return;
    try { await call('DELETE', '/api/me', {}); flag.set(false); show(signIn); say('Your account has been deleted.'); }
    catch (e) { say(/** @type {Error} */ (e).message); }
  });

  try { fill(await call('GET', '/api/me')); flag.set(true); }
  catch (e) { show(signIn); if (/** @type {any} */ (e).status !== 401) say("Accounts aren't available right now. Your cart still works in this browser."); }
}
