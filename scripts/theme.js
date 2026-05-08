// ─────────────────────────────────────────────────────────────────────
// theme.js · Dark/Light mode toggle (pill switch)
//
// Priority: localStorage > prefers-color-scheme > light (default)
// Stores preference in localStorage as 'earthbox-theme'
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'earthbox-theme';

function getSystemPreference() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  updateAllToggles(theme);
}

function updateAllToggles(theme) {
  document.querySelectorAll('.theme-toggle').forEach(toggle => {
    toggle.classList.toggle('is-dark', theme === 'dark');
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setStoredTheme(next);
}

function createToggle(theme) {
  const toggle = document.createElement('button');
  toggle.className = 'theme-toggle' + (theme === 'dark' ? ' is-dark' : '');
  toggle.type = 'button';
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
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
  const stored = getStoredTheme();
  const theme = stored || getSystemPreference();
  applyTheme(theme);

  // Desktop toggle in runhead (right side)
  const runhead = document.querySelector('.runhead');
  if (runhead) {
    const toggle = createToggle(theme);
    toggle.classList.add('theme-toggle-desktop');
    runhead.appendChild(toggle);
  }

  // Mobile toggle will be added by menu.js after panel is created
  // We expose a helper function for it
  window.__earthboxCreateThemeToggle = () => createToggle(
    document.documentElement.getAttribute('data-theme') || 'light'
  );

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}
