import test from 'node:test';
import assert from 'node:assert/strict';
import { generate } from '../lib/reviews.mjs';

test('the generator writes the same invented set at seed 7 every time', () => {
  const first = JSON.stringify(generate(7));
  const second = JSON.stringify(generate(7));
  assert.equal(first, second);
});

test('the generator carries every hard case the plan names', () => {
  const set = generate(7);
  assert.ok(set.reviews.length >= 120, 'expected at least 120 reviews');
  assert.equal(set.seed, 7);
  assert.equal(typeof set.business.name, 'string');

  const ids = new Set();
  for (const review of set.reviews) {
    assert.equal(typeof review.id, 'string');
    assert.ok(!ids.has(review.id), 'review ids repeat');
    ids.add(review.id);
    assert.ok(Number.isInteger(review.rating) && review.rating >= 1 && review.rating <= 5);
    assert.ok(typeof review.language === 'string' && review.language.length);
    assert.ok(typeof review.reviewer === 'string' && review.reviewer.length);
    assert.ok(typeof review.text === 'string' && review.text.length);
    assert.ok(Array.isArray(review.topics));
    assert.ok(Array.isArray(review.staff));
    assert.ok(Array.isArray(review.flags));
  }

  const flags = new Set(set.reviews.flatMap((review) => review.flags));
  for (const flag of ['refund', 'staff-named', 'non-english', 'abusive']) {
    assert.ok(flags.has(flag), `the set is missing the ${flag} flag`);
  }

  const staffNamed = set.reviews.filter((review) => review.flags.includes('staff-named'));
  assert.ok(staffNamed.length > 0);
  for (const review of staffNamed) {
    const last = review.staff[0].last.toLowerCase();
    assert.ok(review.text.toLowerCase().includes(last), 'a staff-named review does not name the person');
  }

  const refund = set.reviews.filter((review) => review.flags.includes('refund'));
  assert.ok(refund.some((review) => /refund|money back/i.test(review.text)));

  assert.ok(set.reviews.some((review) => review.language !== 'en'));
});
