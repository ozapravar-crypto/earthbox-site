// ─────────────────────────────────────────────────────────────────────
// menu.js · mobile hamburger + side-panel navigation
//
// Injects a hamburger button into .runhead and a sliding side-panel
// into <body>. Visible up to 1080px (phones + tablets: the full header wraps below that) via CSS. Click the
// hamburger to open; click the overlay or close (×) to dismiss.
//
// Keeps the desktop nav (centred links in runhead) untouched.
// ─────────────────────────────────────────────────────────────────────

import { TOP_NAV } from '../data/site.js';
import { icon } from '../data/icons.js';  // same list as the desktop header
import { createToggle } from './theme.js';

export function initMenu(){
  const runhead = document.querySelector('.runhead');
  if (!runhead) return;

  // Determine current page so we mark the active link
  // Clean URLs: "/products" (or "/products.html" on a local file server) → "/products".
  const path = `/${(location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html$/, '').replace(/^index$/, '')}`;

  // ─── Hamburger button (lives inside runhead-right column) ───
  const ham = document.createElement('button');
  ham.className = 'hamburger';
  ham.type = 'button';
  ham.setAttribute('aria-label', 'Open menu');
  ham.setAttribute('aria-expanded', 'false');
  ham.setAttribute('aria-controls', 'mobile-nav');
  ham.innerHTML = '<span></span><span></span><span></span>';

  // Hamburger is appended as the last child of runhead so the mobile
  // CSS can collapse the other columns and place it cleanly on the right.
  runhead.appendChild(ham);

  // ─── Side panel + overlay (siblings of runhead, fixed) ───
  const overlay = document.createElement('div');
  overlay.className = 'mobile-nav-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const panel = document.createElement('aside');
  panel.className = 'mobile-nav';
  panel.id = 'mobile-nav';
  panel.setAttribute('aria-hidden', 'true');
  panel.innerHTML = `
    <button class="mobile-nav-close" type="button" aria-label="Close menu">${icon('x', { size: 'md' })}</button>
    <nav>
      <ul>
        ${TOP_NAV.map(l => {
          const active = l.href === path;
          return `<li><a href="${l.href}"${active ? ' aria-current="page"' : ''}>${l.label}</a></li>`;
        }).join('')}
      </ul>
    </nav>
    <div class="mobile-nav-theme"></div>
    <div class="mobile-nav-foot caption">Kandivali · Mumbai</div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // Add theme toggle to mobile menu (after theme.js has initialized)
  setTimeout(() => {
    const themeContainer = panel.querySelector('.mobile-nav-theme');
    if (themeContainer) {
      const mobileToggle = createToggle(document.documentElement.getAttribute('data-theme') || 'light');
      mobileToggle.classList.add('theme-toggle-mobile');

      const label = document.createElement('span');
      label.className = 'mobile-theme-label caption';
      label.textContent = 'Appearance';

      themeContainer.appendChild(label);
      themeContainer.appendChild(mobileToggle);
    }
  }, 0);

  // ─── Open / close behaviour ───
  const closeBtn = /** @type {HTMLButtonElement} */ (panel.querySelector('.mobile-nav-close'));
  /** @param {boolean} open */
  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    panel.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    ham.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    overlay.setAttribute('aria-hidden', String(!open));
    // Keyboard focus stays in the open menu (UX audit C-04): the page behind
    // is inert, focus moves in, and returns to the menu button on close.
    for (const el of document.body.children) if (el !== panel && el !== overlay && el.tagName !== 'DIALOG') /** @type {HTMLElement} */ (el).inert = open;
    if (open) closeBtn.focus();
    else if (panel.contains(document.activeElement) || document.activeElement === document.body) ham.focus();
  };

  ham.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  overlay.addEventListener('click', () => setOpen(false));
  closeBtn.addEventListener('click', () => setOpen(false));

  // Close on link click (so navigation looks responsive)
  panel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
  });
}
