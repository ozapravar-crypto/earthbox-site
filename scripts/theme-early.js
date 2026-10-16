// ─────────────────────────────────────────────────────────────────────
// theme-early.js · day or night, set before the page paints
//
// Loaded as a plain (blocking) script in every <head>, so the page never
// flashes the wrong theme. Light between sunrise and sunset in Mumbai,
// dark otherwise (owner, 16 Oct 2026). A visitor's own switch wins until
// the next sunrise or sunset; theme.js handles the switch.
//
// ponytail: Mumbai's sky for every visitor — the studio only delivers in
// Mumbai. Use the visitor's own location only if overseas traffic matters.
// ─────────────────────────────────────────────────────────────────────
(function () {
  var LAT = 19.076, LNG = 72.8777, rad = Math.PI / 180, DAY = 864e5;

  // Sunrise and sunset (ms) around a moment, after suncalc (NOAA formulas).
  function sun(ms) {
    var d = ms / DAY - 10957.5, lw = -LNG * rad, phi = LAT * rad;
    var n = Math.round(d - 0.0009 - lw / (2 * Math.PI));
    var ds = 0.0009 + lw / (2 * Math.PI) + n;
    var M = rad * (357.5291 + 0.98560028 * ds);
    var L = M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    var dec = Math.asin(Math.sin(rad * 23.4397) * Math.sin(L));
    var noon = ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var w = Math.acos((Math.sin(-0.833 * rad) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec)));
    var set = 0.0009 + (w + lw) / (2 * Math.PI) + n + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    var toMs = function (x) { return (x + 10957.5) * DAY; };
    return { rise: toMs(noon - (set - noon)), set: toMs(set) };
  }

  function isDay(ms) { var s = sun(ms); return ms >= s.rise && ms < s.set; }

  // When the sky next changes: today's sunrise, today's sunset, or tomorrow's sunrise.
  function nextChange(ms) {
    var s = sun(ms);
    if (ms < s.rise) return s.rise;
    if (ms < s.set) return s.set;
    return sun(ms + DAY).rise;
  }

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // The visitor's own choice while it lasts, else the sky.
  // A choice saved without an end time (before 16 Oct, and in tests) is kept.
  function resolve(ms) {
    var t = read('earthbox-theme'), until = Number(read('earthbox-theme-until'));
    if ((t === 'dark' || t === 'light') && (!until || ms < until)) return t;
    return isDay(ms) ? 'light' : 'dark';
  }

  window.ebTheme = { sun: sun, isDay: isDay, nextChange: nextChange, resolve: resolve };
  document.documentElement.setAttribute('data-theme', resolve(Date.now()));
})();
