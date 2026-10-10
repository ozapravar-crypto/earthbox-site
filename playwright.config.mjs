// Browser smoke tests: `npm run test:e2e`. Serves the folder as-is (the site
// is static) and runs desktop + phone. Not part of the Vercel build, which
// has no browser; run it before pushing anything that touches the UI.
// Against the live site: BASE_URL=https://www.earthbox.in npm run test:e2e
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.mjs',
  timeout: 45_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4173', reducedMotion: 'reduce' },
  webServer: { command: 'python3 -m http.server 4173', port: 4173, reuseExistingServer: true, stdout: 'ignore', stderr: 'ignore' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } }
  ]
});
