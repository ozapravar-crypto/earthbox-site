// ─────────────────────────────────────────────────────────────────────
// worker/index.js · the EarthBox backend (Cloudflare Worker + D1)
//
// The site stays static: Cloudflare serves dist/ directly, and only /api/*
// reaches this code (wrangler.jsonc → run_worker_first). Same origin, so the
// CSP's connect-src 'self' already allows it and no CORS is needed.
//
//   GET    /api/auth/options                → which sign-in ways are switched on
//   GET    /api/auth/google                 → Google sign-in (redirect), back to /account
//   POST   /api/auth/start   {email}        → emails a 6-digit code
//   POST   /api/auth/verify  {email, code}  → sets the session cookie
//   POST   /api/auth/logout
//   GET    /api/me                          → profile + saved cart
//   PUT    /api/me           {name, phone, address, pincode, newsletter}
//   DELETE /api/me                          → deletes the account (DPDP Act)
//   PUT    /api/cart         {cart, saved}  → same shape as localStorage['earthbox-cart']
//
// Live on earthbox.in through a Vercel rewrite (vercel.json /api/* → this
// Worker) until the domain moves to Cloudflare; SITE_URL is that public
// address, used for Google's redirect and the same-origin check.
//
// No passwords. A code is valid 10 minutes for 5 tries; 5 codes per email
// and 20 per IP an hour. Codes and session tokens are stored only as hashes.
// Checked by worker/api.test.mjs against `wrangler dev`.
// ─────────────────────────────────────────────────────────────────────

/** @typedef {{ DB: any, ASSETS: { fetch: (r: Request) => Promise<Response> }, RESEND_KEY?: string, MAIL_FROM?: string, DEV_ECHO_CODE?: string, SITE_URL?: string, GOOGLE_CLIENT_ID?: string, GOOGLE_CLIENT_SECRET?: string }} Env */
/** @typedef {{ id: number, email: string, name: string, phone: string, address: string, pincode: string, newsletter: number, cart: string }} User */

const CODE_TTL = 10 * 60e3;
const SESSION_TTL = 30 * 24 * 3600e3;
const HOUR = 3600e3;
const COOKIE = 'eb_session';
const MAX_CART_BYTES = 20_000;

/** @param {unknown} data  @param {Record<string, string>} [headers] */
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...headers }
});
const err = (/** @type {number} */ status, /** @type {string} */ error) => json({ error }, status);

const sha256 = async (/** @type {string} */ s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))]
  .map(b => b.toString(16).padStart(2, '0')).join('');
const randomHex = (/** @type {number} */ n) => [...crypto.getRandomValues(new Uint8Array(n))].map(b => b.toString(16).padStart(2, '0')).join('');
const sixDigits = () => String(crypto.getRandomValues(new Uint32Array(1))[0] % 1e6).padStart(6, '0');

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/i;
const str = (/** @type {unknown} */ v, /** @type {number} */ max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

const cookie = (/** @type {string} */ token, /** @type {number} */ maxAge) => `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
const tokenOf = (/** @type {Request} */ req) => (req.headers.get('cookie') || '').match(new RegExp(`(?:^|; )${COOKIE}=([0-9a-f]{64})`))?.[1];

/** @param {Request} req  @param {Env} env  @returns {Promise<User | null>} */
async function currentUser(req, env){
  const t = tokenOf(req);
  if (!t) return null;
  return env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.hash = ? AND s.expires_at > ?')
    .bind(await sha256(t), Date.now()).first();
}

const publicUser = (/** @type {User} */ u) => ({
  email: u.email, name: u.name, phone: u.phone, address: u.address, pincode: u.pincode,
  newsletter: !!u.newsletter, cart: JSON.parse(u.cart)
});

/** @param {Env} env  @param {string} email  @param {string} code */
async function sendCode(env, email, code){
  if (!env.RESEND_KEY) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'EarthBox <hello@earthbox.in>',
      to: email,
      subject: `${code} is your EarthBox sign-in code`,
      text: `Your EarthBox sign-in code is ${code}\n\nIt works for 10 minutes. If you didn't ask for it, ignore this email.`
    })
  });
  return r.ok;
}

/** @param {Request} req  @param {Env} env */
async function start(req, env){
  const { email: raw } = /** @type {any} */ (await req.json());
  const email = str(raw, 254).toLowerCase();
  if (!EMAIL.test(email)) return err(400, 'Enter a valid email address.');
  // Through the Vercel rewrite every visitor arrives from Vercel's IPs, so take the visitor's from x-forwarded-for.
  // ponytail: that header can be faked by calling workers.dev directly; the per-email limit still holds. Drop this once DNS is on Cloudflare.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || 'local';
  const now = Date.now();
  await env.DB.prepare('DELETE FROM codes WHERE created_at < ?').bind(now - HOUR).run();
  const { byEmail, byIp } = await env.DB.prepare(
    'SELECT SUM(email = ?) AS byEmail, SUM(ip = ?) AS byIp FROM codes WHERE created_at > ?'
  ).bind(email, ip, now - HOUR).first();
  if (byEmail >= 5 || byIp >= 20) return err(429, 'Too many codes asked for. Try again in an hour.');

  const code = sixDigits();
  await env.DB.prepare('INSERT INTO codes (email, ip, hash, created_at) VALUES (?, ?, ?, ?)')
    .bind(email, ip, await sha256(`${email}:${code}`), now).run();
  // ponytail: no pepper on the code hash; a 6-digit code that dies in 10 minutes isn't worth another secret.
  if (await sendCode(env, email, code)) return json({ ok: true });
  if (env.DEV_ECHO_CODE === '1') return json({ ok: true, dev_code: code });   // local dev only (.dev.vars)
  return err(503, "We couldn't send the email. Please try again.");
}

/** @param {Request} req  @param {Env} env */
async function verify(req, env){
  const body = /** @type {any} */ (await req.json());
  const email = str(body.email, 254).toLowerCase();
  const code = str(body.code, 6);
  const now = Date.now();
  const row = await env.DB.prepare('SELECT rowid, hash, tries FROM codes WHERE email = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1')
    .bind(email, now - CODE_TTL).first();
  if (!row || row.tries >= 5) return err(400, 'That code has expired. Ask for a new one.');
  await env.DB.prepare('UPDATE codes SET tries = tries + 1 WHERE rowid = ?').bind(row.rowid).run();
  if (row.hash !== await sha256(`${email}:${code}`)) return err(400, "That code isn't right.");

  await env.DB.prepare('DELETE FROM codes WHERE email = ?').bind(email).run();
  const { user, setCookie } = await signIn(env, email);
  return json(publicUser(user), 200, { 'set-cookie': setCookie });
}

/** Find or create the account for a checked email and open a session. Google's name fills an empty name only.
 * @param {Env} env  @param {string} email  @param {string} [name] */
async function signIn(env, email, name = ''){
  const now = Date.now();
  const user = /** @type {User} */ (await env.DB.prepare(
    "INSERT INTO users (email, name, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at, name = CASE WHEN users.name = '' THEN excluded.name ELSE users.name END RETURNING *"
  ).bind(email, str(name, 120), now, now).first());
  const token = randomHex(32);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
    env.DB.prepare('INSERT INTO sessions (hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(token), user.id, now + SESSION_TTL)
  ]);
  return { user, setCookie: cookie(token, SESSION_TTL / 1000) };
}

const siteUrl = (/** @type {Request} */ req, /** @type {Env} */ env) => env.SITE_URL || new URL(req.url).origin;
const STATE = 'eb_oauth';

/** Step 1: send the visitor to Google with a one-time state (CSRF) in a short cookie. @param {Request} req  @param {Env} env */
function googleStart(req, env){
  if (!env.GOOGLE_CLIENT_ID) return err(404, 'Google sign-in is not switched on.');
  const state = randomHex(16);
  const u = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  u.search = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${siteUrl(req, env)}/api/auth/google/callback`,
    response_type: 'code', scope: 'openid email profile', state, prompt: 'select_account'
  }).toString();
  return new Response(null, { status: 302, headers: {
    location: u.toString(), 'cache-control': 'no-store',
    'set-cookie': `${STATE}=${state}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  } });
}

/** Step 2: Google sends the visitor back with a code; swap it for the verified email. @param {Request} req  @param {Env} env */
async function googleCallback(req, env){
  const url = new URL(req.url);
  const back = (/** @type {string} */ q, /** @type {Record<string, string>} */ h = {}) => new Response(null, { status: 302, headers: { location: `${siteUrl(req, env)}/account?${q}`, 'cache-control': 'no-store', ...h } });
  const expected = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|; )${STATE}=([0-9a-f]{32})`))?.[1];
  const code = url.searchParams.get('code');
  if (!code || !expected || url.searchParams.get('state') !== expected || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return back('google=failed');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: `${siteUrl(req, env)}/api/auth/google/callback`, grant_type: 'authorization_code' })
  });
  if (!r.ok) return back('google=failed');
  // The id_token came straight from Google over TLS in exchange for our secret, so its signature needn't be re-checked (OpenID Connect Core 3.1.3.7).
  const { id_token } = /** @type {any} */ (await r.json());
  const claims = JSON.parse(atob(String(id_token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  if (claims.aud !== env.GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || !claims.email_verified) return back('google=failed');
  const { setCookie } = await signIn(env, String(claims.email).toLowerCase(), claims.name || '');
  const res = back('signed-in=1');
  res.headers.append('set-cookie', setCookie);
  res.headers.append('set-cookie', `${STATE}=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}

/** @param {Request} req  @param {Env} env */
async function logout(req, env){
  const t = tokenOf(req);
  if (t) await env.DB.prepare('DELETE FROM sessions WHERE hash = ?').bind(await sha256(t)).run();
  return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
}

/** @param {Request} req  @param {Env} env  @param {User} u */
async function saveProfile(req, env, u){
  const b = /** @type {any} */ (await req.json());
  const p = {
    name: str(b.name, 120), phone: str(b.phone, 20), address: str(b.address, 500),
    pincode: str(b.pincode, 6).replace(/\D/g, ''), newsletter: b.newsletter ? 1 : 0
  };
  const user = await env.DB.prepare(
    'UPDATE users SET name = ?, phone = ?, address = ?, pincode = ?, newsletter = ?, updated_at = ? WHERE id = ? RETURNING *'
  ).bind(p.name, p.phone, p.address, p.pincode, p.newsletter, Date.now(), u.id).first();
  return json(publicUser(user));
}

/** @param {Request} req  @param {Env} env  @param {User} u */
async function saveCart(req, env, u){
  const text = await req.text();
  if (text.length > MAX_CART_BYTES) return err(413, 'Cart is too large.');
  const b = /** @type {any} */ (JSON.parse(text));
  if (!Array.isArray(b.cart) || !Array.isArray(b.saved)) return err(400, 'Bad cart.');
  // Lines are ids only; the browser re-checks every one against data/ on read (cart.js clean()).
  await env.DB.prepare('UPDATE users SET cart = ?, updated_at = ? WHERE id = ?')
    .bind(JSON.stringify({ cart: b.cart, saved: b.saved }), Date.now(), u.id).run();
  return json({ ok: true });
}

/** @param {Env} env  @param {User} u */
async function deleteAccount(env, u){
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(u.id),
    env.DB.prepare('DELETE FROM codes WHERE email = ?').bind(u.email),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(u.id)
  ]);
  return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
}

/** @param {Request} req  @param {Env} env */
async function api(req, env){
  const { pathname } = new URL(req.url);
  const m = req.method;
  if (m !== 'GET') {
    // CSRF: a cross-site form can't send JSON, and browsers send Origin on every write.
    const origin = req.headers.get('origin');
    if (!(req.headers.get('content-type') || '').startsWith('application/json')) return err(415, 'JSON only.');
    if (origin && origin !== new URL(req.url).origin && origin !== siteUrl(req, env)) return err(403, 'Wrong origin.');
  }

  if (m === 'GET' && pathname === '/api/auth/options') return json({ google: !!env.GOOGLE_CLIENT_ID, email: !!env.RESEND_KEY || env.DEV_ECHO_CODE === '1' });
  if (m === 'GET' && pathname === '/api/auth/google') return googleStart(req, env);
  if (m === 'GET' && pathname === '/api/auth/google/callback') return googleCallback(req, env);

  if (m === 'POST' && pathname === '/api/auth/start') return start(req, env);
  if (m === 'POST' && pathname === '/api/auth/verify') return verify(req, env);
  if (m === 'POST' && pathname === '/api/auth/logout') return logout(req, env);

  const u = await currentUser(req, env);
  const route = `${m} ${pathname}`;
  if (!['GET /api/me', 'PUT /api/me', 'DELETE /api/me', 'PUT /api/cart'].includes(route)) return err(404, 'Not found.');
  if (!u) return err(401, 'Not signed in.');
  if (route === 'GET /api/me') return json(publicUser(u));
  if (route === 'PUT /api/me') return saveProfile(req, env, u);
  if (route === 'DELETE /api/me') return deleteAccount(env, u);
  return saveCart(req, env, u);
}

export default {
  /** @param {Request} req  @param {Env} env */
  async fetch(req, env){
    if (!new URL(req.url).pathname.startsWith('/api/')) return env.ASSETS.fetch(req);
    try { return await api(req, env); }
    catch (e) {
      if (e instanceof SyntaxError) return err(400, 'Bad JSON.');
      console.error(e);
      return err(500, 'Something went wrong. Please try again.');
    }
  }
};
