// ─────────────────────────────────────────────────────────────────────
// enquiry-form.js · Desktop enquiry route.
//
// Every CTA on the site is a wa.me deep link. On mobile that opens the
// WhatsApp app. On desktop it redirects to WhatsApp Web, which is a dead
// end for anyone without an active session — they hit a QR wall and leave.
// GA showed 29% of WhatsApp-bound clicks come from desktop, so this module
// renders a desktop-only alternative: direct contact details plus an inline
// form that never leaves the page.
//
// Owns the markup (enquiryAltHTML) and the submit handling (initEnquiryForm).
// Consumed by render-product-detail.js, render-products.js and main.js.
// The cart drawer uses its `order` variant at every width (UX audit S-08).
// ─────────────────────────────────────────────────────────────────────

// ─── Contact details ───
// Contact details live in data/site.js; re-exported under the old names.
export { PHONE as ENQUIRY_PHONE } from '../data/site.js';
import { EMAIL as ENQUIRY_EMAIL, PHONE as ENQUIRY_PHONE, PHONE_DISPLAY as ENQUIRY_PHONE_DISPLAY } from '../data/site.js';
import { esc as escapeHTML, track } from './util.js';
import { icon } from '../data/icons.js';
import { coverage } from '../data/care.js';

// ─── Form service ───
// Free access key from https://web3forms.com — enter the address that should
// RECEIVE enquiries (Aayush's) and they email the key back. It is a delivery
// label, not a secret: it is meant to sit in public page source.
// Until it is filled in, the form tells the visitor to email instead.
const WEB3FORMS_ACCESS_KEY = '3458b029-0772-4d14-8f56-af232841e025';

const ENDPOINT = 'https://api.web3forms.com/submit';

const isConfigured = () => !WEB3FORMS_ACCESS_KEY.startsWith('PASTE_');



// ─── Markup ───
// `product` is the thing being enquired about, used to prefill the message
// and to label the email subject. Pass '' for a general enquiry.
// `message` overrides the prefill (the Maker sends the whole design).
// `order` is the cart's route (UX audit S-08/S-09): shown at every width,
// asks for name, phone and pincode (email optional), and shows the order
// read-only. `values` refills what the visitor already typed, since the cart
// redraws itself.
/**
 * @typedef {{ name?: string, phone?: string, pincode?: string, email?: string }} Contact
 * @param {string} [product]
 * @param {string} [message]
 * @param {{ order?: boolean, values?: Contact }} [opts]
 */
export function enquiryAltHTML(product = '', message = '', { order = false, values = {} } = {}){
  const p = escapeHTML(product);
  const prefill = message || (p ? `I'd like to know more about ${product}.` : '');
  /** @param {keyof Contact} k */
  const v = (k) => escapeHTML(values[k] || '');

  const fields = order ? `
        <label class="enquiry-field">
          <span>Name</span>
          <input type="text" name="name" required autocomplete="name" value="${v('name')}"/>
        </label>
        <label class="enquiry-field">
          <span>Phone</span>
          <input type="tel" name="phone" required autocomplete="tel" inputmode="tel" pattern="[0-9 +]{10,16}" value="${v('phone')}"/>
        </label>
        <label class="enquiry-field">
          <span>Pincode</span>
          <input type="text" name="pincode" required autocomplete="postal-code" inputmode="numeric" maxlength="6" pattern="[0-9]{6}" aria-describedby="enquiryPinHint" value="${v('pincode')}"/>
        </label>
        <p class="enquiry-hint" id="enquiryPinHint" aria-live="polite">${pincodeHint(values.pincode || '')}</p>
        <label class="enquiry-field">
          <span>Email (optional)</span>
          <input type="email" name="email" autocomplete="email" value="${v('email')}"/>
        </label>
        <label class="enquiry-field">
          <span>Your order</span>
          <textarea name="message" rows="6" readonly>${escapeHTML(prefill)}</textarea>
        </label>` : `
        <label class="enquiry-field">
          <span>Name</span>
          <input type="text" name="name" required autocomplete="name"/>
        </label>
        <label class="enquiry-field">
          <span>Email</span>
          <input type="email" name="email" required autocomplete="email"/>
        </label>
        <label class="enquiry-field">
          <span>Message</span>
          <textarea name="message" rows="${message ? 8 : 3}" required>${escapeHTML(prefill)}</textarea>
        </label>`;

  return `
    <details class="enquiry-alt${order ? ' enquiry-alt--order' : ''}">
      <summary>${order ? 'Send by email instead' : 'Prefer email? Send an enquiry'} ${icon('chevron-down', { size: 'xs' })}</summary>

      <form class="enquiry-form" novalidate${order ? ' aria-label="Send order by email"' : ''}>
        <input type="hidden" name="product" value="${p}"/>
        <!-- Honeypot: hidden from people, filled in by bots. -->
        <input type="text" name="botcheck" class="enquiry-hp" tabindex="-1" autocomplete="off" aria-hidden="true"/>
${fields}

        <button type="submit" class="cta cta-secondary enquiry-submit">${order ? 'Send order by email' : 'Send enquiry'}</button>
      </form>

      <p class="enquiry-status" role="status" aria-live="polite"></p>

      <p class="enquiry-direct">Or write to us directly &mdash;
        <a href="mailto:${ENQUIRY_EMAIL}" data-enquiry-fallback="email">${ENQUIRY_EMAIL}</a> &middot;
        <a href="tel:+${ENQUIRY_PHONE}" data-enquiry-fallback="phone">${ENQUIRY_PHONE_DISPLAY}</a>
      </p>
    </details>`;
}

// One quiet line under the pincode: is it inside the delivery area
// (data/care.js coverage)? Never a refusal: the studio confirms.
/** @param {string} pin */
export function pincodeHint(pin){
  const s = String(pin).trim();
  if (!/^[0-9]{6}$/.test(s)) return `We deliver within ${coverage.city}.`;
  return coverage.isCovered(s) ? `${coverage.city} pincode: inside our delivery area.`
    : `Outside ${coverage.city}: the studio will confirm whether it can deliver.`;
}


// ─── Submission payload ───
// Split out so it can be checked without a network call. See
// enquiry-form.test.mjs.
/**
 * @param {{ product?: string, name?: string, email?: string, phone?: string, pincode?: string, message?: string, page?: string, botcheck?: string }} fields
 * @param {string} [key]
 */
export function buildPayload(fields, key = WEB3FORMS_ACCESS_KEY){
  const product = fields.product?.trim();
  return {
    access_key: key,
    subject: `EarthBox enquiry — ${product || 'general'}`,
    from_name: 'EarthBox website',
    name: fields.name?.trim() || '',
    email: fields.email?.trim() || '',
    // The cart's order form adds these (UX audit S-09); other forms send ''.
    phone: fields.phone?.trim() || '',
    pincode: fields.pincode?.trim() || '',
    message: fields.message?.trim() || '',
    product: product || '',
    page: fields.page || '',
    botcheck: fields.botcheck || ''
  };
}


// What's wrong with a form, in words, for its status line (UX audit S-29):
// no browser pop-ups. The fields keep `required`/`pattern`, so the browser's
// own check still guards a page whose script didn't load.
/**
 * @param {HTMLFormElement} form
 * @returns {{ field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, msg: string } | null}
 */
function firstProblem(form){
  const field = /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null} */ (form.querySelector(':invalid:not(fieldset)'));
  if (!field) return null;
  const label = field.type === 'tel' ? 'phone number'
    : (field.closest('label')?.querySelector('span')?.textContent || field.name).replace(/\s*\(optional\)$/i, '').replace(/^your\s+/i, '').trim().toLowerCase();
  const msg = field.validity.valueMissing ? `Please add your ${label}.`
    : field.type === 'email' ? `That email doesn’t look right: please check it.`
    : `Please check your ${label}.`;
  return { field, msg };
}


// ─── Behaviour ───
// Delegated so it survives the renderers injecting CTAs after page load.
export function initEnquiryForm(){
  document.addEventListener('input', (e) => {
    const pin = /** @type {Element} */ (e.target).closest('.enquiry-form input[name=pincode]');
    const hint = pin?.closest('.enquiry-form')?.querySelector('.enquiry-hint');
    if (pin && hint) hint.textContent = pincodeHint(/** @type {HTMLInputElement} */ (pin).value);
  });
  document.addEventListener('submit', async (e) => {
    const form = /** @type {HTMLFormElement | null} */ (/** @type {Element} */ (e.target).closest('.enquiry-form'));
    if (!form) return;
    e.preventDefault();

    // The form is always rendered inside enquiryAltHTML's markup.
    const wrap   = /** @type {HTMLElement} */ (form.closest('.enquiry-alt'));
    const status = /** @type {HTMLElement} */ (wrap.querySelector('.enquiry-status'));
    const button = /** @type {HTMLButtonElement} */ (form.querySelector('.enquiry-submit'));

    /**
     * @param {'ok' | 'error' | 'pending'} state
     * @param {string} msg
     */
    const say = (state, msg) => { status.dataset.state = state; status.textContent = msg; };

    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    const problem = firstProblem(form);
    if (problem) {
      problem.field.setAttribute('aria-invalid', 'true');
      say('error', problem.msg);
      problem.field.focus();
      return;
    }

    if (!isConfigured()){
      say('error', `Our form isn't live yet — please email ${ENQUIRY_EMAIL}.`);
      return;
    }

    const fields = Object.fromEntries(new FormData(form));
    // Bots fill the honeypot. Fail quietly so they learn nothing.
    if (fields.botcheck) { say('ok', 'Thank you — we’ll be in touch.'); form.reset(); return; }

    button.disabled = true;
    say('pending', 'Sending…');

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildPayload({ ...fields, page: location.pathname }))
      });
      const out = await res.json();
      if (!out.success) throw new Error(out.message || 'Submission failed');

      form.hidden = true;
      say('ok', 'Thank you — your enquiry is with us. We usually reply within a day.');
      wrap.dispatchEvent(new CustomEvent('enquiry:sent', { bubbles: true }));   // cart.js listens

      track('enquire_form_submit', {
          product_name: fields.product || '(general)',
          page: location.pathname
        });
    } catch (err) {
      button.disabled = false;
      say('error', `Couldn’t send that — please email ${ENQUIRY_EMAIL} instead.`);
    }
  });
}
