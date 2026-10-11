// ─────────────────────────────────────────────────────────────────────
// data/site.js · facts every page shares (pure, no DOM)
//
// One place for the contact details, the nav, and the header + footer
// markup. Pages don't hand-copy them any more:
//   · scripts/includes.mjs writes runheadHTML / footerHTML into every page
//     at build time (static HTML, so crawlers still see it), and
//     `npm test` fails if a page is out of step;
//   · menu.js builds the mobile menu from TOP_NAV (NAV minus the Journal);
//   · enquiry-form.js, cart.js, maker.js … read the contact constants.
// Change a link, a phone number or the refund policy HERE, then run
// `npm run build`.
// ─────────────────────────────────────────────────────────────────────

export const SITE = 'https://www.earthbox.in';   // canonical host — the apex 307s here
export const EMAIL = 'aayush.lilani@gmail.com';
export const PHONE = '918104811584';              // wa.me / tel: form
export const PHONE_DISPLAY = '+91 81048 11584';
const ADDRESS = 'Kandivali, Mumbai 400101';

export const NAV = [
  { href: '/',         label: 'Home' },
  { href: '/products', label: 'Catalogue' },
  { href: '/maker',    label: 'Maker' },
  { href: '/care',     label: 'Care' },
  { href: '/blog',     label: 'Journal' },
  { href: '/about',    label: 'About' }
];
// The top bar and phone menu leave the Journal out (Aayush, 11 Oct 2026);
// the footer still lists it, so it stays one tap away on every page.
export const TOP_NAV = NAV.filter(n => n.href !== '/blog');

// Confirmed by the owner's choice on 10 Oct 2026 (was two versions; site-h04
// stays open until Aayush confirms the wording).
const REFUND = [
  'Within 12 hours · full refund',
  '12–48 hours · 70% refund',
  'Before shipping · 50% refund',
  'After shipping · 20% refund',
  'Replacement case-by-case'
];

const STUDIO = ['By enquiry only', 'Delivery within Mumbai'];

const SOCIAL = [
  { href: 'https://www.instagram.com/earthbox_india', label: 'Instagram',
    svg: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>' },
  { href: 'https://www.linkedin.com/in/aayush-lilani-13a329292/', label: 'LinkedIn',
    svg: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>' }
];

// The home page's first footer column links to its own sections.
const HOME_STUDY = [
  { href: '#philosophy', label: 'Philosophy' }, { href: '#principles', label: 'Principles' },
  { href: '/products', label: 'Catalogue' }, { href: '/maker', label: 'Maker' },
  { href: '/blog', label: 'Journal' }, { href: '#purpose', label: 'Purpose' },
  { href: '/about', label: 'About' }
];

// `prefix` is '' at the root and '../' under /blog/ (for assets). Page links
// are clean and root-absolute ("/about", served from about.html: cleanUrls in
// vercel.json), so they need no prefix. `current` is the NAV href of this
// page (or null), marked aria-current.
const link = (prefix, h) => (h.startsWith('#') || h.startsWith('/') ? h : prefix + h);
// "about.html" → "/about", "index.html" → "/", "blog/x.html" → "/blog/x".
export const cleanPath = (file) => `/${file.replace(/\.html$/, '').replace(/(^|\/)index$/, '')}`;

// Analytics waits for consent: the gtag() queue is set up here, but
// Google's script only loads after "Accept" (scripts/consent.js). Stamped
// into every page's <head> by includes.mjs, between the two markers.
export const analyticsHTML = ({ prefix = '' } = {}) => `<!-- Analytics -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-1HHZETMVWP');
  </script>
  <script src="${prefix}scripts/consent.js" defer></script>
  <!-- /Analytics -->`;

export function runheadHTML({ prefix = '', current = null } = {}){
  return `<header class="runhead" role="banner">
  <a href="/" class="runhead-left caption">EarthBox</a>
  <nav class="runhead-nav" aria-label="Primary">
${TOP_NAV.map(n => `    <a href="${link(prefix, n.href)}"${n.href === current ? ' aria-current="page"' : ''}>${n.label}</a>`).join('\n')}
  </nav>
</header>`;
}

export function footerHTML({ prefix = '', home = false } = {}){
  const first = home ? { title: 'The Study', links: HOME_STUDY } : { title: 'Browse', links: NAV };
  const li = (items) => items.map(t => `        <li>${t}</li>`).join('\n');
  return `<footer class="colophon">
  <div class="colo-main">
    <div class="colo-mark">
      <img src="${prefix}assets/logo.webp" alt="EarthBox logo" width="60" height="60"/>
      <div>
        <div class="wname">EarthBox</div>
        <span class="ws">Contained Worlds</span>
      </div>
    </div>

    <div class="colo-col">
      <h2>${first.title}</h2>
      <ul>
${li(first.links.map(l => `<a href="${link(prefix, l.href)}">${l.label}</a>`))}
      </ul>
    </div>

    <div class="colo-col">
      <h2>Correspondence</h2>
      <ul>
        <li><a href="mailto:${EMAIL}">${EMAIL}</a></li>
        <li><a href="tel:+${PHONE}">${PHONE_DISPLAY}</a></li>
        <li class="colo-social">
${SOCIAL.map(s => `          <a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${s.svg}</svg>
          </a>`).join('\n')}
        </li>
        <li>${ADDRESS}</li>
      </ul>
    </div>

    <div class="colo-col">
      <h2>Studio</h2>
      <ul>
${li(STUDIO)}
      </ul>
    </div>

    <div class="colo-col">
      <h2>Replacement &amp; Cancellation</h2>
      <ul>
${li(REFUND)}
      </ul>
    </div>
  </div>

  <div class="colo-bar">
    <span>© 2026 · EarthBox · ${ADDRESS} · <a href="/privacy">Privacy</a></span>
    <span class="quote">The brand speaks softly, like a crafted object label.</span>
  </div>
</footer>`;
}
