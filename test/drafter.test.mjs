import test from 'node:test';
import assert from 'node:assert/strict';
import draft from '../lib/drafter.mjs';
import { generate } from '../lib/reviews.mjs';
import { loadRules, evaluate } from '../lib/rule-runner.mjs';
import { repoRoot } from '../lib/paths.mjs';

test('the template drafter passes every rule on every invented review', async () => {
  const rules = await loadRules(repoRoot('rules'));
  for (const review of generate(7).reviews) {
    const text = draft(review);
    const verdict = await evaluate(rules, review, text);
    assert.equal(verdict.pass, true, `${review.id} failed ${verdict.rule}: ${verdict.reason}`);
  }
});

test('the template drafter states no digit', () => {
  for (const review of generate(7).reviews) {
    assert.equal(/\d/.test(draft(review)), false, `${review.id} produced a digit`);
  }
});

test('the template drafter answers in the review language', () => {
  for (const review of generate(7).reviews) {
    const text = draft(review);
    if (review.language === 'es') {
      assert.ok(/gracias|sentimos/i.test(text), `${review.id} did not answer in Spanish`);
    } else {
      assert.ok(/thank|sorry/i.test(text), `${review.id} did not answer in English`);
    }
  }
});
