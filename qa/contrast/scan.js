// ─────────────────────────────────────────────────────────────────────
// qa/contrast/scan.js · runs INSIDE the browser (page.evaluate)
//
// Finds every visible piece of text, placeholder, icon-only control and
// focus ring, and works out the colour it is drawn in and the colour it is
// drawn on, from computed styles — including alpha, ancestor opacity and
// stacked semi-transparent backgrounds. Anything a stylesheet can't answer
// (photo or gradient behind it, blend modes, overlapping layers, opacity on
// the background itself) comes back as status "review" with the reason; the
// Node side then measures those against real screenshot pixels.
//
// Self-contained on purpose: Playwright serialises this function.
// ─────────────────────────────────────────────────────────────────────

/** @typedef {{ r: number, g: number, b: number, a: number }} Rgba */
/**
 * One scanned element. A "covered" row has only the first six fields and the
 * status; measured rows have the colours too. measure.mjs adds the pixel fields.
 * @typedef {object} Finding
 * @property {number} cq
 * @property {string} state
 * @property {string} kind         'text' | 'placeholder' | 'icon' | 'focus-ring'
 * @property {string} selector
 * @property {string} text
 * @property {string[]} flags
 * @property {string} status       'pass' | 'fail' | 'review' | 'covered' | 'exempt-disabled' (+ 'accepted' in audit.mjs)
 * @property {string} [fg]
 * @property {string} [fgComposited]
 * @property {string} [bg]
 * @property {number} [ratio]
 * @property {number} [threshold]
 * @property {boolean} [large]
 * @property {number} [fontSize]
 * @property {number} [fontWeight]
 * @property {number} [grain]
 * @property {number} [opAbove]
 * @property {string} [bgCss]
 * @property {string} [inkCss]
 * @property {string} [method]     measure.mjs: 'pixels'
 * @property {number} [ratioMin]   measure.mjs
 * @property {string} [note]       measure.mjs
 */

/**
 * @param {{ scope?: string | null, state?: string, base?: number | null }} [opts]
 * @returns {Finding[]}
 */
export function scanPage({ scope = null, state = 'default', base = null } = {}){
  /** @type {(c: string) => Rgba | null} */
  const parse = (c) => {
    if (!c || c === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
    let m = c.match(/^rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    }
    m = c.match(/^color\(srgb ([^)]+)\)/);
    if (m) {
      const p = m[1].split(/[\s/]+/).filter(Boolean).map(parseFloat);
      return { r: p[0] * 255, g: p[1] * 255, b: p[2] * 255, a: p.length > 3 ? p[3] : 1 };
    }
    return null;
  };
  /** @type {(top: Rgba, bot: Rgba) => Rgba} */
  const over = (top, bot) => {                         // alpha-composite top over bottom (bottom opaque)
    const a = top.a;
    return { r: top.r * a + bot.r * (1 - a), g: top.g * a + bot.g * (1 - a), b: top.b * a + bot.b * (1 - a), a: 1 };
  };
  /** @type {(c: { r: number, g: number, b: number }) => number} */
  const lum = ({ r, g, b }) => {
    const f = (/** @type {number} */ v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b);
  };
  /** @type {(x: Rgba, y: Rgba) => number} */
  const ratio = (x, y) => { const [a, b] = [lum(x), lum(y)].sort((p, q) => q - p); return (a + .05) / (b + .05); };
  /** @type {(c: { r: number, g: number, b: number }) => string} */
  const hex = ({ r, g, b }) => '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');

  const pageBg = () => {
    const h = parse(getComputedStyle(document.documentElement).backgroundColor);
    const b = parse(getComputedStyle(document.body).backgroundColor);
    if (b && b.a >= .999) return b;
    if (h && h.a >= .999) return h;
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  // Effective background: walk ancestors compositing translucent colours.
  // Flags anything that makes a CSS-only answer unreliable.
  /** @param {Element} el */
  function background(el){
    /** @type {Set<string> & { opAbove?: number }} */
    const flags = new Set();
    /** @type {Rgba[]} */
    const layers = [];
    let opacityAbove = 1, opacityBelowBg = 1, found = false;
    for (let n = /** @type {Element | null} */ (el); n?.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const op = parseFloat(cs.opacity);
      if (!found) opacityBelowBg *= op; else opacityAbove *= op;
      if (cs.mixBlendMode && cs.mixBlendMode !== 'normal') flags.add('blend:' + cs.mixBlendMode);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') flags.add('background-image');
      // body::before is the site-wide paper grain (atmosphere.css). It is not
      // flagged per element; instead its worst-case darkening is applied to
      // both colours below (GRAIN), because on borderline pairs it decides
      // pass/fail (the "Coming soon" badge: 4.67 without it, 4.42 under it).
      for (const pseudo of (n === document.body || n === document.documentElement) ? [] : ['::before', '::after']) {
        if (n === el) {                                  // the control's own fill layer (e.g. .cta hover sweep)
          const ps = getComputedStyle(n, pseudo);
          // Only a fill that is actually showing: not display:none (secondary
          // buttons) and not parked outside the box (the .cta sweep at rest is
          // translateY(101%) behind overflow:hidden).
          const m = (ps.transform || 'none').match(/matrix\(([^)]+)\)/);
          const parked = m && Math.abs(parseFloat(m[1].split(',')[5])) >= n.getBoundingClientRect().height * .5;
          if (ps.display !== 'none' && !parked && ps.content && ps.content !== 'none' && ((ps.backgroundImage && ps.backgroundImage !== 'none') || ((parse(ps.backgroundColor)?.a ?? 0) > 0))) flags.add('own-pseudo-fill');
          continue;
        }
        const ps = getComputedStyle(n, pseudo);
        if (ps.content && ps.content !== 'none' && ps.position !== 'static' && ((ps.backgroundImage && ps.backgroundImage !== 'none') || ((parse(ps.backgroundColor)?.a ?? 0) > 0))) {
          const m2 = (ps.transform || 'none').match(/matrix\(([^)]+)\)/);
          const parked2 = m2 && Math.abs(parseFloat(m2[1].split(',')[5])) >= n.getBoundingClientRect().height * .5;
          if (n !== el && ps.display !== 'none' && !parked2) flags.add('pseudo-overlay');   // same "only when showing" rule as own fills
        }
      }
      if (!found) {
        const bg = parse(cs.backgroundColor);
        if (bg && bg.a > 0) { layers.push(bg); if (bg.a >= .999) found = true; }
      }
      if (found && n.tagName === 'DIALOG') break;
    }
    if (opacityAbove < .999) flags.add('opacity-on-background');
    flags.opAbove = opacityAbove;
    let bg = found ? { .../** @type {Rgba} */ (layers.pop()), a: 1 } : pageBg();   // found: a layer was pushed
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return { bg, flags, fgOpacity: opacityBelowBg };
  }

  // Is anything painted between the element and its CSS background? (a
  // positioned photo, canvas, video or another box sitting behind it)
  /** @param {Element} el */
  function behind(el){
    el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
    /** @type {Set<string>} */
    const flags = new Set();
    const r = el.getBoundingClientRect();
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + r.height / 2], [r.right - 2, r.top + r.height / 2]];
    for (const [x, y] of pts) {
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) { flags.add('offscreen-unverified'); continue; }
      const stack = document.elementsFromPoint(x, y);
      const i = stack.findIndex(s => s === el || el.contains(s));
      if (x === pts[0][0] && stack[0] && i !== 0 && !el.contains(stack[0])) flags.add('covered');   // something sits on top (overlay, sticky bar)
      for (const s of stack.slice(Math.max(i, 0) + 1)) {
        if (s.contains(el)) continue;                    // an ancestor: already counted
        if (/^(IMG|VIDEO|CANVAS|PICTURE)$/.test(s.tagName)) flags.add('over-' + s.tagName.toLowerCase());
        else {
          const cs = getComputedStyle(s);
          if (cs.backgroundImage !== 'none') flags.add('over-background-image');
          else if ((parse(cs.backgroundColor)?.a ?? 0) > 0) flags.add('over-other-box');
        }
      }
    }
    return flags;
  }

  const visible = (/** @type {Element} */ el) => {
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    const cs = getComputedStyle(el);
    if (cs.clip && cs.clip !== 'auto' && /rect\(0/.test(cs.clip)) return false;     // .u-sr-only
    if (cs.clipPath && /inset\(50%|circle\(0/.test(cs.clipPath)) return false;
    return true;
  };

  // Ids must stay unique across every scan of this page (axe links, repeated
  // scans in tests): continue from the page's own counter unless told a base.
  let uid = Math.max(base ?? 0, window.__cqNext ?? 0);
  document.querySelectorAll('[data-cq-ring]').forEach(e => e.removeAttribute('data-cq-ring'));
  const selectorOf = (/** @type {Element} */ el) => {
    if (el.id) return '#' + CSS.escape(el.id);
    /** @type {string[]} */
    const parts = [];
    for (let n = /** @type {Element | null} */ (el); n?.nodeType === 1 && parts.length < 5; n = n.parentElement) {
      if (n.id) { parts.unshift('#' + CSS.escape(n.id)); break; }
      let s = n.tagName.toLowerCase();
      const cls = [...n.classList].filter(c => !/^(in|is-|active|reveal)/.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.map(c => CSS.escape(c)).join('.');
      const tag = n.tagName, sib = n.parentElement ? [...n.parentElement.children].filter(c => c.tagName === tag) : [];
      if (sib.length > 1) s += `:nth-of-type(${sib.indexOf(n) + 1})`;
      parts.unshift(s);
    }
    return parts.join(' > ');
  };

  // Paper grain: multiply with rgb(.17) at alpha ≤ .06 × opacity .35 → each
  // channel × (1 − .83 × .021) at worst. Dialogs sit above it (top layer).
  const bodyBefore = getComputedStyle(document.body, '::before');
  const GRAIN = bodyBefore.content !== 'none' && bodyBefore.backgroundImage !== 'none'
    ? 1 - (1 - .17) * .06 * parseFloat(bodyBefore.opacity || '1') : 1;
  /** @type {(c: Rgba, el: Element) => Rgba} */
  const grain = (c, el) => (GRAIN === 1 || el.closest('dialog[open]') ? c : { ...c, r: c.r * GRAIN, g: c.g * GRAIN, b: c.b * GRAIN });

  /** @type {Finding[]} */
  const out = [];
  /**
   * @param {Element} el @param {string} kind @param {string} fgRaw
   * @param {{ text?: string, ringOf?: Element }} [extra]
   */
  function record(el, kind, fgRaw, extra = {}){
    const inner = /** @type {{ innerText?: string }} */ (el).innerText;   // undefined on SVG marks
    const { bg, flags, fgOpacity } = background(el);
    const opAbove = flags.opAbove ?? 1;
    // A ring is drawn around the focused control, over its container: test what
    // lies behind the CONTROL (a photo, a band), but "covered" doesn't apply.
    for (const f of behind(extra.ringOf || el)) if (!(extra.ringOf && f === 'covered')) flags.add(f);
    if (flags.has('covered')) {                          // not visible to anyone: report, don't measure
      el.setAttribute('data-cq', String(++uid));         // id kept so axe findings on it can be settled as "covered"
      out.push({ cq: uid, state, kind, selector: selectorOf(el), text: (extra.text ?? inner ?? '').replace(/\s+/g, ' ').trim().slice(0, 60), status: 'covered', flags: [...flags] });
      return;
    }
    const fg0 = parse(fgRaw);
    if (!fg0) return;
    const fg = { ...fg0, a: fg0.a * fgOpacity };
    if (fg.a < .02) return;                             // fully transparent ink: nothing drawn
    const shownRaw = over(fg, bg);
    const shown = grain(shownRaw, el), bgG = grain(bg, el);
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400;
    const large = kind === 'text' && (size >= 24 || (size >= 18.66 && weight >= 700));
    const threshold = kind === 'icon' || kind === 'focus-ring' ? 3 : large ? 3 : 4.5;
    const r = ratio(shown, bgG);
    const disabled = el.closest(':disabled, [aria-disabled="true"]') !== null;
    const review = [...flags].filter(f => f !== 'offscreen-unverified');
    const status = disabled ? 'exempt-disabled' : review.length ? 'review' : r >= threshold ? 'pass' : 'fail';
    el.setAttribute('data-cq', String(++uid));
    out.push({
      cq: uid, state, kind, selector: selectorOf(el),
      text: (extra.text ?? inner ?? '').replace(/\s+/g, ' ').trim().slice(0, 60),
      fg: hex(fg0) + (fg.a < .999 ? ` @${fg.a.toFixed(2)}` : ''), fgComposited: hex(shown), bg: hex(bg),
      ratio: Math.round(r * 100) / 100, threshold, large, fontSize: size, fontWeight: weight,
      flags: [...flags], status, grain: el.closest('dialog[open]') ? 1 : GRAIN,
      // Opacity on the box that owns the background fades text AND background
      // together; the pixel step needs both to model the ink correctly.
      opAbove: Math.round(opAbove * 1000) / 1000, bgCss: hex(bg), inkCss: hex(shownRaw)
    });
  }

  const root = scope ? document.querySelector(scope) : document.body;
  if (!root) return [];
  // behind() scrolls elements into view; put the page back afterwards so the
  // state being measured (e.g. the header's scrolled look) doesn't drift.
  const startY = scrollY;

  // 1 · Text: every element that directly owns visible text.
  /** @type {Set<Element>} */
  const owners = new Set();
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (t) => /** @type {string} */ (t.nodeValue).trim() && !/** @type {Element} */ (t.parentElement).closest('script,style,noscript,template,svg') ? 1 : 2
  });
  for (let t = tw.nextNode(); t; t = tw.nextNode()) owners.add(/** @type {Element} */ (t.parentElement));   // text nodes under root
  for (const el of owners) if (visible(el)) record(el, 'text', getComputedStyle(el).color);

  // 2 · Placeholders.
  for (const el of /** @type {NodeListOf<HTMLInputElement | HTMLTextAreaElement>} */ (root.querySelectorAll('input[placeholder], textarea[placeholder]')))
    if (visible(el) && !el.value) record(el, 'placeholder', getComputedStyle(el, '::placeholder').color, { text: el.placeholder });

  // 3 · Icon-only controls (non-text contrast, 3:1): svg/span marks inside
  //     links and buttons that have no visible text of their own.
  const CONTROLS = 'a, button, [role=button], summary';
  for (const c of /** @type {HTMLElement[]} */ ([root, ...root.querySelectorAll(CONTROLS)].filter(n => n.matches(CONTROLS)))) {   // root too: a scope can be the control itself
    if (!visible(c) || c.innerText.trim()) continue;
    const mark = c.querySelector('svg') || c.querySelector('span');
    if (!mark || !visible(mark)) continue;
    const cs = getComputedStyle(mark);
    const fg = mark.tagName === 'svg' || mark.tagName === 'SVG'
      ? (cs.stroke && cs.stroke !== 'none' && !cs.stroke.startsWith('url') ? cs.stroke : cs.color)
      : ((parse(cs.backgroundColor)?.a ?? 0) > 0 ? cs.backgroundColor : cs.color);
    record(mark, 'icon', fg, { text: c.getAttribute('aria-label') || '(icon)' });
  }

  // 4 · Focus ring of the focused element, if any (3:1 against what's behind it).
  const f = document.activeElement;
  if (f && f !== document.body && root.contains(f) && visible(f)) {
    const cs = getComputedStyle(f);
    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) {
      // The ring is drawn around the control, so it sits on the parent's background.
      f.setAttribute('data-cq-ring', String(uid + 1));     // the pixel step hides this ring, not the text
      record(f.parentElement || f, 'focus-ring', cs.outlineColor, { ringOf: f, text: `outline of ${f.tagName.toLowerCase()} "${(/** @type {{ innerText?: string }} */ (f).innerText || f.getAttribute('aria-label') || '').trim().slice(0, 30)}"` });
    }
  }
  scrollTo({ top: startY, behavior: 'instant' });
  window.__cqNext = uid + 1;
  return out;
}

// Hover/focus targets: one element per distinct look (tag + classes), so a
// list of 45 identical buttons is checked once, not 45 times.
/** @param {{ limit?: number }} [opts] */
export function interactiveSignatures({ limit = 60 } = {}){
  /** @type {Set<string>} */
  const seen = new Set();
  /** @type {{ i: number, sig: string, offscreen: boolean, label: string }[]} */
  const list = [];
  for (const el of /** @type {NodeListOf<HTMLElement & { placeholder?: string }>} */ (document.querySelectorAll('a[href], button, summary, [role=tab], label.mk-choice, label.mk-gd-opt, input, select, textarea'))) {
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const sig = el.tagName + '.' + [...el.classList].filter(c => !/^(in|is-|active)/.test(c)).sort().join('.') + (el.closest('.runhead') ? '@head' : el.closest('footer') ? '@foot' : el.closest('dialog') ? '@dialog' : '');
    if (seen.has(sig)) continue;
    seen.add(sig);
    el.setAttribute('data-cq-target', String(list.length));
    const off = r.right < 0 || r.bottom < 0 || r.left > innerWidth + scrollX + 4000;   // e.g. the skip link waits off-screen until focused
    list.push({ i: list.length, sig, offscreen: off, label: (el.innerText || el.getAttribute('aria-label') || el.placeholder || '').trim().slice(0, 30) });
    if (list.length >= limit) break;
  }
  return list;
}
