import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genLetter } from './hero-garden.js';

const opts = { w: 0.55, prevW: 0.5, first: false, last: true, maxUp: 0.8, seed: 42 };

void test('hero garden is the same on every visit', () => {
  assert.deepEqual(genLetter(opts), genLetter(opts));
});

void test('hero garden: ferns and moss only, and nothing rises past the keep-out', () => {
  for (let seed = 1; seed < 200; seed++){
    const E = genLetter({ ...opts, seed });
    assert.ok(E.some(e => e.t === 'stem'));
    for (const e of E){
      assert.ok(['stem', 'leaf', 'moss'].includes(e.t));
      if (e.t === 'stem') for (const [, y] of e.pts) assert.ok(y >= -opts.maxUp - 1e-9, `seed ${seed}: stem at ${y}`);
    }
  }
});
