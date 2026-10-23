// ESLint (flat config). Correctness, not style. `npm test` runs it.
//  · core: undefined/unused names, unreachable code, stray console.log, ==,
//    var, needless lets and returns
//  · typescript-eslint, type-aware (reads tsconfig.json): promises that are
//    never awaited or handled, impossible conditions, casts that do nothing,
//    templates that print "[object Object]", throws of non-errors
//  · unused `eslint-disable` comments are errors
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', 'dist/**', '.wrangler/**', 'scripts/vendor/**', 'assets/**', '.claude/**', '_audits/**', 'qa/reports/**', '**/*.d.ts',
    // local-only image tools (gitignored)
    'scripts/optimize-images.*', 'scripts/generate-responsive.cjs'] },
  { linterOptions: { reportUnusedDisableDirectives: 'error' } },
  js.configs.recommended,
  {
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', parser: tseslint.parser, parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-implicit-coercion': ['error', { allow: ['!!', '+'] }],
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-lonely-if': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'array-callback-return': 'error',
      'no-promise-executor-return': 'error',
      'require-atomic-updates': 'error',
      // type-aware
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false } }],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-base-to-string': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true, allowBoolean: true, allowNullish: false }],
      '@typescript-eslint/only-throw-error': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error'
    }
  },
  {
    files: ['scripts/**/*.js', 'data/**/*.js'],
    languageOptions: { globals: { ...globals.browser, gtag: 'readonly' } },
    rules: { 'no-console': ['error', { allow: ['warn', 'error'] }] }
  },
  // theme-early.js is a classic <script>, not a module.
  { files: ['scripts/theme-early.js'], languageOptions: { sourceType: 'script' } },
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.cjs', 'eslint.config.js', 'playwright.config.mjs', 'knip.config.js'],
    languageOptions: { globals: { ...globals.node } }
  },
  { files: ['scripts/**/*.cjs'], languageOptions: { sourceType: 'commonjs' } },
  // The Cloudflare Worker and its test (fetch, crypto, Response are globals in both).
  { files: ['worker/**/*.{js,mjs}'], languageOptions: { globals: { ...globals.node, ...globals.serviceworker } } },
  // Playwright callbacks passed to page.evaluate() run in the browser.
  { files: ['tests/**/*.mjs', 'qa/**/*.{js,mjs}'], languageOptions: { globals: { ...globals.node, ...globals.browser } } }
);
