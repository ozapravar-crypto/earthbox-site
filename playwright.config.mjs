// Browser smoke tests: `npm run test:e2e`. Serves the folder as-is (the site
// is static) and runs desktop + phone. Not part of the Vercel build, which
// has no browser; run it before pushing anything that touches the UI.
// Against the live site: BASE_URL=https://www.earthbox.in npm run test:e2e
import { defineConfig, devices } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4173';

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.mjs',
  timeout: 45_000,
  // CI only: one retry, and Playwright reports the test as "flaky" (it still
  // shows in the summary). Not a pass for something broken: a test that fails
  // twice fails the run. Known flake: bead site-ktu (tablet guided search).
  retries: process.env.CI ? 1 : 0,
  fullyParallel: true,
  reporter: [['list']],
  // Every test starts with the cookie choice made (Decline), so the banner
  // doesn't cover what tests click. The banner's own tests clear it.
  use: { baseURL: BASE, reducedMotion: 'reduce',
    storageState: { cookies: [], origins: [{ origin: new URL(BASE).origin, localStorage: [{ name: 'earthbox-consent', value: 'denied' }] }] } },
  webServer: { command: 'node qa/serve-cli.mjs 4173', port: 4173, reuseExistingServer: true, stdout: 'ignore', stderr: 'ignore' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    // Tablet: layout + visual coverage only (the behaviour suites run on desktop + phone).
    { name: 'tablet', testMatch: /(smoke|visual)\.spec\.mjs/, use: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, browserName: 'chromium' } }
  ]
});
