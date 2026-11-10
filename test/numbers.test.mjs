import test from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../rules/numbers-from-review.mjs';
import { loadRules, evaluate } from '../lib/rule-runner.mjs';
import { repoRoot } from '../lib/paths.mjs';

const review = {
  id: 't-numbers',
  rating: 4,
  language: 'en',
  reviewer: 'Ravi',
  text: 'I ordered 2 sourdough loaves at 8 am and they were gone by noon.',
  topics: ['order'],
  staff: [],
  flags: [],
};

test('draft numbers stay inside the review', () => {
  assert.equal(check(review, 'Thank you for coming by at 8 in the morning. We are glad you got your loaves.').pass, true);
  assert.equal(check(review, 'We bake 40 loaves every morning and sell out fast.').pass, false);
});

test('the gate refuses a number the review never states', async () => {
  const rules = await loadRules(repoRoot('rules'));
  const verdict = await evaluate(rules, review, 'We bake 40 loaves every morning and sell out fast.');
  assert.equal(verdict.pass, false);
  assert.equal(verdict.rule, 'numbers-from-review');
});

test('a draft may state every number the review states and no other', () => {
  const allowed = check(review, 'You came at 8 and left with 2 loaves. Thank you for the visit.');
  assert.equal(allowed.pass, true);
  const invented = check(review, 'You came at 9 and left with 2 loaves. Thank you for the visit.');
  assert.equal(invented.pass, false);
});

test('the pronoun "one" is not treated as a number', async () => {
  const { check } = await import('../rules/numbers-from-review.mjs');
  const r = { id: 'x', text: 'The loaf was dry and the service was slow.' };
  assert.equal(check(r, 'We are sorry about that loaf. We hope the next one is better.').pass, true);
  assert.equal(check(r, 'We are sorry. We sold three of them that day without a problem.').pass, false);
});
