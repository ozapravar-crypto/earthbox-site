// ─────────────────────────────────────────────────────────────────────
// menu.js · mobile hamburger + side-panel navigation
//
// Injects a hamburger button into .runhead and a sliding side-panel
// into <body>. Visible only on mobile (≤720px) via CSS. Click the
// hamburger to open; click the overlay or close (×) to dismiss.
//
// Keeps the desktop nav (centred links in runhead) untouched.
// ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: 'index.html',    label: 'Home' },
  { href: 'products.html', label: 'Catalogue' },
  { href: 'blog.html',     label: 'Journal' },
  { href: 'about.html',    label: 'About' }
];

export function initMenu(){
  const runhead = document.querySelector('.runhead');
  if (!runhead) return;

  // Determine current page so we mark the active link
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

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
    <button class="mobile-nav-close" type="button" aria-label="Close menu">×</button>
    <nav>
      <ul>
        ${NAV_LINKS.map(l => {
          const active = l.href.toLowerCase() === path;
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
    if (themeContainer && window.__earthboxCreateThemeToggle) {
      const mobileToggle = window.__earthboxCreateThemeToggle();
      mobileToggle.classList.add('theme-toggle-mobile');

      const label = document.createElement('span');
      label.className = 'mobile-theme-label caption';
      label.textContent = 'Dark mode';

      themeContainer.appendChild(label);
      themeContainer.appendChild(mobileToggle);
    }
  }, 0);

  // ─── Open / close behaviour ───
  const setOpen = (open) => {
    document.body.classList.toggle('menu-open', open);
    panel.classList.toggle('is-open', open);
    overlay.classList.toggle('is-open', open);
    ham.setAttribute('aria-expanded', String(open));
    panel.setAttribute('aria-hidden', String(!open));
    overlay.setAttribute('aria-hidden', String(!open));
  };

  ham.addEventListener('click', () => setOpen(!panel.classList.contains('is-open')));
  overlay.addEventListener('click', () => setOpen(false));
  panel.querySelector('.mobile-nav-close').addEventListener('click', () => setOpen(false));

  // Close on link click (so navigation looks responsive)
  panel.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) setOpen(false);
  });
}
