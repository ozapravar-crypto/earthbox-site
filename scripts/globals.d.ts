// Globals the site's own scripts put on window (no imports here, so these
// merge into the DOM's Window).

/** Sky clock from theme-early.js (a classic script, loaded in every <head>). */
interface EbTheme {
  sun(ms: number): { rise: number; set: number };
  isDay(ms: number): boolean;
  nextChange(ms: number): number;
  resolve(ms: number): 'light' | 'dark';
}

interface Window {
  /** theme-early.js */
  ebTheme?: EbTheme;
  /** motion-scroll.js, for tests and debugging */
  __earthboxLenis?: import('./vendor/lenis.js').default;
  /** consent.js (Google tag) */
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  /** tests/smoke.spec.mjs: layout shift total */
  __cls?: number;
  /** qa/contrast/scan.js: next element id across scans */
  __cqNext?: number;
}
