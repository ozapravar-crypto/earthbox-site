// Run: node scripts/enquiry-form.test.mjs
// Guards the two bits of enquiry-form.js that can silently go wrong:
// the payload sent to the form service, and HTML escaping of product names.
import assert from 'node:assert/strict';
import { buildPayload, enquiryAltHTML, pincodeHint } from './enquiry-form.js';

// Payload: trims input, labels the subject with the product.
const p = buildPayload(
  { name: ' Asha ', email: ' asha@example.com ', message: ' Interested. ', product: ' FireBox ' },
  'test-key'
);
assert.equal(p.access_key, 'test-key');
assert.equal(p.subject, 'EarthBox enquiry — FireBox');
assert.equal(p.name, 'Asha');
assert.equal(p.email, 'asha@example.com');
assert.equal(p.message, 'Interested.');

// No product (catalogue-wide enquiry) still produces a usable subject.
assert.equal(buildPayload({}, 'k').subject, 'EarthBox enquiry — general');

// Missing fields become empty strings, never "undefined".
assert.equal(buildPayload({}, 'k').name, '');

// Product names are interpolated into markup — they must be escaped.
const html = enquiryAltHTML('<img src=x onerror=alert(1)>');
assert.ok(!html.includes('<img'), 'product name must be escaped');
assert.ok(html.includes('&lt;img'), 'escaped form should be present');

// The form ships inert until the access key is filled in.
assert.ok(enquiryAltHTML('FireBox').includes('name="botcheck"'), 'honeypot present');

// The cart's order form (UX audit S-08/S-09): name, phone, pincode required,
// email optional, the order read-only, labelled as an order.
const order = enquiryAltHTML('Cart · 2 pieces', 'line 1', { order: true, values: { name: 'Asha', pincode: '400101' } });
assert.match(order, /class="enquiry-alt enquiry-alt--order"/);
assert.match(order, /Send by email instead/);
assert.match(order, /aria-label="Send order by email"/);
assert.match(order, />Send order by email</);
for (const f of ['name', 'phone', 'pincode']) assert.match(order, new RegExp(`name="${f}" required`), `${f} is required`);
assert.match(order, /type="email" name="email" autocomplete/, 'email is optional');
assert.match(order, /<textarea name="message" rows="6" readonly>line 1</);
assert.match(order, /name="name" required autocomplete="name" value="Asha"/, 'typed values survive a redraw');
assert.match(order, /inside our delivery area/);
assert.ok(!enquiryAltHTML('X').includes('name="phone"'), 'other forms are unchanged');
assert.ok(enquiryAltHTML('X').includes('type="email" name="email" required'), 'other forms still need an email');
// Values are escaped too.
assert.ok(!enquiryAltHTML('', '', { order: true, values: { name: '"><img>' } }).includes('"><img>'));

// Payload keeps every field sent today, plus phone and pincode.
const op = buildPayload({ name: 'Asha', phone: ' 98200 00000 ', pincode: ' 400101 ', message: 'm', product: 'Cart' }, 'k');
assert.deepEqual(Object.keys(op).sort(), ['access_key', 'botcheck', 'email', 'from_name', 'message', 'name', 'page', 'phone', 'pincode', 'product', 'subject']);
assert.equal(op.phone, '98200 00000');
assert.equal(op.pincode, '400101');
assert.equal(op.email, '');
assert.equal(buildPayload({}, 'k').phone, '');

// Pincode hint: Mumbai coverage from data/care.js; never a refusal.
assert.match(pincodeHint('400101'), /inside our delivery area/);
assert.match(pincodeHint('110001'), /studio will confirm/);
assert.match(pincodeHint('40'), /We deliver within Mumbai/);

console.log('enquiry-form: all checks passed');
