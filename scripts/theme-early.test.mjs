// theme-early.test.mjs · day/night theme from Mumbai's sunrise and sunset.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('./theme-early.js', import.meta.url), 'utf8');
const load = (/** @type {Record<string, string>} */ store = {}) => {
  /** @type {Record<string, string>} */
  const attrs = {};
  /** @type {{ ebTheme?: EbTheme }} */
  const window = {};
  vm.runInNewContext(src, { window, Math, Number, Date,
    localStorage: { getItem: (/** @type {string} */ k) => store[k] ?? null },
    document: { documentElement: { setAttribute: (/** @type {string} */ k, /** @type {string} */ v) => { attrs[k] = v; } } } });
  return { t: /** @type {EbTheme} */ (window.ebTheme), attrs };   // the script always sets it
};
const ist = (/** @type {string} */ s) => Date.parse(`${s}+05:30`);
const { t } = load();
const hm = (/** @type {number} */ ms) => new Date(ms + 5.5 * 36e5).toISOString().slice(11, 16);

// Published Mumbai times (timeanddate): 21 Jun rise 06:02 set 19:17; 21 Dec rise 07:09 set 18:05.
const jun = t.sun(ist('2026-06-21T12:00')), dec = t.sun(ist('2026-12-21T12:00'));
for (const [got, want] of /** @type {[number, string][]} */ ([[jun.rise, '06:02'], [jun.set, '19:17'], [dec.rise, '07:09'], [dec.set, '18:05']])) {
  const diff = Math.abs(Date.parse(`2000-01-01T${hm(got)}Z`) - Date.parse(`2000-01-01T${want}Z`)) / 6e4;
  assert.ok(diff <= 3, `sun time ${hm(got)} vs published ${want}`);
}
assert.equal(t.isDay(ist('2026-06-21T06:30')), true);
assert.equal(t.isDay(ist('2026-12-21T06:30')), false);
assert.equal(t.isDay(ist('2026-12-21T18:30')), false);
assert.equal(t.isDay(ist('2026-06-21T18:30')), true);
assert.equal(t.isDay(ist('2026-10-16T00:10')), false);
assert.equal(t.isDay(ist('2026-10-16T23:50')), false);

// nextChange: before sunrise → sunrise; day → sunset; evening → tomorrow's sunrise.
assert.equal(hm(t.nextChange(ist('2026-12-21T05:00'))), hm(dec.rise));
assert.equal(hm(t.nextChange(ist('2026-12-21T12:00'))), hm(dec.set));
const tmr = t.nextChange(ist('2026-12-21T21:00'));
assert.ok(tmr > ist('2026-12-22T06:00') && tmr < ist('2026-12-22T08:00'), 'evening → next morning');

// resolve: the sky, unless the visitor's own choice is still current.
const noon = ist('2026-10-16T12:00'), night = ist('2026-10-16T22:00');
assert.equal(t.resolve(noon), 'light');
assert.equal(t.resolve(night), 'dark');
assert.equal(load({ 'earthbox-theme': 'dark' }).t.resolve(noon), 'dark');                       // old choice, no end: kept
assert.equal(load({ 'earthbox-theme': 'dark', 'earthbox-theme-until': String(noon + 1) }).t.resolve(noon), 'dark');
assert.equal(load({ 'earthbox-theme': 'dark', 'earthbox-theme-until': String(noon - 1) }).t.resolve(noon), 'light'); // expired
assert.equal(load({ 'earthbox-theme': 'bogus' }).t.resolve(night), 'dark');
assert.ok(['light', 'dark'].includes(load().attrs['data-theme']));
console.log('# theme-early: all checks passed');
