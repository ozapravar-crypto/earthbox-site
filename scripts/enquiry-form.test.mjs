// Run: node scripts/enquiry-form.test.mjs
// Guards the two bits of enquiry-form.js that can silently go wrong:
// the payload sent to the form service, and HTML escaping of product names.
import assert from 'node:assert/strict';
import { buildPayload, enquiryAltHTML } from './enquiry-form.js';

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

console.log('enquiry-form: all checks passed');
