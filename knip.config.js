// knip: unused files, exports and dependencies. No bundler, so the entry
// points are spelled out: the one browser entry (main.js follows its own
// dynamic import()s), the build/check scripts and the tests.
// Run: npm run check:unused
export default {
  entry: ['scripts/main.js', 'scripts/*.mjs', 'scripts/*.test.mjs', 'tests/**/*.mjs'],
  project: ['scripts/**/*.{js,mjs}', 'data/**/*.js', 'tests/**/*.mjs'],
  ignore: [
    'scripts/vendor/**',
    'scripts/lenis.js'             // kept on purpose: smooth scroll, off for now (see main.js header)
  ],
  ignoreDependencies: ['sharp']    // used by the local image tools above
};
