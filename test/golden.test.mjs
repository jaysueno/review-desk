import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGolden } from '../scripts/make-golden.mjs';
import { loadRules, evaluate } from '../lib/rule-runner.mjs';
import { repoRoot } from '../lib/paths.mjs';

test('scripts/make-golden.mjs regenerates evals/golden.json byte for byte', () => {
  const onDisk = readFileSync(join(repoRoot(), 'evals', 'golden.json'), 'utf8');
  const regenerated = JSON.stringify(buildGolden(7), null, 2) + '\n';
  assert.equal(regenerated, onDisk);
});

test('every approved golden reply passes the current gates', async () => {
  const rules = await loadRules(repoRoot('rules'));
  const golden = buildGolden(7);
  assert.equal(golden.cases.length, 16);
  for (const item of golden.cases) {
    const verdict = await evaluate(rules, item.review, item.approved);
    assert.equal(verdict.pass, true, `${item.review.id} failed ${verdict.rule}: ${verdict.reason}`);
  }
});
