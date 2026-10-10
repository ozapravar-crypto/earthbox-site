// ESLint (flat config). Correctness only, no style rules: unused or
// undefined names, unreachable code, stray console.log. `npm test` runs it.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'scripts/vendor/**', 'assets/**', '.claude/**', '_audits/**', 'qa/reports/**',
    // local-only image tools (gitignored)
    'scripts/optimize-images.*', 'scripts/generate-responsive.cjs'] },
  js.configs.recommended,
  {
    files: ['scripts/**/*.js', 'data/**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.browser, gtag: 'readonly' } },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'no-console': ['error', { allow: ['warn', 'error'] }]
    }
  },
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.cjs', 'tests/**/*.mjs', 'eslint.config.js', 'playwright.config.mjs', 'knip.config.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.node } }
  },
  { files: ['scripts/**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
  // Playwright callbacks passed to page.evaluate() run in the browser.
  { files: ['tests/**/*.mjs', 'qa/**/*.{js,mjs}'], languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { ...globals.node, ...globals.browser } } }
];
