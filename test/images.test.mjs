import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot } from '../lib/paths.mjs';

test('the hero image carries a title, a description and no em dash', () => {
  const svg = readFileSync(join(repoRoot(), 'docs', 'img', 'loop.svg'), 'utf8');
  assert.match(svg, /<title>[^<]+<\/title>/);
  assert.match(svg, /<desc>[^<]+<\/desc>/);
  assert.equal(svg.includes(String.fromCharCode(0x2014)), false);
});
