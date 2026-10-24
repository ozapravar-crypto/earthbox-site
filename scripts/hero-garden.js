// ─────────────────────────────────────────────────────────────────────
// hero-garden.js · ferns and moss grow out of the hero "EarthBox"
//
// Adapted from Type Garden by Akshat Agarwal (type-garden.vercel.app):
// stems root inside each letter and weave in front of / behind it.
// EarthBox profile (MOTION.md §4 row 1):
//  · grows once, letter by letter, as the hero copy fades in; no springs,
//    no boil jitter, no overshoot
//  · fern fronds, fiddleheads and moss instead of roses and thorns
//  · then holds still, apart from a slow lean toward a mouse pointer
//    (the hero's one ambient motion); reduced motion = drawn fully grown
//  · the h1 stays real text: two aria-hidden canvases sit behind and in
//    front of it, inside .hero-copy, so they fade in with the copy
//  · stems stop short of the eyebrow line above the title (keep-out)
// Coordinates in the generator are in font-size units (S) from each
// letter's centre on the baseline; y is negative upward.
// ─────────────────────────────────────────────────────────────────────

/** @typedef {[number, number]} Pt */
/** @typedef {{ u0: number, u1: number, layer: number }} Seg */
/** @typedef {{ t: 'stem', pts: Pt[], segs: Seg[], d0: number, dur: number, w: number }} Stem */
/** @typedef {{ t: 'leaf', x: number, y: number, a: number, L: number, bend: number, layer: number, d0: number }} Leaf */
/** @typedef {{ t: 'moss', x: number, y: number, r: number, layer: number, d0: number }} Moss */
/** @typedef {Stem | Leaf | Moss} El */
/** @typedef {{ maxUp: number, curvy: number, base?: Pt, dir?: number, len?: number, pts?: Pt[], d0: number, tip?: string, depth?: number, layer0?: number }} GrowOpts */

const SEED = 20261024;      // fixed: the garden is designed, the same on every visit
const STAGGER = 120;        // ms between letters (MOTION.md stagger)
const COLOR = { stem: '#7C8B6C', moss: '#6F8257', vein: 'rgba(20,16,10,.5)' }; // ≥3:1 on the scrim, title stays ≥3:1 over them

// ---------- math (pure) ----------
/** @param {number} seed */
export function rng(seed){
  let s = seed | 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** ease-out cubic, clamped · @param {number} t */
const eo = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3;

/** @param {Pt[]} P @param {number} u @returns {[Pt, number]} */
function at(P, u){
  const i = Math.min(P.length - 2, Math.max(1, Math.round(u * (P.length - 1))));
  return [P[i], Math.atan2(P[i + 1][1] - P[i - 1][1], P[i + 1][0] - P[i - 1][0])];
}
/** @param {Pt} a @param {Pt} b @param {Pt} c @param {Pt} d @param {number} n */
function bez(a, b, c, d, n){
  /** @type {Pt[]} */
  const P = [];
  for (let i = 0; i <= n; i++){ const t = i / n, u = 1 - t;
    P.push([u*u*u*a[0] + 3*u*u*t*b[0] + 3*u*t*t*c[0] + t*t*t*d[0], u*u*u*a[1] + 3*u*u*t*b[1] + 3*u*t*t*c[1] + t*t*t*d[1]]); }
  return P;
}
/** @param {Pt} base @param {number} dir @param {number} len @param {number} amp @param {number} waves @param {number} ph @param {number} bend @returns {Pt[]} */
function vine(base, dir, len, amp, waves, ph, bend){
  const n = 40, step = len / n;
  /** @type {Pt[]} */
  const P = [[base[0], base[1]]];
  let [x, y] = base;
  for (let i = 1; i <= n; i++){
    const u = i / n, a = dir + bend * u + amp * Math.sin(u * Math.PI * waves + ph) * Math.min(1, u * 3);
    x += Math.cos(a) * step; y += Math.sin(a) * step; P.push([x, y]);
  }
  return P;
}
/** fiddlehead: the stem's end rolls into a tightening spiral · @param {Pt[]} P @param {number} sign @param {number} rad @returns {Pt[]} */
function curl(P, sign, rad){
  const n = P.length, e = P[n - 1], a = Math.atan2(e[1] - P[n - 2][1], e[0] - P[n - 2][0]);
  const c = [e[0] - Math.sin(a) * sign * rad, e[1] + Math.cos(a) * sign * rad], a0 = Math.atan2(e[1] - c[1], e[0] - c[0]);
  for (let i = 1; i <= 16; i++){ const u = i / 16, t = a0 + sign * u * Math.PI * 1.8, rr = rad * (1 - 0.55 * u); P.push([c[0] + Math.cos(t) * rr, c[1] + Math.sin(t) * rr]); }
  return P;
}
/** shrink a stem about its base so no point rises above -maxUp · @param {Pt[]} P @param {number} maxUp */
function clampUp(P, maxUp){
  const [bx, by] = P[0], top = Math.min(...P.map(p => p[1]));
  if (top >= -maxUp || top >= by) return P;
  const k = Math.max(0, (-maxUp - by) / (top - by));   // bases always sit below -maxUp
  return P.map(([x, y]) => /** @type {Pt} */ ([bx + (x - bx) * k, by + (y - by) * k]));
}
/** where the stem passes behind (0) or in front of (1) the letter · @param {() => number} r @param {number} start */
function weave(r, start){
  const cuts = Array.from({ length: 1 + Math.floor(r() * 3) }, () => 0.15 + r() * 0.7).sort((a, b) => a - b);
  /** @type {Seg[]} */ const segs = []; let u0 = 0, layer = start;
  for (const c of cuts){ if (c <= u0) continue; segs.push({ u0, u1: c, layer }); u0 = c; layer = 1 - layer; }
  segs.push({ u0, u1: 1, layer });
  return segs;
}
/** @param {Seg[]} segs @param {number} u */
const layerAt = (segs, u) => (segs.find(s => u >= s.u0 && u <= s.u1) || segs[segs.length - 1]).layer;

// ---------- growth (pure) ----------
/** @param {() => number} r @param {El[]} E @param {GrowOpts} o */
function grow(r, E, o){
  const tip = o.tip || (r() < 0.5 ? 'frond' : r() < 0.6 ? 'curl' : 'leaf');
  const len = o.len || 0.8;
  let P = o.pts || vine(o.base || [0, 0], o.dir || 0, len, (0.3 + r() * 0.35) * o.curvy, 1 + r() * 1.3, r() * 6.28, (r() - 0.5) * 0.9);
  if (tip === 'curl') P = curl(P, r() < 0.5 ? -1 : 1, 0.045 + r() * 0.035);
  P = clampUp(P, o.maxUp);
  const segs = weave(r, o.layer0 ?? (r() < 0.8 ? 0 : 1));   // mostly behind the letter: the word must read
  const dur = Math.max(600, len * 1100);                     // ~--dur-base per stem
  E.push({ t: 'stem', pts: P, segs, d0: o.d0, dur, w: o.depth ? 0.8 : 1 });
  let sd = r() < 0.5 ? -1 : 1;
  for (let i = 0, n = Math.floor(r() * 2.2); i < n; i++){
    const u = 0.25 + r() * 0.45, [q, a] = at(P, u); sd = -sd;
    E.push({ t: 'leaf', x: q[0], y: q[1], a: a + sd * (0.6 + r() * 0.4), L: 0.09 + r() * 0.1, bend: (r() - 0.5) * 1.2, layer: layerAt(segs, u), d0: o.d0 + dur * u });
  }
  const [tp, ta] = at(P, 1), tl = layerAt(segs, 1);
  if (tip === 'frond'){                                        // paired leaflets, shrinking to the tip
    const n = 4 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++){
      const u = 0.5 + 0.46 * k / n, [q, a] = at(P, u), L = 0.03 + 0.11 * (1 - k / n);
      for (const s of [-1, 1]) E.push({ t: 'leaf', x: q[0], y: q[1], a: a + s * 0.95, L, bend: s * 0.5, layer: layerAt(segs, u), d0: o.d0 + dur * u });
    }
  } else if (tip === 'leaf'){
    E.push({ t: 'leaf', x: tp[0], y: tp[1], a: ta + (r() - 0.5) * 0.3, L: 0.12 + r() * 0.1, bend: r() - 0.5, layer: tl, d0: o.d0 + dur * 0.8 });
  }
  if (!o.depth && r() < 0.3){
    const u = 0.35 + r() * 0.3, [q, a] = at(P, u);
    grow(r, E, { maxUp: o.maxUp, curvy: o.curvy, base: q, dir: a + (r() < 0.5 ? -1 : 1) * (0.7 + r() * 0.4), len: len * (0.35 + r() * 0.2), d0: o.d0 + dur * u, depth: 1, layer0: layerAt(segs, u) });
  }
}

/**
 * The garden for one letter.
 * @param {{ w: number, prevW: number | null, first: boolean, last: boolean, maxUp: number, seed: number }} o
 *   w / prevW: glyph advance in S; maxUp: how far above the baseline growth may reach, in S
 * @returns {El[]}
 */
export function genLetter({ w, prevW, first, last, maxUp, seed }){
  const r = rng(seed), E = /** @type {El[]} */ ([]), inX = () => (r() - 0.5) * w * 0.7, curvy = 0.8 + r() * 0.5;
  // moss first: the letter sits in a cushion before anything climbs (not every letter)
  for (let t = 0, nt = r() < 0.35 ? 0 : 1 + Math.floor(r() * 2); t < nt; t++){
    const cx = (r() - 0.5) * w * 0.8, half = 0.05 + r() * 0.06, layer = r() < 0.7 ? 0 : 1;
    for (let k = 0, nk = 9 + Math.floor(r() * 7); k < nk; k++){
      const dx = (r() * 2 - 1) * half, dome = Math.sqrt(Math.max(0, 1 - (dx / half) ** 2));   // taller in the middle
      const rad = 0.008 + r() * 0.014 * (0.5 + dome);
      E.push({ t: 'moss', x: cx + dx, y: -rad * 0.5 - r() * 0.05 * dome, r: rad, layer, d0: r() * 260 });
    }
  }
  for (let i = 0, n = r() < 0.3 ? 0 : r() < 0.8 ? 1 : 2; i < n; i++)   // some letters stay bare: room to breathe
    grow(r, E, { maxUp, curvy, base: [inX(), -r() * 0.3], dir: -Math.PI / 2 + (r() - 0.5) * 0.7, len: 0.5 + r() * 0.45, d0: 200 + i * 160 });
  if (prevW != null && r() < 0.4){                            // a runner arching over to the previous letter
    const a = /** @type {Pt} */ ([inX(), -0.1 - r() * 0.45]), b = /** @type {Pt} */ ([-(prevW + w) / 2 + (r() - 0.5) * 0.2, -0.1 - r() * 0.45]);
    const bulge = -(0.3 + r() * 0.35), dx = b[0] - a[0];
    let P = bez(a, [a[0] + dx * 0.15, a[1] + bulge], [b[0] - dx * 0.15, b[1] + bulge * 0.9], b, 40);
    if (r() < 0.45) P = P.slice(0, Math.floor(P.length * (0.7 + r() * 0.2)));
    grow(r, E, { maxUp, curvy, pts: P, len: Math.abs(dx) + Math.abs(bulge), d0: 260, tip: r() < 0.6 ? 'curl' : 'leaf' });
  }
  if (first) grow(r, E, { maxUp, curvy, base: [-w * 0.3, -0.2 - r() * 0.3], dir: -Math.PI * 0.8, len: 0.28 + r() * 0.12, d0: 320, tip: 'curl' });   // short, up-left: stays inside the page margin
  if (last) grow(r, E, { maxUp, curvy, base: [w * 0.15, -0.2 - r() * 0.3], dir: -Math.PI / 2 + 0.7, len: 0.55 + r() * 0.3, d0: 420, tip: 'frond', depth: 1 });
  return E;
}

/** when the last element of a letter finishes growing, in ms after the letter starts · @param {El[]} E */
const endOf = E => Math.max(...E.map(e => e.d0 + (e.t === 'stem' ? e.dur : 700)));

// ---------- drawing ----------
/** smooth path through points · @param {CanvasRenderingContext2D} c @param {Pt[]} p @param {boolean} closed */
function path(c, p, closed){
  const n = p.length; if (n < 2) return;
  /** @type {(a: Pt, b: Pt) => Pt} */ const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  c.beginPath();
  if (closed){
    const s = m(p[n - 1], p[0]); c.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++){ const q = m(p[i], p[(i + 1) % n]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
    c.closePath();
  } else {
    c.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < n - 1; i++){ const q = m(p[i], p[i + 1]); c.quadraticCurveTo(p[i][0], p[i][1], q[0], q[1]); }
    c.lineTo(p[n - 1][0], p[n - 1][1]);
  }
}
/** stroke the part of a polyline between fractions a and b · @param {CanvasRenderingContext2D} c @param {Pt[]} P @param {number} a @param {number} b */
function strokeRange(c, P, a, b){
  const n = P.length - 1, ia = a * n, ib = b * n;
  /** @type {(t: number) => Pt} */
  const lerp = t => { const i = Math.min(n - 1, Math.floor(t)), f = t - i; return [P[i][0] + (P[i + 1][0] - P[i][0]) * f, P[i][1] + (P[i + 1][1] - P[i][1]) * f]; };
  const pts = [lerp(ia)];
  for (let i = Math.floor(ia) + 1; i < ib; i++) pts.push(P[i]);
  pts.push(lerp(ib));
  path(c, pts, false); c.stroke();
}
/** @param {CanvasRenderingContext2D} c @param {number} bx @param {number} by @param {number} a @param {number} L @param {number} bend */
function leaf(c, bx, by, a, L, bend){
  if (L < 0.5) return;
  const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
  /** @type {(u: number) => Pt} */
  const ax = u => { const b = Math.sin(Math.PI * u) * bend * 0.15 * L; return [bx + ca * u * L + px * b, by + sa * u * L + py * b]; };
  /** @type {Pt[]} */ const s1 = [];
  /** @type {Pt[]} */ const s2 = [];
  for (let i = 1; i < 12; i++){ const u = i / 12, q = ax(u), w = L * 0.2 * Math.sin(Math.PI * u ** 0.8); s1.push([q[0] + px * w, q[1] + py * w]); s2.push([q[0] - px * w, q[1] - py * w]); }
  c.fillStyle = COLOR.stem; path(c, [ax(0), ...s1, ax(1), ax(1), ...s2.reverse(), ax(0)], true); c.fill();
  if (L > 8){ /** @type {Pt[]} */ const v = []; for (let i = 0; i <= 8; i++) v.push(ax(0.08 + 0.72 * i / 8)); c.strokeStyle = COLOR.vein; c.lineWidth = Math.max(0.6, L * 0.03); path(c, v, false); c.stroke(); }
}

/**
 * @typedef {{ x: number, y: number, w: number, els: El[], lean: Pt, delay: number }} Letter  x, y: centre on the baseline, canvas px
 */
/** @param {CanvasRenderingContext2D} c @param {Letter[]} L @param {number} S @param {number} age @param {number} layer */
function paintLayer(c, L, S, age, layer){
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const l of L){
    const t = age - l.delay;
    // lean: points high above the baseline bend further toward the pointer
    /** @type {(x: number, y: number) => Pt} */
    const wp = (x, y) => { const h = Math.min(2.5, Math.max(0, -y)), f = h * h * 0.5 + h * 0.5; return [l.x + x * S + l.lean[0] * S * 0.06 * f, l.y + y * S + l.lean[1] * S * 0.03 * f]; };
    for (const e of l.els){
      if (e.t === 'stem'){
        const fr = eo((t - e.d0) / e.dur); if (fr <= 0) continue;
        const P = e.pts.map(p => wp(p[0], p[1]));
        c.strokeStyle = COLOR.stem; c.lineWidth = Math.max(1, S * 0.012 * e.w);
        for (const sg of e.segs){ if (sg.layer !== layer) continue; const b = Math.min(sg.u1, fr); if (b > sg.u0) strokeRange(c, P, sg.u0, b); }
        continue;
      }
      if (e.layer !== layer) continue;
      if (e.t === 'leaf'){
        const sc = eo((t - e.d0) / 700); if (sc <= 0) continue;
        const p = wp(e.x, e.y); leaf(c, p[0], p[1], e.a, e.L * S * sc, e.bend);
      } else {
        const sc = eo((t - e.d0) / 600); if (sc <= 0) continue;
        const p = wp(e.x, e.y); c.fillStyle = COLOR.moss; c.beginPath(); c.arc(p[0], p[1], Math.max(0.5, e.r * S * sc), 0, Math.PI * 2); c.fill();
      }
    }
  }
}

// ---------- page ----------
export function initHeroGarden(){
  const h1 = document.getElementById('heroTitle'), copy = h1?.closest('.hero-copy'), hero = h1?.closest('.hero');
  const text = h1?.firstChild;
  if (!h1 || !(copy instanceof HTMLElement) || !(hero instanceof HTMLElement) || !(text instanceof Text)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const leanOn = !reduce && matchMedia('(pointer: fine)').matches;
  const mk = (/** @type {string} */ k) => { const cv = document.createElement('canvas'); cv.className = `hero-garden hero-garden--${k}`; cv.setAttribute('aria-hidden', 'true'); copy.append(cv); return cv; };
  const cvs = [mk('back'), mk('front')], ctx = cvs.map(cv => /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d')));

  // start with the copy's fade (2.6 s after the intro, .1 s on repeat visits)
  const fade = copy.getAnimations().at(0);
  const st = fade?.startTime, delay = Number(fade?.effect?.getTiming().delay) || 0;
  const start = (typeof st === 'number' ? st + delay : performance.now()) + 150;

  /** @type {Letter[]} */ let L = [];
  let S = 0, end = 0, dpr = 1, raf = 0, visible = true;
  /** @type {Pt | null} */ let ptr = null;
  const box = { left: 0, top: 0, w: 0, h: 0 };

  const layout = () => {
    const cs = getComputedStyle(h1), cr = copy.getBoundingClientRect(), hr = h1.getBoundingClientRect();
    S = parseFloat(cs.fontSize);
    const m = /** @type {CanvasRenderingContext2D} */ (ctx[0]); m.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const descent = m.measureText('EarthBox').fontBoundingBoxDescent;
    box.left = hr.left - cr.left - S * 0.9; box.top = hr.top - cr.top - S * 1.4;
    box.w = hr.width + S * 1.8; box.h = hr.height + S * 1.7;
    dpr = Math.min(2, devicePixelRatio || 1);
    for (const cv of cvs){
      Object.assign(cv.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.w}px`, height: `${box.h}px` });
      cv.width = Math.round(box.w * dpr); cv.height = Math.round(box.h * dpr);
    }
    const eb = copy.querySelector('.hero-eyebrow')?.getBoundingClientRect();
    const range = document.createRange();
    L = [...(text.textContent || '')].map((_ch, i) => {
      range.setStart(text, i); range.setEnd(text, i + 1);
      const r = range.getBoundingClientRect(), base = r.bottom - descent;
      // keep clear of the eyebrow line where it sits above this letter
      // (stems wander ~.9 S sideways; fronds' leaflets reach ~.2 S past their stem)
      const under = eb && eb.right > r.left - S * 0.9 && eb.left < r.right + S * 0.9;
      const maxUp = under ? Math.max(0.55, (base - eb.bottom) / S - 0.22) : 1.3;
      return { x: r.left + r.width / 2 - cr.left - box.left, y: base - cr.top - box.top, w: r.width / S, maxUp };
    }).map((g, i, A) => ({
      x: g.x, y: g.y, w: g.w, lean: /** @type {Pt} */ ([0, 0]), delay: i * STAGGER,
      els: genLetter({ w: g.w, prevW: i ? A[i - 1].w : null, first: i === 0, last: i === A.length - 1, maxUp: g.maxUp, seed: SEED + i * 7919 })
    }));
    end = Math.max(...L.map(l => l.delay + endOf(l.els)));
  };

  const tick = (/** @type {number} */ now) => {
    raf = 0;
    const age = reduce ? Infinity : now - start;
    let busy = age < end;
    for (const l of L){
      let tx = 0, ty = 0;
      if (ptr){
        const dx = ptr[0] - l.x, dy = ptr[1] - (l.y - S * 0.6), d = Math.hypot(dx, dy), reach = Math.max(260, S * 3.2);
        if (d < reach && d > 1){ const w = 1 - d / reach, s = w * w * (3 - 2 * w); tx = dx / d * s; ty = dy / d * s; }
      }
      l.lean[0] += (tx - l.lean[0]) * 0.04; l.lean[1] += (ty - l.lean[1]) * 0.04;   // slow: placed, not twitchy
      if (Math.abs(tx - l.lean[0]) + Math.abs(ty - l.lean[1]) > 0.003) busy = true;
    }
    ctx.forEach((c, layer) => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, box.w, box.h);
      paintLayer(c, L, S, age, layer);
    });
    if (busy && visible) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };

  if (leanOn){
    hero.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const cr = copy.getBoundingClientRect(); ptr = [e.clientX - cr.left - box.left, e.clientY - cr.top - box.top]; kick();
    });
    hero.addEventListener('pointerleave', () => { ptr = null; kick(); });
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); else { cancelAnimationFrame(raf); raf = 0; } }).observe(hero);
  let rz = 0;
  new ResizeObserver(() => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layout(); kick(); }); }).observe(h1);
  void document.fonts.ready.then(() => { layout(); kick(); });
}
