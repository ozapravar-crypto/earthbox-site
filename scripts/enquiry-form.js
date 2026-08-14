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
// ─────────────────────────────────────────────────────────────────────

// ─── Contact details ───
export const ENQUIRY_EMAIL = 'aayush.lilani@gmail.com';
export const ENQUIRY_PHONE = '918104811584';
export const ENQUIRY_PHONE_DISPLAY = '+91 81048 11584';

// ─── Form service ───
// Free access key from https://web3forms.com — enter the address that should
// RECEIVE enquiries (Aayush's) and they email the key back. It is a delivery
// label, not a secret: it is meant to sit in public page source.
// Until it is filled in, the form tells the visitor to email instead.
export const WEB3FORMS_ACCESS_KEY = '3458b029-0772-4d14-8f56-af232841e025';

const ENDPOINT = 'https://api.web3forms.com/submit';

const isConfigured = () => !WEB3FORMS_ACCESS_KEY.startsWith('PASTE_');

const escapeHTML = (s) => String(s).replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
));


// ─── Markup ───
// `product` is the thing being enquired about, used to prefill the message
// and to label the email subject. Pass '' for a general enquiry.
export function enquiryAltHTML(product = ''){
  const p = escapeHTML(product);
  const prefill = p ? `I'd like to know more about ${p}.` : '';

  return `
    <details class="enquiry-alt">
      <summary>Not on WhatsApp Web? &nbsp;Send an enquiry here</summary>

      <form class="enquiry-form" novalidate>
        <input type="hidden" name="product" value="${p}"/>
        <!-- Honeypot: hidden from people, filled in by bots. -->
        <input type="text" name="botcheck" class="enquiry-hp" tabindex="-1" autocomplete="off" aria-hidden="true"/>

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
          <textarea name="message" rows="3" required>${escapeHTML(prefill)}</textarea>
        </label>

        <button type="submit" class="cta enquiry-submit">Send enquiry</button>
      </form>

      <p class="enquiry-status" role="status" aria-live="polite"></p>

      <p class="enquiry-direct">Or write to us directly &mdash;
        <a href="mailto:${ENQUIRY_EMAIL}" data-enquiry-fallback="email">${ENQUIRY_EMAIL}</a> &middot;
        <a href="tel:+${ENQUIRY_PHONE}" data-enquiry-fallback="phone">${ENQUIRY_PHONE_DISPLAY}</a>
      </p>
    </details>`;
}


// ─── Submission payload ───
// Split out so it can be checked without a network call. See
// enquiry-form.test.mjs.
export function buildPayload(fields, key = WEB3FORMS_ACCESS_KEY){
  const product = fields.product?.trim();
  return {
    access_key: key,
    subject: `EarthBox enquiry — ${product || 'general'}`,
    from_name: 'EarthBox website',
    name: fields.name?.trim() || '',
    email: fields.email?.trim() || '',
    message: fields.message?.trim() || '',
    product: product || '',
    page: fields.page || '',
    botcheck: fields.botcheck || ''
  };
}


// ─── Behaviour ───
// Delegated so it survives the renderers injecting CTAs after page load.
export function initEnquiryForm(){
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('.enquiry-form');
    if (!form) return;
    e.preventDefault();

    const wrap   = form.closest('.enquiry-alt');
    const status = wrap.querySelector('.enquiry-status');
    const button = form.querySelector('.enquiry-submit');

    const say = (state, msg) => { status.dataset.state = state; status.textContent = msg; };

    if (!form.checkValidity()) { form.reportValidity(); return; }

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

      if (typeof gtag === 'function'){
        gtag('event', 'enquire_form_submit', {
          product_name: fields.product || '(general)',
          page: location.pathname
        });
      }
    } catch (err) {
      button.disabled = false;
      say('error', `Couldn’t send that — please email ${ENQUIRY_EMAIL} instead.`);
    }
  });
}
