// End-to-end check of worker/index.js against a real local Worker + D1.
// Run: npm run build && npm run test:api   (starts its own `wrangler dev`)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execSync } from 'node:child_process';

const PORT = 8799;
const BASE = `http://localhost:${PORT}`;
/** @type {import('node:child_process').ChildProcess} */
let dev;

before(async () => {
  execSync('npx wrangler d1 execute earthbox --local --file worker/schema.sql', { stdio: 'ignore' });
  execSync('npx wrangler d1 execute earthbox --local --command "DELETE FROM codes"', { stdio: 'ignore' });   // fresh hourly limits each run
  dev = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--var', 'DEV_ECHO_CODE:1'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 60; i++) {
    try { await fetch(`${BASE}/api/me`); return; } catch { await new Promise(r => { setTimeout(r, 500); }); }
  }
  throw new Error('wrangler dev did not start');
});
after(() => { if (dev.pid) process.kill(-dev.pid); });

// A tiny cookie-keeping client, one per simulated person.
const client = () => {
  let cookie = '';
  /** @param {string} method  @param {string} path  @param {unknown} [body]  @returns {Promise<{ status: number, body: any }>} */
  return async (method, path, body) => {
    const r = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const set = r.headers.get('set-cookie');
    // eslint-disable-next-line require-atomic-updates -- one person's requests run one after another
    if (set) cookie = set.split(';')[0];
    return { status: r.status, body: await r.json() };
  };
};
/** @param {ReturnType<typeof client>} c  @param {string} email */
const signIn = async (c, email) => {
  const { body: { dev_code } } = await c('POST', '/api/auth/start', { email });
  return c('POST', '/api/auth/verify', { email, code: dev_code });
};
const uniq = (/** @type {string} */ n) => `${n}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@example.com`;

void test('static pages still come from dist/', async () => {
  const r = await fetch(`${BASE}/privacy`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy') || '', /default-src 'self'/);
});

void test('sign in with an emailed code, sync the cart, sign out', async () => {
  const c = client();
  assert.equal((await c('GET', '/api/me')).status, 401);
  const email = uniq('a');
  const me = await signIn(c, email);
  assert.equal(me.status, 200);
  assert.equal(me.body.email, email);

  const cart = { cart: [{ kind: 'product', sku: 'EB-01', qty: 2 }], saved: [{ kind: 'build', code: 'abc' }] };
  assert.equal((await c('PUT', '/api/cart', cart)).status, 200);
  assert.deepEqual((await c('GET', '/api/me')).body.cart, cart);

  await c('POST', '/api/auth/logout', {});
  assert.equal((await c('GET', '/api/me')).status, 401);
});

void test('a second device sees the same cart; another person never does', async () => {
  const email = uniq('b');
  const laptop = client(), phone = client(), stranger = client();
  await signIn(laptop, email);
  await laptop('PUT', '/api/cart', { cart: [], saved: [{ kind: 'product', sku: 'EB-02' }] });
  await signIn(phone, email);
  assert.equal((await phone('GET', '/api/me')).body.cart.saved[0].sku, 'EB-02');
  await signIn(stranger, uniq('c'));
  assert.deepEqual((await stranger('GET', '/api/me')).body.cart, { cart: [], saved: [] });
});

void test('wrong codes are refused, and the code dies after 5 tries', async () => {
  const c = client();
  const email = uniq('d');
  const { body: { dev_code } } = await c('POST', '/api/auth/start', { email });
  const wrong = dev_code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await c('POST', '/api/auth/verify', { email, code: wrong })).status, 400);
  assert.equal((await c('POST', '/api/auth/verify', { email, code: dev_code })).status, 400);   // right code, too late
});

void test('at most 5 codes per email an hour', async () => {
  const c = client();
  const email = uniq('e');
  for (let i = 0; i < 5; i++) assert.equal((await c('POST', '/api/auth/start', { email })).status, 200);
  assert.equal((await c('POST', '/api/auth/start', { email })).status, 429);
});

void test('profile saves; delete removes the account for good', async () => {
  const c = client();
  const email = uniq('f');
  await signIn(c, email);
  const p = await c('PUT', '/api/me', { name: 'Asha', phone: '+91 98200 00000', address: 'Kandivali', pincode: '400101x', newsletter: true });
  assert.equal(p.body.pincode, '400101');
  assert.equal(p.body.newsletter, true);
  assert.equal((await c('DELETE', '/api/me', {})).status, 200);
  assert.equal((await c('GET', '/api/me')).status, 401);
  assert.equal((await signIn(c, email)).body.name, '');   // a fresh, empty account
});

void test('writes need JSON from this site', async () => {
  const form = await fetch(`${BASE}/api/auth/start`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'email=x@y.com' });
  assert.equal(form.status, 415);
  const foreign = await fetch(`${BASE}/api/auth/start`, { method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' }, body: '{"email":"x@y.com"}' });
  assert.equal(foreign.status, 403);
});
