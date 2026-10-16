// ─────────────────────────────────────────────────────────────────────
// maker-3d.js · low-poly 3D view for the Maker (maker.html only)
//
// maker.js loads this with import() when #maker exists and WebGL works.
// previewSVG stays the fallback. This module never keeps its own copy of
// the design: it draws whatever sceneSpec(build) hands it on each commit.
//
// The chamber is built in code: the SVG drawing's chamfered octagon,
// extruded. Plants are low-poly models (assets/plants3d/*.glb, mapped in
// data/maker.js → models) where a good licensed one exists, else one
// procedural builder per `form`; both are varied per plant id by a seeded
// rng. Models load only when a plant using them is drawn; the procedural
// plant stands in until then, or for good if the file fails. Flat-shaded,
// matte, warm daylight from the left. Per-chamber light and glass fog come
// from the chamber's own specs (light, temp, humidity), nothing invented.
//
// One WebGLRenderer. Its canvas is the live view (hero or preview, never
// both). Plant thumbnails, recipe cards and foundation swatches are drawn
// once with the same renderer and cached as data-URL images: the CSP
// allows data: images, not blob:.
// ─────────────────────────────────────────────────────────────────────

import * as THREE from './vendor/three.module.min.js';
import { rng } from './maker.js';
import { models as MODELS } from '../data/maker.js';

/** @typedef {import('./build-codec.js').Plant} Plant */
/** @typedef {import('./build-codec.js').Chamber} Chamber */
/** @typedef {import('../data/maker.js').PlantModel} PlantModel */
/** @typedef {Pick<Plant, 'id' | 'form' | 'element' | 'name'>} PlantSpec */
/** @typedef {Pick<Chamber, 'sku' | 'name' | 'size' | 'temp' | 'humidity' | 'light'>} ChamberSpec */
/**
 * What maker.js sceneSpec(build) hands this module.
 * @typedef {{ chamber: ChamberSpec | null, soilless: boolean, substrate: string | null, plants: PlantSpec[] }} SceneSpec
 */
/** @typedef {() => number} Rand */
/** @typedef {[number, number, number]} Vec3 */

// 1 unit = 100 px of the SVG drawing, floor of the chamber at y = 0.
/** @param {number} x */
const sx = (x) => (x - 372.5) / 100;
/** @param {number} y */
const sy = (y) => (615 - y) / 100;
const OUT = [[282,131],[463,131],[493,161],[493,585],[463,615],[282,615],[252,585],[252,161]];
const IN  = [[287,144],[459,144],[480,165],[480,581],[459,602],[287,602],[265,581],[265,165]];
const TOP = [[252,161],[282,131],[463,131],[493,161],[480,165],[459,144],[287,144],[265,165]];
const BOT = [[252,585],[265,581],[287,602],[459,602],[480,581],[493,585],[463,615],[282,615]];
const FLOOR = sy(602);                       // inside floor
const HALF_W = (480 - 265) / 200 - .02;      // inside half-width, a hair off the glass

const INK = '#2C2C2B', ACCENT = '#B8A99A';
/** @param {THREE.ColorRepresentation} hex */
const col = (hex) => new THREE.Color(hex);
/** @param {number} v @param {number} a @param {number} b */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Plant colours by plant group. Inferred: the workbook has no colour data.
/** @type {Record<string, string>} */
const GROUP = {
  Earth: '#5f7d45', Fire: '#8b9a6b', Water: '#4d7b52', Air: '#5a7a3e', Aero: '#a2ad98',
  Frost: '#668a7a', Bite: '#7e8d3e', Moss: '#5c7135', Dark: '#30483a'
};
// …and the colour a plant's own name states ("Pink Princess", "Black Velvet").
/** @typedef {{ main?: string, alt?: string, share?: number }} Tint */
/** @type {[RegExp, Tint][]} */
const TINTS = [
  [/pink/i,                         { alt: '#c98d97', share: .4 }],
  [/black velvet|dark maria/i,      { main: '#26312b', alt: '#b9c4ad', share: .12 }],
  [/crystallinum/i,                 { main: '#2e4a33', alt: '#d6dfcc', share: .22 }],
  [/jewel orchid/i,                 { main: '#412c32', alt: '#c9a9a3', share: .15 }],
  [/jewel alocasia/i,               { main: '#6f6b47', alt: '#9a8f5c', share: .3 }],
  [/gold/i,                         { alt: '#c3b25a', share: .35 }],
  [/albo|marble|variegat|spider|frosty|birkin|haworthia/i, { alt: '#e3e5d6', share: .28 }],
  [/ionantha/i,                     { alt: '#c47a68', share: .18 }],
  [/micans/i,                       { main: '#3c4a2a', alt: '#6b5a3a', share: .2 }]
];


// ═══ GEOMETRY HELPERS ═════════════════════════════════════════════════
// Every part is painted one flat colour per face (with a little jitter, so
// facets read), then merged: one mesh, one draw call per plant.

const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .92, metalness: 0, side: THREE.DoubleSide });
const glassMat = new THREE.MeshStandardMaterial({ color: '#e6eeea', transparent: true, opacity: .13, roughness: .15, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
const glintMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
const UP = new THREE.Vector3(0, 1, 0);

// colour: a THREE.Color, or (r) => Color for a per-face choice.
/**
 * @param {THREE.BufferGeometry} geo
 * @param {THREE.Color | ((r: Rand) => THREE.Color)} colour
 * @param {Rand} r
 */
function paint(geo, colour, r, jit = .07){
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (g !== geo) geo.dispose();
  for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
  const n = g.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 3){
    const base = typeof colour === 'function' ? colour(r) : colour;
    const k = 1 + (r() - .5) * 2 * jit;
    for (let j = 0; j < 3; j++) c.set([base.r * k, base.g * k, base.b * k], (i + j) * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}

/** @param {THREE.BufferGeometry[]} geos */
function merge(geos){
  let n = 0;
  for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n * 3), c = new Float32Array(n * 3);
  let o = 0;
  for (const g of geos){
    pos.set(g.attributes.position.array, o);
    c.set(g.attributes.color.array, o);
    o += g.attributes.position.count * 3;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('color', new THREE.BufferAttribute(c, 3));
  out.computeVertexNormals();
  return out;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
// Tilt (x) first, then turn (y): "lean outwards, facing angle a".
/**
 * @param {THREE.BufferGeometry} geo
 * @param {{ p?: number[], r?: number[], s?: number[] }} [at]  p and s have three numbers
 */
function place(geo, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}){
  _e.set(r[0], r[1], r[2], 'YXZ');
  _m.compose(_v.set(.../** @type {Vec3} */ (p)), _q.setFromEuler(_e), _s.set(.../** @type {Vec3} */ (s)));
  return geo.applyMatrix4(_m);
}

/** @param {number[][]} P points @param {number[]} T indices into P */
function tris(P, T){
  const a = new Float32Array(T.length * 3);
  T.forEach((v, i) => a.set(P[v], i * 3));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return g;
}

// A folded leaf blade along +y, eight facets; `lobes` adds the two
// heart-shaped lobes behind the stalk (aroids).
/** @param {number} L @param {number} W */
function blade(L, W, f = .05, lobes = false){
  const P = [[0,0,0],[0,.38*L,f],[0,.72*L,f*.6],[0,L,0],[-W,.32*L,-f*.5],[-.7*W,.7*L,-f*.3],[W,.32*L,-f*.5],[.7*W,.7*L,-f*.3],
    [-.55*W,-.2*L,-f*.4],[.55*W,-.2*L,-f*.4]];
  const T = [0,4,1, 1,4,5, 1,5,2, 2,5,3, 0,1,6, 1,7,6, 1,2,7, 2,3,7];
  return tris(P, lobes ? T.concat([0,8,4, 0,6,9]) : T);
}

// A stem from a to b (Vector3s).
/** @param {THREE.Vector3} a @param {THREE.Vector3} b @param {number} r0 */
function segment(a, b, r0, r1 = r0, sides = 4){
  const d = new THREE.Vector3().subVectors(b, a), len = d.length() || 1e-3;
  const g = new THREE.CylinderGeometry(r1, r0, len, sides, 1, true).translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  return g.translate(a.x, a.y, a.z);
}

// Push each shared vertex in or out a little: a rock, a moss cushion.
/** @param {THREE.BufferGeometry} g @param {Rand} r @param {number} amt */
function lumpy(g, r, amt){
  /** @type {Map<string, number>} */
  const seen = new Map();
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++){
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!seen.has(key)) seen.set(key, 1 + (r() - .5) * amt);
    const k = /** @type {number} */ (seen.get(key));
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  return g;
}

/** @param {number} a @param {number} d @param {number} y */
const around = (a, d, y) => new THREE.Vector3(Math.sin(a) * d, y, Math.cos(a) * d);


// ═══ PLANTS · one builder per `form` ══════════════════════════════════
// Base at the origin, roughly 1 unit tall at most. `pal` comes from the
// plant group plus any colour its name states.

/** @param {PlantSpec} p */
function paletteOf(p){
  /** @type {Tint} */
  const t = TINTS.find(([re]) => re.test(p.name))?.[1] || {};
  const main = col(t.main || GROUP[p.element] || GROUP.Earth);
  const alt = t.alt ? col(t.alt) : main.clone().offsetHSL(0, -.05, .07);
  const share = t.share ?? .25;
  return {
    main, alt,
    leaf: (/** @type {Rand} */ r) => (r() < share ? alt : main),
    stem: main.clone().offsetHSL(.02, -.12, -.06),
    red: col('#8e3a2c')
  };
}

/** @typedef {ReturnType<typeof paletteOf>} Palette */
/** @typedef {(r: Rand, pal: Palette, name: string) => THREE.BufferGeometry[]} Builder */

/** @type {Builder} */
function leafPlant(r, pal){
  const parts = [], k = 3 + Math.floor(r() * 3);
  for (let i = 0; i < k; i++){
    const a = (i / k) * Math.PI * 2 + r() * .7, tilt = .08 + r() * .32, h = .35 + r() * .65;
    parts.push(paint(place(new THREE.CylinderGeometry(.016, .024, h, 4).translate(0, h / 2, 0), { r: [tilt, a, 0] }), pal.stem, r));
    const tip = around(a, h * Math.sin(tilt), h * Math.cos(tilt));
    const L = .5 + r() * .25;
    // Blades held out and up from upright stalks: the aroid habit.
    parts.push(paint(place(blade(L, L * (.42 + r() * .16), .035, true), { p: tip.toArray(), r: [1.0 + r() * .45, a + (r() - .5) * .5, 0] }), pal.leaf, r));
  }
  return parts;
}

/** @type {Builder} */
function trailPlant(r, pal){
  const parts = [], vines = 3 + Math.floor(r() * 3);
  for (let v = 0; v < vines; v++){
    const a = (v / vines) * Math.PI * 2 + r() * .8, R = .45 + r() * .3, up = .2 + r() * .14, drop = .3 + r() * .25;
    let prev = new THREE.Vector3(0, .02, 0);
    for (let s = 1; s <= 7; s++){
      const t = s / 7, pt = around(a + t * .5, R * t, .02 + up * Math.sin(Math.PI * t * 1.1) - drop * t * t + .18 * t);
      parts.push(paint(segment(prev, pt, .012, .01, 3), pal.stem, r));
      const side = s % 2 ? 1 : -1;
      parts.push(paint(place(blade(.12, .075, .02), { p: pt.toArray(), r: [.9 + r() * .7, a + side * (.9 + r() * .5), 0] }), pal.leaf, r));
      prev = pt;
    }
  }
  return parts;
}

/** @type {Builder} */
function rosettePlant(r, pal, name){
  const upright = /haworthia/i.test(name), flat = /butterwort|begonia/i.test(name);
  const parts = [];
  for (let j = 0; j < 3; j++){
    const n = 9 - j * 2;
    for (let i = 0; i < n; i++){
      const a = ((i + j * .5) / n) * Math.PI * 2 + r() * .2;
      const len = (.36 - j * .08) * (.9 + r() * .2) * (upright ? 1.25 : 1);
      const w = len * (upright ? .2 : flat ? .5 : .36);
      const tilt = upright ? .5 - j * .14 : flat ? 1.38 - j * .2 : 1.1 - j * .3;
      const g = new THREE.ConeGeometry(w, len, 4).scale(1, 1, .45).translate(0, len / 2, 0);
      const c = j === 2 ? pal.alt : pal.main;
      parts.push(paint(place(g, { p: [0, .015 * j, 0], r: [tilt, a, 0] }), upright ? pal.leaf : c, r));
    }
  }
  return parts;
}

/** @type {Builder} */
function airPlant(r, pal){
  const parts = [paint(lumpy(new THREE.IcosahedronGeometry(.07, 0), r, .3), pal.stem, r)], n = 16 + Math.floor(r() * 8);
  for (let i = 0; i < n; i++){
    const len = .28 + r() * .32;
    const g = new THREE.ConeGeometry(.026, len, 3).translate(0, len / 2, 0);
    parts.push(paint(place(g, { p: [0, .03, 0], r: [.2 + r() * 1.1, r() * Math.PI * 2, 0] }), pal.leaf, r));
  }
  return parts;
}

/** @type {Builder} */
function fernPlant(r, pal, name){
  const parts = [];
  if (/nest|java fern/i.test(name)){                  // strap-leaved ferns
    const n = 6 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++){
      const a = (i / n) * Math.PI * 2 + r() * .5, L = .55 + r() * .3;
      parts.push(paint(place(blade(L, .1 + r() * .04, .04), { r: [.25 + r() * .5, a, 0] }), pal.leaf, r));
    }
    return parts;
  }
  const fronds = 6 + Math.floor(r() * 3);
  for (let f = 0; f < fronds; f++){
    const a = (f / fronds) * Math.PI * 2 + r() * .6, steps = 9, step = (.65 + r() * .3) / steps;
    let th = .2 + r() * .35, p = new THREE.Vector3(0, 0, 0);
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), side = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    const P = [], T = [];
    for (let s = 0; s < steps; s++){
      const q = p.clone().addScaledVector(dir, Math.sin(th) * step).add(new THREE.Vector3(0, Math.cos(th) * step, 0));
      parts.push(paint(segment(p, q, .01, .008, 3), pal.stem, r));
      const l = .15 * (1 - s / steps) + .03;
      for (const sgn of [1, -1]){                      // one pair of pinnae
        const tip = p.clone().addScaledVector(side, sgn * l).addScaledVector(dir, .02).add(new THREE.Vector3(0, -.015, 0));
        const b = P.length;
        P.push(p.toArray(), tip.toArray(), q.toArray());
        T.push(b, b + 1, b + 2);
      }
      p = q; th += .14;
    }
    parts.push(paint(tris(P, T), pal.leaf, r));
  }
  return parts;
}

/** @type {Builder} */
function mossPlant(r, pal, name){
  const tall = /mood/i.test(name), parts = [], n = 6 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++){
    const rad = .1 + r() * .1, a = r() * Math.PI * 2, d = r() * .32;
    const g = lumpy(new THREE.IcosahedronGeometry(rad, 1), r, .35);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) if (p.getY(k) < 0) p.setY(k, 0);   // sits on the ground
    parts.push(paint(place(g, { p: [Math.sin(a) * d, 0, Math.cos(a) * d], s: [1, tall ? 1.1 : .55, 1] }), pal.leaf, r, .1));
  }
  return parts;
}

/** @type {Builder} */
function trapPlant(r, pal, name){
  const parts = [];
  if (/flytrap/i.test(name)){
    const n = 5 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++){
      const a = (i / n) * Math.PI * 2 + r() * .4, tilt = .9 + r() * .3, h = .22 + r() * .1;
      parts.push(paint(place(blade(h, .04, .01), { r: [tilt, a, 0] }), pal.main, r));
      const tip = around(a, h * Math.sin(tilt), h * Math.cos(tilt));
      for (const sgn of [1, -1]){                      // two jaws, red inside
        const jaw = new THREE.CircleGeometry(.08, 5, 0, Math.PI).rotateZ(-Math.PI / 2);
        parts.push(paint(place(jaw, { p: tip.toArray(), r: [tilt - .3, a + sgn * .5, 0] }), (rr) => (rr() < .5 ? pal.red : pal.main), r));
      }
    }
    return parts;
  }
  if (/sundew/i.test(name)){
    const n = 7 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++){
      const a = (i / n) * Math.PI * 2 + r() * .4, tilt = .2 + r() * .5, L = .38 + r() * .18;
      parts.push(paint(place(new THREE.ConeGeometry(.022, L, 3).translate(0, L / 2, 0), { r: [tilt, a, 0] }), pal.main, r));
      for (let k = 4; k <= 9; k++){
        const t = (k / 10) * L, dot = new THREE.IcosahedronGeometry(.018, 0);
        parts.push(paint(place(dot, { p: around(a, t * Math.sin(tilt) + .02, t * Math.cos(tilt)).toArray() }), pal.red, r));
      }
    }
    return parts;
  }
  // Pitchers: tall trumpets (Sarracenia) or squat cups (Nepenthes).
  const tallCups = !/nepenthes/i.test(name), n = tallCups ? 5 : 3;
  for (let i = 0; i < n; i++){
    const a = (i / n) * Math.PI * 2 + r() * .6, h = tallCups ? .6 + r() * .35 : .28 + r() * .08;
    const g = new THREE.CylinderGeometry(tallCups ? .065 : .06, tallCups ? .016 : .08, h, 6).translate(0, h / 2, 0);
    const lean = tallCups ? .08 + r() * .2 : .5 + r() * .3, off = tallCups ? .06 : .22;
    const base = around(a, off, tallCups ? 0 : .08);
    parts.push(paint(place(g, { p: base.toArray(), r: [lean, a, 0] }), (rr) => (rr() < (tallCups ? .45 : .35) ? pal.red : pal.main), r));
    const top = base.clone().add(around(a, h * Math.sin(lean), h * Math.cos(lean)));
    parts.push(paint(place(blade(.12, .07, .02), { p: top.toArray(), r: [-.4, a, 0] }), pal.red, r));
    if (!tallCups) parts.push(paint(place(blade(.38, .09, .04), { r: [1.2, a + 1.2, 0] }), pal.main, r));
  }
  return parts;
}

/** @type {Record<string, Builder | undefined>} looked up by plant form */
const BUILD = { leaf: leafPlant, trail: trailPlant, rosette: rosettePlant, air: airPlant, fern: fernPlant, moss: mossPlant, trap: trapPlant };

/** @param {PlantSpec} p */
const seeded = (p, salt = 0) => {
  const r = rng(+p.id.replace(/\D/g, '') * 7919 + 17 + salt);
  r(); r(); r();                                       // let the seed settle
  return r;
};


// ═══ PLANT MODELS · data/maker.js → models ════════════════════════════
// One fetch + parse per file, cached. Each file becomes one non-indexed,
// position + colour geometry, base on y = 0, centred. Plants share its
// positions and normals; each gets its own colours (group tint).

/** @param {PlantSpec} p @returns {PlantModel | null} */
const modelOf = (p) => (Object.hasOwn(MODELS.plants, p.id) ? MODELS.plants[p.id] : MODELS.forms[p.form]) || null;
/**
 * @typedef {{ state: 'loading' | 'ready' | 'failed', geo: THREE.BufferGeometry | null,
 *   material?: THREE.MeshStandardMaterial, promise: Promise<void> }} ModelFile
 */
/** @type {Map<string, ModelFile>} */
const files = new Map();                               // file → { state: loading|ready|failed, geo, promise }
/** @type {Promise<import('./vendor/GLTFLoader.js').GLTFLoader> | null} */
let loader = null;

/** @param {THREE.Object3D} o @returns {o is THREE.Mesh} */
const isMesh = (o) => !!(/** @type {Partial<THREE.Mesh>} */ (o).isMesh);
/** @param {THREE.Object3D} o @returns {o is THREE.Light} */
const isLight = (o) => !!(/** @type {Partial<THREE.Light>} */ (o).isLight);
/** Our meshes and the model files' all have one material each. @param {THREE.Mesh} o */
const matOf = (o) => /** @type {THREE.Material} */ (o.material);

/** @param {THREE.Object3D} scene */
function toGeo(scene){
  scene.updateMatrixWorld(true);
  /** @type {THREE.BufferGeometry[]} */
  const parts = [];
  scene.traverse(o => {
    if (!isMesh(o)) return;
    const src = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
    // A model may have no vertex colours; three's types list every attribute as present.
    const P = src.attributes.position, C = /** @type {Attr | undefined} */ (src.attributes.color), n = P.count;
    const pos = new Float32Array(n * 3), c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++){                         // getX/Y/Z undo the file's quantization
      pos.set([P.getX(i), P.getY(i), P.getZ(i)], i * 3);
      c.set(C ? [C.getX(i), C.getY(i), C.getZ(i)] : [1, 1, 1], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    parts.push(g.applyMatrix4(o.matrixWorld));
    if (src !== o.geometry) src.dispose();
  });
  // A loaded mesh's material may be an array, which has no dispose().
  scene.traverse(o => { if (isMesh(o)){ o.geometry.dispose(); /** @type {{ dispose?: () => void }} */ (o.material).dispose?.(); } });
  if (!parts.length) throw new Error('empty model');
  const geo = merge(parts);
  geo.computeBoundingBox();
  const b = /** @type {THREE.Box3} */ (geo.boundingBox);
  return geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
}

// A realistic scan (`textured: true`): one mesh whose texture is the point,
// so keep its uv, normals and material; same base-on-y=0, centred contract.
/** @param {THREE.Object3D} scene */
function toTexturedGeo(scene){
  scene.updateMatrixWorld(true);
  // Asserted, not annotated: the callback's assignment is invisible to
  // control flow, so a plain `null` would stay narrowed to null.
  let mesh = /** @type {THREE.Mesh | null} */ (null);
  scene.traverse(o => { if (isMesh(o) && !mesh) mesh = o; });
  if (!mesh) throw new Error('empty model');
  const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  const g = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv']){   // getX/Y undo quantization into plain floats
    // Assumes plain (non-interleaved) attributes: only BufferAttribute has getComponent.
    const a = /** @type {THREE.BufferAttribute | undefined} */ (src.attributes[name]); if (!a) continue;
    const out = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) out[i * a.itemSize + k] = a.getComponent(i, k);
    g.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
  g.applyMatrix4(mesh.matrixWorld);
  const normal = /** @type {Attr | undefined} */ (g.attributes.normal);   // the scan may carry none
  if (!normal) g.computeVertexNormals();
  g.computeBoundingBox();
  const b = /** @type {THREE.Box3} */ (g.boundingBox);
  g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
  const material = /** @type {THREE.MeshStandardMaterial} */ (mesh.material);   // GLTF scans: standard PBR
  material.side = THREE.DoubleSide;
  material.userData.keep = true;                       // cached: never disposed with a scene
  return { geo: g, material };
}

// Resolves once the file is ready or has failed (never rejects).
/** @param {string} file */
function loadModel(file){
  if (!files.has(file)){
    const rec = /** @type {ModelFile} */ ({ state: 'loading', geo: null });
    loader ||= import('./vendor/GLTFLoader.js').then(m => new m.GLTFLoader());
    rec.promise = Promise.all([loader, fetch(MODELS.base + file).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.arrayBuffer(); })])
      .then(([l, buf]) => l.parseAsync(buf, ''))
      .then(gltf => {
        const textured = Object.values(MODELS.forms).concat(Object.values(MODELS.plants)).some(m => m?.file === file && m.textured);
        if (textured) Object.assign(rec, toTexturedGeo(gltf.scene)); else rec.geo = toGeo(gltf.scene);
        rec.state = 'ready';
      })
      .catch(() => { rec.state = 'failed'; });
    files.set(file, rec);
  }
  return /** @type {ModelFile} */ (files.get(file)).promise;
}
/** @param {PlantSpec} p */
const modelReady = (p) => { const m = modelOf(p); return m && files.get(m.file)?.state === 'ready' ? m : null; };
// Files a set of plants still waits for (starts loading them).
/** @param {PlantSpec[]} list */
const pendingFor = (list) => [...new Set(list.map(modelOf).filter(Boolean).map(m => /** @type {PlantModel} */ (m).file))]
  .filter(f => (files.get(f)?.state ?? 'loading') === 'loading').map(loadModel);

// Foliage (the model's greens) takes the plant's palette, one colour per
// face like the procedural plants, keeping the model's own light and dark;
// anything else (red traps, a bloom) keeps its colour.
const _c = new THREE.Color(), _hsl = /** @type {THREE.HSL} */ ({});
/** @param {THREE.BufferGeometry} base @param {PlantSpec} p @param {PlantModel} m */
function tinted(base, p, m){
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', base.attributes.position);
  g.setAttribute('normal', base.attributes.normal);
  const src = base.attributes.color.array;
  if (m.tint === false){ g.setAttribute('color', base.attributes.color); return g; }
  /** @param {number} i */
  const lum = (i) => .2126 * src[i] + .7152 * src[i + 1] + .0722 * src[i + 2];
  const leafy = [];
  let sum = 0, n = 0;
  for (let i = 0; i < src.length; i += 9){
    _c.setRGB((src[i] + src[i + 3] + src[i + 6]) / 3, (src[i + 1] + src[i + 4] + src[i + 7]) / 3, (src[i + 2] + src[i + 5] + src[i + 8]) / 3).getHSL(_hsl);
    const leaf = _hsl.h > .12 && _hsl.h < .55 && _hsl.s > .1;
    leafy.push(leaf);
    if (leaf){ sum += lum(i); n++; }
  }
  const mean = n ? sum / n : 1, pal = paletteOf(p), r = seeded(p, 1), out = new Float32Array(src.length);
  for (let f = 0, i = 0; i < src.length; f++, i += 9){
    if (!leafy[f]){ out.set(src.subarray(i, i + 9), i); continue; }
    const base = pal.leaf(r), k = clamp(lum(i) / mean, .55, 1.45) * (1 + (r() - .5) * .1);
    for (let j = 0; j < 9; j += 3) out.set([base.r * k, base.g * k, base.b * k], i + j);
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3));
  return g;
}

// Per-plant variety for shared models: a turn and a slight size change.
/** @param {PlantSpec} p */
function turnOf(p){
  const m = modelReady(p);
  if (!m) return { yaw: 0, k: 1 };
  const r = seeded(p, 2);
  return { yaw: r() * Math.PI * 2 + (m.yaw || 0), k: (m.scale || 1) * (.92 + r() * .14) };
}

/** @type {Map<string, THREE.BufferGeometry>} */
const plantGeos = new Map();                           // 'm:id' (model) or 'p:id' (procedural)
/** A ready model's file (modelReady() checked it). @param {PlantModel} m */
const readyFile = (m) => /** @type {ModelFile & { geo: THREE.BufferGeometry }} */ (files.get(m.file));
/** @param {PlantSpec} p */
function plantGeo(p){
  const m = modelReady(p), key = `${m ? 'm' : 'p'}:${p.id}`;
  if (!plantGeos.has(key))
    plantGeos.set(key, m ? (m.textured ? readyFile(m).geo : tinted(readyFile(m).geo, p, m))
      : merge((BUILD[p.form] || leafPlant)(seeded(p), paletteOf(p), p.name)));
  return /** @type {THREE.BufferGeometry} */ (plantGeos.get(key));
}
// A scan's own texture, gently pulled toward the plant's colour (Neon Pink
// shouldn't read plain green), one material per plant, cached.
/** @type {Map<string, THREE.MeshStandardMaterial>} */
const plantMats = new Map();
/** @param {PlantSpec} p */
function plantMat(p){
  const m = modelReady(p);
  if (!m?.textured) return mat;
  if (!plantMats.has(p.id)){
    const own = /** @type {THREE.MeshStandardMaterial} */ (readyFile(m).material).clone();   // textured files keep theirs
    own.userData.keep = true;
    // A tint can only shade a green texture, never make it pink: colour
    // cultivars keep the stylised model (data/maker.js); scans shade gently.
    if (m.tint !== false) own.color.set('#ffffff').lerp(paletteOf(p).main.clone().offsetHSL(0, 0, .25), .3);
    plantMats.set(p.id, own);
  }
  return /** @type {THREE.MeshStandardMaterial} */ (plantMats.get(p.id));
}
/** @param {PlantSpec} p */
function plantMesh(p){
  const m = new THREE.Mesh(plantGeo(p), plantMat(p));
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}


// ═══ CHAMBER + FOUNDATION ═════════════════════════════════════════════

/** @param {number[][]} pts */
const shapeOf = (pts) => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(sx(x), sy(y))));
/** @param {THREE.Shape} shape @param {number} depth */
const extrude = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });

// Depth from the chamber's own size ("H × W × D mm"), else square.
/** @param {ChamberSpec | null} ch */
function depthOf(ch){
  const n = String(ch?.size || '').match(/\d+/g)?.map(Number);
  return 2.41 * (n && n.length >= 3 ? n[2] / n[1] : 1);
}

// The chamber's light + climate, read from its specs.
/** @param {ChamberSpec | null} ch */
export function atmosOf(ch){
  if (!ch) return { power: 0, tint: '#fff1dc', mist: 0 };
  /** @param {unknown} s */
  const num = (s) => (String(s).match(/\d+/g) || []).map(Number);
  const t = num(ch.temp), h = num(ch.humidity), L = String(ch.light).toLowerCase();
  const temp = t.length ? (t[0] + t[t.length - 1]) / 2 : 24;
  let tint = temp >= 28 ? '#ffd9ae' : temp <= 18 ? '#dce8ff' : '#fff1dc';
  if (/warm/.test(L)) tint = '#ffcf98';
  if (/white/.test(L)) tint = '#f3f6ff';
  if (/uv/.test(L)) tint = '#b9a8ff';
  const power = /high-intensity|strong|bright/.test(L) ? 1.5 : /low|minimal|soft/.test(L) ? .6 : 1;
  return { power, tint, mist: h.length ? clamp((h[h.length - 1] - 60) / 40, 0, 1) : 0 };
}

/** @param {ChamberSpec | null} ch @param {number} D depth */
function chamberGroup(ch, D){
  const g = new THREE.Group(), r = rng(11);
  const frameCol = col(ch ? INK : '#c4bfb6');
  const ring = shapeOf(OUT);
  ring.holes.push(new THREE.Path(IN.map(([x, y]) => new THREE.Vector2(sx(x), sy(y)))));
  const frame = new THREE.Mesh(merge([
    paint(extrude(ring, .09).translate(0, 0, D / 2 - .09), frameCol, r, .03),
    paint(extrude(ring, .09).translate(0, 0, -D / 2), frameCol, r, .03),
    paint(extrude(shapeOf(TOP), D).translate(0, 0, -D / 2), frameCol, r, .03),
    paint(extrude(shapeOf(BOT), D).translate(0, 0, -D / 2), frameCol, r, .03)
  ]), mat);
  frame.castShadow = frame.receiveShadow = true;

  const inset = IN.map(([x, y]) => [x + Math.sign(372.5 - x) * 1.5, y + Math.sign(373 - y) * 1.5]);   // off the frame faces
  const glass = new THREE.Mesh(extrude(shapeOf(inset), D - .18).translate(0, 0, -D / 2 + .09), glassMat);
  glass.renderOrder = 2;
  // Two faceted glints on the front pane: reads as glass from any angle.
  const glint = new THREE.Mesh(tris(
    [[-.9, 1.2, 0], [-.55, 1.2, 0], [.45, 4.2, 0], [.1, 4.2, 0], [.62, 1.0, 0], [.74, 1.0, 0], [1.0, 1.9, 0], [.88, 1.9, 0]],
    [0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]).translate(0, 0, D / 2 - .085), glintMat);
  glint.renderOrder = 3;

  // Base plinth: a chamfered stone slab in the site accent.
  const pw = 1.55, pd = D / 2 + .32, c = .16;
  const slab = new THREE.Shape([[-pw + c, -pd], [pw - c, -pd], [pw, -pd + c], [pw, pd - c], [pw - c, pd], [-pw + c, pd], [-pw, pd - c], [-pw, -pd + c]]
    .map(([x, z]) => new THREE.Vector2(x, z)));
  const plinth = new THREE.Mesh(paint(extrude(slab, .16).rotateX(Math.PI / 2), col(ACCENT), r, .05), mat);
  plinth.receiveShadow = plinth.castShadow = true;
  g.add(frame, glass, glint, plinth);

  if (ch){
    const a = atmosOf(ch);
    // LED strip along the top front edge, and the light it throws.
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.7, .035, .03), new THREE.MeshBasicMaterial({ color: col(a.tint).lerp(col('#ffffff'), .35) }));
    led.position.set(0, sy(144) - .05, D / 2 - .14);
    const lamp = new THREE.PointLight(a.tint, 5 * a.power, 7, 1.2);
    lamp.position.set(0, sy(160), .3);
    g.add(led, lamp);
    // Humid chambers fog their glass a little (humidity spec).
    glass.material = Object.assign(glassMat.clone(), { opacity: .1 + a.mist * .12 });
  }
  return g;
}

// Foundation layers, as in the SVG bands: drainage, charcoal, the mix.
/** @param {string} look @param {number} w @param {number} d @param {Rand} r */
function floorGeo(look, w, d, r){
  /** @type {THREE.BufferGeometry[]} */
  const parts = [], aroid = look === 'aroid';
  const top = aroid ? sy(540) : sy(548);
  /** @param {number} y0 @param {number} y1 @param {THREE.ColorRepresentation} c */
  const slab = (y0, y1, c, j = .05) => paint(new THREE.BoxGeometry(w * 2, y1 - y0, d * 2).translate(0, (y0 + y1) / 2, 0), col(c), r, j);
  parts.push(slab(FLOOR, sy(582), '#a7a297'), slab(sy(582), sy(574), '#2b2a26'), slab(sy(574), top - .04, aroid ? '#6b4b30' : '#5a4532'));
  // A faceted soil surface.
  const surf = new THREE.PlaneGeometry(w * 2, d * 2, 7, 5).rotateX(-Math.PI / 2);
  const sp = surf.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setY(i, (r() - .5) * .06);
  parts.push(paint(surf.translate(0, top - .02, 0), col(aroid ? '#6b4b30' : '#5a4532'), r, .12));
  // Pebbles, bark and perlite pressed against the glass, where they show.
  /** @param {number} n @param {number} y0 @param {number} y1 @param {number} rad @param {THREE.Color[]} colours */
  const bits = (n, y0, y1, rad, colours, flat = .7) => {
    for (let i = 0; i < n; i++){
      const onSide = i % 3 === 2, s = r() < .5 ? -1 : 1;
      const x = onSide ? s * (w - .02) : (r() - .5) * 2 * w, z = onSide ? (r() - .5) * 2 * d : s * (d - .02);
      const g = new THREE.IcosahedronGeometry(rad * (.7 + r() * .6), 0);
      parts.push(paint(place(g, { p: [x, y0 + r() * (y1 - y0), z], r: [r() * 3, r() * 3, 0], s: [1, flat, 1] }), colours[Math.floor(r() * colours.length)], r));
    }
  };
  bits(70, FLOOR + .03, sy(582) - .02, .06, [col('#8d887c'), col('#b3ada2'), col('#9b958a')]);
  if (aroid){
    bits(46, sy(574) + .02, top - .04, .045, [col('#94683f'), col('#7d5534')], .45);
    bits(40, sy(574) + .02, top - .04, .02, [col('#f3f0e8')], 1);
  } else bits(36, sy(574) + .02, top - .04, .018, [col('#6e5640'), col('#7b6249')], 1);
  return { geo: merge(parts), top };
}

/** @param {SceneSpec} spec @param {number} D */
function floorGroup(spec, D){
  const g = new THREE.Group();
  if (spec.soilless){
    // Soil-free: a mist rail across the chamber, hung from the lid.
    const r = rng(9), y = sy(430), z = 0;
    const rail = new THREE.Mesh(merge([
      paint(new THREE.BoxGeometry(HALF_W * 2, .05, .07).translate(0, y - .025, z), col(INK), r, .03),
      paint(new THREE.CylinderGeometry(.012, .012, sy(144) - y, 4).translate(-HALF_W + .25, (sy(144) + y) / 2, z), col(INK), r, .03),
      paint(new THREE.CylinderGeometry(.012, .012, sy(144) - y, 4).translate(HALF_W - .25, (sy(144) + y) / 2, z), col(INK), r, .03)
    ]), mat);
    rail.castShadow = true;
    // No soil: a pale stone floor plate, so the chamber floor isn't a black well.
    const plate = new THREE.Mesh(paint(new THREE.BoxGeometry(HALF_W * 2, .04, D - .24).translate(0, FLOOR + .02, 0), col('#d6cfc4'), r, .05), mat);
    plate.receiveShadow = true;
    g.add(rail, plate);
    g.userData.base = y;
    return g;
  }
  if (!spec.substrate){ g.userData.base = FLOOR; return g; }
  const { geo, top } = floorGeo(spec.substrate, HALF_W, D / 2 - .1, rng(spec.substrate === 'aroid' ? 7 : 3));
  const m = new THREE.Mesh(geo, mat);
  m.receiveShadow = true;
  g.add(m);
  g.userData.base = top - .02;
  return g;
}

// How big each form grows in a chamber: height h, spread r (units; the
// chamber is 4.8 tall, 2.1 wide inside). A plant is scaled evenly until
// it meets one of the two; moss is the exception, a low, wide carpet.
// Sized so a planted chamber reads full (owner's call, 10 Oct): the tallest
// forms reach ~3/4 of the glass; layout() still narrows them to the walls.
/** @type {Record<string, { h: number, r: number } | undefined> & { leaf: { h: number, r: number } }} looked up by plant form */
const SIZE = {
  leaf: { h: 3.5, r: 1.7 }, trail: { h: 1.9, r: 1.35 }, rosette: { h: 2.1, r: 1.35 }, air: { h: 2.0, r: 1.3 },
  fern: { h: 3.1, r: 1.6 }, moss: { h: .65, r: 1.05 }, trap: { h: 2.7, r: 1.15 }
};
/** @typedef {THREE.BufferAttribute | THREE.InterleavedBufferAttribute} Attr */
/** @type {WeakMap<Attr, { h: number, r: number }>} */
const sizes = new WeakMap();                          // by position data: models share theirs
/** @param {PlantSpec} p */
function sizeOf(p){
  const a = plantGeo(p).attributes.position;
  if (!sizes.has(a)){
    let h = 0, r = 0;
    for (let i = 0; i < a.count; i++){ h = Math.max(h, a.getY(i)); r = Math.max(r, Math.hypot(a.getX(i), a.getZ(i))); }
    sizes.set(a, { h: h || 1, r: r || 1 });
  }
  return /** @type {{ h: number, r: number }} */ (sizes.get(a));
}

// How far a model reaches along x and z once turned by `yaw` (models only:
// their footprints are uneven, so the wall check uses the real one).
/** @type {WeakMap<Attr, Map<number, { rx: number, rz: number }>>} */
const reach = new WeakMap();
/** @param {Attr} a @param {number} yaw */
function extentOf(a, yaw){
  const key = Math.round(yaw * 100);
  if (!reach.has(a)) reach.set(a, new Map());
  const memo = /** @type {Map<number, { rx: number, rz: number }>} */ (reach.get(a));
  if (!memo.has(key)){
    const c = Math.cos(yaw), s = Math.sin(yaw);
    let rx = 0, rz = 0;
    for (let i = 0; i < a.count; i++){
      const x = a.getX(i), z = a.getZ(i);
      rx = Math.max(rx, Math.abs(x * c + z * s)); rz = Math.max(rz, Math.abs(-x * s + z * c));
    }
    memo.set(key, { rx: rx || 1, rz: rz || 1 });
  }
  return /** @type {{ rx: number, rz: number }} */ (memo.get(key));
}

// Plants spaced evenly like the SVG, alternating front and back rows,
// narrowed a little (never below 60 %) where the glass is close.
/**
 * @param {SceneSpec} spec @param {number} base floor height @param {number} D
 * @returns {{ p: PlantSpec, pos: Vec3, s: Vec3, yaw: number }[]}
 */
function layout(spec, base, D){
  const n = spec.plants.length, span = HALF_W * 2 - .5;
  const crowd = n <= 3 ? 1 : n <= 5 ? .88 : .74;
  return spec.plants.map((p, i) => {
    const back = i % 2 === 1, rail = spec.soilless;
    const x = -span / 2 + (i + .5) * (span / n), z = rail ? (back ? -.08 : .08) : (back ? -D * .16 : D * .12);
    const { h, r } = sizeOf(p), turn = turnOf(p);
    const t0 = SIZE[p.form] || SIZE.leaf, t = { h: t0.h * turn.k, r: t0.r * turn.k }, k = crowd * (back ? .92 : 1);
    const roomX = HALF_W - Math.abs(x) + .05, roomZ = D / 2 - Math.abs(z) + .05;
    const room = Math.max(.5, Math.min(roomX, roomZ));
    const moss = p.form === 'moss';
    let yaw = i * 1.7 + turn.yaw;
    // Scans spread wider than the stylised models, so they're sized mostly by
    // height, with a looser width limit so flat ones (rosettes) don't fill the
    // floor (the wall check below still keeps them inside the glass).
    let sy = moss ? t.h * k / h : Math.min(t.h / h, (modelReady(p)?.textured ? 2.6 : 1.6) * t.r / r) * k;
    if (moss) return { p, pos: [x, base, z], s: [Math.min(room, t.r * k) / r, sy, Math.min(room, t.r * k) / r], yaw };
    if (modelReady(p)){
      // A model keeps its proportions (squeezed to 60 % at most) and turns
      // its narrow side to the near wall; where the wall is still close it
      // is drawn smaller, so nothing pokes through the glass.
      const pos = plantGeo(p).attributes.position;
      /** @param {number} y */
      const fit = (y) => { const e = extentOf(pos, y); return Math.min(roomX / e.rx, roomZ / e.rz); };
      if (fit(yaw + Math.PI / 2) > fit(yaw)) yaw += Math.PI / 2;
      const wide = fit(yaw);
      const slim = modelReady(p)?.textured ? .5 : .6;    // scans spread wide: allow a little more slimming
      sy = Math.min(sy, wide / slim);
      const sxz = Math.max(Math.min(sy, wide), sy * slim);
      return { p, pos: [x, base, z], s: [sxz, sy, sxz], yaw };
    }
    // Height leads, so plants climb the glass; width follows, slimmed (to
    // 45 % at most) where a wall is close, so nothing pokes through.
    const sxz = Math.max(Math.min(sy, room / r), sy * .45);
    return { p, pos: [x, base, z], s: [sxz, sy, sxz], yaw };
  });
}


// ═══ LIGHT RIG + CAMERA ═══════════════════════════════════════════════

function makeStage(){
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fbf6ee', '#8a7b69', 1.7));
  const key = new THREE.DirectionalLight('#fff0dc', 2.3);            // warm daylight from the left
  key.position.set(-5, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 5.5, bottom: -1.5, near: 1, far: 25 });
  key.shadow.bias = -.0005;
  key.shadow.normalBias = .02;
  const fill = new THREE.DirectionalLight('#eef1f4', .45);
  fill.position.set(5, 3, 2);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 16).rotateX(-Math.PI / 2), new THREE.ShadowMaterial({ color: '#3a3226', opacity: .18 }));
  ground.position.y = -.16;
  ground.receiveShadow = true;
  scene.add(key, fill, ground);
  const pivot = new THREE.Group();
  scene.add(pivot);
  return { scene, pivot, camera: new THREE.PerspectiveCamera(24, 1, .1, 100) };
}

// Fit a box (height h, width w around y) into the view, seen from `pitch`.
/** @typedef {{ y: number, h: number, w: number, r: number }} Frame */
/** @param {THREE.PerspectiveCamera} camera @param {number} aspect @param {Frame} box @param {number} pitch */
function aim(camera, aspect, { y, h, w, r }, pitch){
  const t = Math.tan(camera.fov * Math.PI / 360);
  const dist = Math.max(h / 2 / t, w / 2 / (t * aspect)) + r;
  camera.aspect = aspect;
  camera.position.set(0, y + Math.sin(pitch) * dist, Math.cos(pitch) * dist);
  camera.lookAt(0, y, 0);
  camera.updateProjectionMatrix();
}
// The whole chamber, on tall and wide (phone) views alike.
const FRAME_TALL = { y: 2.3, h: 5.5, w: 3.5, r: 1.6 };
const FRAME_WIDE = { y: 2.35, h: 5.3, w: 3.6, r: 1.6 };   // whole chamber: plants now fill it (10 Oct)
const FRAME_STILL = { y: 2.3, h: 5.1, w: 2.9, r: 1.2 };

/** @param {SceneSpec} spec */
function diorama(spec){
  const D = depthOf(spec.chamber);
  const chamber = chamberGroup(spec.chamber, D), floor = floorGroup(spec, D), plantsG = new THREE.Group();
  for (const it of layout(spec, floor.userData.base, D)){
    const m = plantMesh(it.p);
    m.position.set(...it.pos);
    m.scale.set(...it.s);
    m.rotation.y = it.yaw;
    plantsG.add(m);
  }
  return { chamber, floor, plantsG, D };
}

/** @type {Set<THREE.Material>} */
const SHARED = new Set([mat, glassMat, glintMat]);
/** @param {THREE.Object3D} o */
function disposeTree(o){
  o.traverse(x => {
    if (isMesh(x)){ x.geometry.dispose(); if (!SHARED.has(matOf(x)) && !matOf(x).userData.keep) matOf(x).dispose(); }
    if (isLight(x)) x.dispose();
  });
}


// ═══ THE VIEW ═════════════════════════════════════════════════════════

/** @param {{ onLost?: () => void }} [opts] */
export function create3D({ onLost } = {}){
  const canvas = document.createElement('canvas');
  canvas.className = 'mk-3d';
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  /** @type {THREE.WebGLRenderer} */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR());

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const live = makeStage(), studio = makeStage();
  const view = { yaw: -.55, pitch: .2 };
  const t0 = performance.now();
  /** @type {HTMLElement | null} */
  let host = null;
  /** @type {{ x: number, y: number, yaw: number, pitch: number } | null} */
  let drag = null;
  let onScreen = true, raf = 0, size = [0, 0], lost = false;
  /** @type {{ chamber: THREE.Group, floor: THREE.Group, plantsG: THREE.Group } | null} */
  let parts = null;
  /** @type {{ ck?: string, fk?: string }} */
  let keys = {};
  /** @type {SceneSpec | null} */
  let shown = null;                                   // shown: the spec on screen now
  /** @type {{ obj: THREE.Object3D, from: THREE.Vector3, to: THREE.Vector3, start: number, dur: number }[]} */
  const anims = [];

  // ─── render loop · runs only while something moves and the view is on screen
  function draw(now = performance.now()){
    const sway = reduced.matches ? 0 : Math.sin(((now - t0) / 18000) * Math.PI * 2) * .14;   // one ambient motion, 18 s
    live.pivot.rotation.y = view.yaw + sway;
    aim(live.camera, size[0] / size[1] || 1, size[0] / size[1] > 1.15 ? FRAME_WIDE : FRAME_TALL, view.pitch);
    renderer.render(live.scene, live.camera);
  }
  /** @param {number} now */
  function frame(now){
    raf = 0;
    for (let i = anims.length - 1; i >= 0; i--){
      const a = anims[i], k = Math.min(1, (now - a.start) / a.dur), e = 1 - (1 - k) ** 3;   // ease-out, no overshoot
      a.obj.scale.lerpVectors(a.from, a.to, e);
      if (k >= 1) anims.splice(i, 1);
    }
    draw(now);
    if (anims.length || !reduced.matches) schedule();
  }
  function schedule(){
    if (!raf && host && onScreen && !document.hidden && !lost) raf = requestAnimationFrame(frame);
  }
  function stop(){ if (raf) cancelAnimationFrame(raf); raf = 0; }

  const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; onScreen ? schedule() : stop(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : schedule()));
  // Safari before 14 has no addEventListener on MediaQueryList.
  /** @type {{ addEventListener?: (type: string, fn: () => void) => void }} */ (reduced).addEventListener?.('change', schedule);

  function resize(){
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === size[0] && h === size[1])) return;
    size = [w, h];
    renderer.setPixelRatio(DPR());
    renderer.setSize(w, h, false);
    draw();
  }
  new ResizeObserver(resize).observe(canvas);

  // ─── turn it: drag (pointer) or arrow keys
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    view.yaw = drag.yaw + (e.clientX - drag.x) * .008;
    if (e.pointerType === 'mouse') view.pitch = clamp(drag.pitch + (e.clientY - drag.y) * .004, .02, .6);
    draw();
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', (e) => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (e.key === 'Home'){ view.yaw = -.55; view.pitch = .2; }
    else if (!k) return;
    else { view.yaw += k[0] * Math.PI / 12; view.pitch = clamp(view.pitch + k[1] * .08, .02, .6); }
    e.preventDefault();
    draw();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    stop();
    canvas.remove();
    onLost?.();
  });

  /** @param {THREE.Object3D} obj @param {THREE.Vector3} from */
  function grow(obj, from){
    if (reduced.matches) return;
    anims.push({ obj, from: from.clone(), to: obj.scale.clone(), start: performance.now(), dur: 600 });
    obj.scale.copy(from);
  }

  // Draw a spec. Rebuild only what changed; a new plant (fresh) grows in.
  /** @param {SceneSpec} spec @param {string | null} fresh @param {boolean} animate */
  function apply(spec, fresh, animate){
    const D = depthOf(spec.chamber);
    const ck = spec.chamber?.sku || '-';
    const fk = `${ck}|${spec.soilless}|${String(spec.substrate)}`;
    if (!parts){
      parts = { chamber: new THREE.Group(), floor: new THREE.Group(), plantsG: new THREE.Group() };
      live.pivot.add(parts.chamber, parts.floor, parts.plantsG);
    }
    if (keys.ck !== ck){
      live.pivot.remove(parts.chamber); disposeTree(parts.chamber);
      parts.chamber = chamberGroup(spec.chamber, D); live.pivot.add(parts.chamber);
    }
    if (keys.fk !== fk){
      const layersIn = animate && keys.ck === ck && spec.substrate && !spec.soilless;
      live.pivot.remove(parts.floor); disposeTree(parts.floor);
      parts.floor = floorGroup(spec, D); live.pivot.add(parts.floor);
      if (layersIn){ parts.floor.position.y = FLOOR; parts.floor.children[0]?.position.set(0, -FLOOR, 0); grow(parts.floor, new THREE.Vector3(1, .01, 1)); }
    }
    keys = { ck, fk };
    // Plants: cheap to re-place every time, so the layout always matches the build.
    // A model that has just arrived replaces its stand-in and grows in.
    // plantsG holds only plant meshes, each tagged with its plant id.
    const byId = new Map(parts.plantsG.children.map(m => /** @type {[string, THREE.Mesh]} */ ([m.userData.pid, m])));
    parts.plantsG.clear();
    for (const it of layout(spec, parts.floor.userData.base, D)){
      const geo = plantGeo(it.p);
      let m = byId.get(it.p.id), swapped = false;
      if (!m) m = Object.assign(plantMesh(it.p), { userData: { pid: it.p.id } });
      else if (m.geometry !== geo){ m.geometry = geo; m.material = plantMat(it.p); swapped = true; }
      m.position.set(...it.pos);
      m.rotation.y = it.yaw;
      m.scale.set(...it.s);
      const running = anims.find(a => a.obj === m);
      if (running) running.to.set(...it.s);
      else if ((animate && it.p.id === fresh) || swapped) grow(m, new THREE.Vector3(...it.s).multiplyScalar(.15));
      parts.plantsG.add(m);
    }
    // Fetch any models this build still lacks, then redraw it.
    const waiting = pendingFor(spec.plants);
    if (waiting.length) void Promise.all(waiting).then(() => { if (spec === shown && host && !lost){ apply(spec, null, false); draw(); schedule(); } });
  }

  // Render once at w×h with the shared renderer, return a data URL.
  const shot = document.createElement('canvas');
  /** @param {THREE.Scene} scene @param {THREE.Camera} camera @param {number} w @param {number} h */
  function snap(scene, camera, w, h){
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    renderer.render(scene, camera);
    shot.width = w; shot.height = h;
    const ctx = /** @type {CanvasRenderingContext2D} */ (shot.getContext('2d'));
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(canvas, 0, 0);
    return shot.toDataURL('image/webp', .9);
  }
  // Snapshots resize the canvas; put the live view back in the same task, so it never flashes.
  function restore(){
    renderer.setPixelRatio(DPR());
    if (size[0]) { renderer.setSize(size[0], size[1], false); if (host && onScreen) draw(); }
  }

  /** @type {Map<string, string>} */
  const thumbCache = new Map(), shotCache = new Map();
  /** @type {Map<string, () => void>} */
  const stillWait = new Map();
  /** @param {SceneSpec} spec @param {number} w @param {number} h */
  function drawStill(spec, w, h){
    const d = diorama(spec);
    studio.pivot.add(d.chamber, d.floor, d.plantsG);
    studio.pivot.rotation.y = -.55;
    aim(studio.camera, w / h, FRAME_STILL, .2);
    const url = snap(studio.scene, studio.camera, w, h);
    studio.pivot.clear();
    studio.pivot.rotation.y = 0;
    [d.chamber, d.floor].forEach(disposeTree);
    restore();
    return url;
  }
  /** @param {THREE.Object3D} obj @param {number} aspect */
  const studioFit = (obj, aspect, pitch = .32, pad = 1.08) => {
    const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    aim(studio.camera, aspect, { y: c.y, h: s.y * pad, w: Math.max(s.x, s.z) * pad, r: Math.max(s.x, s.z) * .3 }, pitch);
  };
  const puck = new THREE.Mesh(paint(new THREE.CylinderGeometry(.42, .46, .1, 7).translate(0, -.05, 0), col(ACCENT), rng(4), .05), mat);
  puck.receiveShadow = true;

  return {
    canvas,
    // Mount the one live view in `el` (hero or preview) and draw `spec`.
    /** @param {HTMLElement} el @param {SceneSpec} spec @param {{ fresh?: string | null, label?: string }} [opts] */
    show(el, spec, { fresh = null, label = '' } = {}){
      if (lost) return;
      const moved = canvas.parentNode !== el;
      if (moved){ el.replaceChildren(canvas); keys = {}; }
      canvas.setAttribute('aria-label', `${label} Drag, or use the arrow keys, to turn it.`);
      host = el;
      shown = spec;
      apply(spec, fresh, !moved);
      resize();
      draw();
      schedule();
    },
    // Plant thumbnail (data URL) or undefined until it's drawn.
    thumb: (/** @type {string} */ id) => thumbCache.get(id),
    // Draw every thumbnail, one per idle moment; `done` runs after each.
    // Waits for the plants' models first (the line drawings show meanwhile).
    // Was 6 per frame with no break: on slow phones that froze the page for
    // seconds and swallowed taps (QA-010; CI's guided-search flake site-ktu).
    // `paused()` holds the work while a dialog is open over the Maker.
    /** @param {PlantSpec[]} list @param {() => void} done @param {{ paused?: () => boolean }} [opts] */
    thumbs(list, done, { paused = () => false } = {}){
      const todo = list.filter(p => !thumbCache.has(p.id));
      // Old Safari has no requestIdleCallback, though the DOM types say it's always there.
      /** @param {() => void} fn */
      const idle = (fn) => (/** @type {{ requestIdleCallback?: unknown }} */ (window).requestIdleCallback ? requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50));
      const step = () => {
        if (lost) return;
        if (paused()) { setTimeout(step, 300); return; }
        const batch = todo.splice(0, 1);
        for (const p of batch){
          const g = new THREE.Group(), m = plantMesh(p), { h, r } = sizeOf(p);
          const disc = puck.clone();
          disc.scale.set(r * 1.6, Math.max(h, r) * .5, r * 1.6);
          m.rotation.y = turnOf(p).yaw;
          g.add(disc, m);
          g.rotation.y = -.5;
          studio.pivot.add(g);
          studioFit(g, 56 / 64);
          thumbCache.set(p.id, snap(studio.scene, studio.camera, 112, 128));
          studio.pivot.remove(g);
        }
        restore();
        if (batch.length) done();
        if (todo.length) idle(step);
      };
      void Promise.all(pendingFor(todo)).then(() => idle(step));   // loadModel never rejects
    },
    // A finished terrarium as an image (recipe cards). Cached by `key`.
    // While its models load it returns the procedural version (not cached),
    // then calls onUpdate() once they're in: call still() again, when it suits,
    // for the finished one. (It used to redraw here, all six recipes in one
    // burst, even after the start screen had gone: site-glj.)
    /** @param {string} key @param {SceneSpec} spec @param {number} w @param {number} h @param {() => void} onUpdate */
    still(key, spec, w, h, onUpdate){
      if (lost) return '';
      if (shotCache.has(key)) return shotCache.get(key);
      const waiting = pendingFor(spec.plants);
      if (waiting.length){
        if (!stillWait.has(key)) void Promise.all(waiting).then(() => { const cb = stillWait.get(key); stillWait.delete(key); if (!lost) cb?.(); });
        stillWait.set(key, onUpdate);
        return drawStill(spec, w, h);
      }
      shotCache.set(key, drawStill(spec, w, h));
      return shotCache.get(key);
    },
    // A cut block of a foundation (Foundation step swatches).
    /** @param {string} look */
    swatch(look){
      if (lost) return '';
      const key = `sw-${look}`;
      if (!shotCache.has(key)){
        const { geo } = floorGeo(look, .7, .32, rng(look === 'aroid' ? 7 : 3));
        const m = new THREE.Mesh(geo, mat);
        m.position.y = -FLOOR;
        m.rotation.y = -.45;
        studio.pivot.add(m);
        studioFit(m, 96 / 44, .3, .95);
        shotCache.set(key, snap(studio.scene, studio.camera, 192, 88));
        studio.pivot.clear();
        geo.dispose();
        restore();
      }
      return shotCache.get(key);
    }
  };
}
