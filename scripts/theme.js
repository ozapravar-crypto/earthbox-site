// ─────────────────────────────────────────────────────────────────────
// theme.js · Dark/Light mode toggle
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
  updateToggleIcon(theme);
}

function updateToggleIcon(theme) {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const sunIcon = toggle.querySelector('.theme-icon-sun');
  const moonIcon = toggle.querySelector('.theme-icon-moon');

  if (sunIcon && moonIcon) {
    // Show sun in dark mode (click to go light), moon in light mode (click to go dark)
    sunIcon.style.display = theme === 'dark' ? 'block' : 'none';
    moonIcon.style.display = theme === 'light' ? 'block' : 'none';
  }

  toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setStoredTheme(next);
}

export function initTheme() {
  // Determine initial theme
  const stored = getStoredTheme();
  const theme = stored || getSystemPreference();

  // Apply immediately (no flash)
  applyTheme(theme);

  // Create toggle button in runhead
  const runhead = document.querySelector('.runhead');
  if (runhead) {
    const toggle = document.createElement('button');
    toggle.id = 'themeToggle';
    toggle.className = 'theme-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggle.innerHTML = `
      <svg class="theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
      <svg class="theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    `;

    toggle.addEventListener('click', toggleTheme);

    // Insert before the scroll counter (runhead-right)
    const runheadRight = runhead.querySelector('.runhead-right');
    if (runheadRight) {
      runhead.insertBefore(toggle, runheadRight);
    } else {
      runhead.appendChild(toggle);
    }

    updateToggleIcon(theme);
  }

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Only auto-switch if user hasn't set a preference
    if (!getStoredTheme()) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}
