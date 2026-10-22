// knip: unused files, exports and dependencies. No bundler, so the entry
// points are spelled out: the one browser entry (main.js follows its own
// dynamic import()s), the build/check scripts and the tests.
// Run: npm run check:unused
export default {
  // consent.js and theme-early.js are plain <script> tags in every page's <head>.
  entry: ['scripts/main.js', 'scripts/consent.js', 'scripts/theme-early.js', 'scripts/*.mjs', 'scripts/*.test.mjs', 'tests/**/*.mjs', 'qa/**/*.mjs'],
  project: ['scripts/**/*.{js,mjs}', 'data/**/*.js', 'tests/**/*.mjs'],
  // Types for the vendored libraries (scripts/vendor/*.d.ts point to them).
  ignoreDependencies: ['lenis']
};
