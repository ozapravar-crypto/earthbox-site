// ─────────────────────────────────────────────────────────────────────
// theme.js · Dark/Light mode toggle (pill switch)
//
// The theme follows Mumbai's sky: light from sunrise to sunset, dark at
// night (theme-early.js, which sets it before the page paints). Flipping
// the switch holds the visitor's choice until the next sunrise or sunset,
// stored as 'earthbox-theme' + 'earthbox-theme-until'.
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'earthbox-theme';

const UNTIL_KEY = 'earthbox-theme-until';
// theme-early.js runs first; the fallback only matters if it failed to load.
const sky = () => window.ebTheme ?? { resolve: () => 'light', nextChange: (ms) => ms + 12 * 36e5 };

/** @typedef {'light' | 'dark'} Theme */

/** @param {Theme} theme */
function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    localStorage.setItem(UNTIL_KEY, String(sky().nextChange(Date.now())));
  } catch {
    // localStorage unavailable
  }
}

/** @param {Theme} theme */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateAllToggles(theme);
}

/** @param {Theme} theme */
function updateAllToggles(theme) {
  document.querySelectorAll('.theme-toggle').forEach(toggle => {
    toggle.classList.toggle('is-dark', theme === 'dark');
    toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setStoredTheme(next);
}

/** @param {string} theme  the current data-theme */
export function createToggle(theme) {
  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle' + (theme === 'dark' ? ' is-dark' : '');
  toggle.type = 'button';
  toggle.setAttribute('role', 'switch');
  // One fixed name; the switch state says on/off (iconography audit S5).
  toggle.setAttribute('aria-label', 'Dark mode');
  toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
  toggle.innerHTML = `
    <span class="toggle-track">
      <span class="toggle-icons">
        <svg class="toggle-icon-sun" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="8" cy="8" r="3"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>
        </svg>
        <svg class="toggle-icon-moon" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 2a6 6 0 1 0 6.5 9.5A5 5 0 0 1 6 2z"/>
        </svg>
      </span>
      <span class="toggle-thumb"></span>
    </span>
  `;
  toggle.addEventListener('click', toggleTheme);
  return toggle;
}

export function initTheme() {
  const theme = sky().resolve(Date.now());
  applyTheme(theme);

  // Desktop toggle in runhead (right side)
  const runhead = document.querySelector('.runhead');
  if (runhead) {
    const toggle = createToggle(theme);
    toggle.classList.add('theme-toggle-desktop');
    runhead.appendChild(toggle);
  }

  // menu.js imports createToggle for the mobile panel.

  // Turn at sunrise and sunset while the page is open, and on return to the tab.
  const follow = () => {
    const next = sky().resolve(Date.now());
    if (next !== document.documentElement.getAttribute('data-theme')) applyTheme(next);
  };
  setInterval(follow, 60e3);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) follow(); });
}
