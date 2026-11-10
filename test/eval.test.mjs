import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreSet, decide } from '../lib/eval.mjs';
import { repoRoot } from '../lib/paths.mjs';
import draft from '../lib/drafter.mjs';

test('the eval passes the approved set with the template drafter', async () => {
  const result = await scoreSet({ root: repoRoot(), drafter: draft });
  assert.equal(result.total, 16);
  assert.equal(result.selfCheckFailures, 0);
  assert.equal(result.rate, 1);
  assert.equal(decide(result).ok, true);
});

test('a worse drafter makes the eval fail', async () => {
  const result = await scoreSet({ root: repoRoot(), drafter: () => 'Thanks!' });
  assert.ok(result.rate < 0.5);
  assert.equal(decide(result).ok, false);
});

test('the eval counts a number the review never states', async () => {
  const liar = (review) => `Thank you for the note, ${review.reviewer}. We bake 40 loaves a day and hope you return.`;
  const result = await scoreSet({ root: repoRoot(), drafter: liar });
  assert.ok(result.numbersOutside > 0);
  assert.equal(decide(result).ok, false);
});
