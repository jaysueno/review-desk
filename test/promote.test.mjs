import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { propose } from '../lib/promote.mjs';

const edits = [
  {
    review_id: 'p-a',
    correction_class: 'apology-first',
    before: 'Thanks for the feedback. The rye loaf was dry because we changed flour.',
    after: 'I am sorry the rye loaf was dry. Thank you for telling us.',
    review: {
      id: 'p-a',
      rating: 3,
      language: 'en',
      reviewer: 'Ana',
      text: 'The rye loaf was dry and I was disappointed.',
      topics: ['product'],
      staff: [],
      flags: [],
    },
  },
  {
    review_id: 'p-b',
    correction_class: 'apology-first',
    before: 'We appreciate the review. The wait was longer than usual that morning.',
    after: 'I am sorry about the long wait that morning. Thank you for your patience.',
    review: {
      id: 'p-b',
      rating: 2,
      language: 'en',
      reviewer: 'Ben',
      text: 'I waited a long time for a simple coffee.',
      topics: ['service'],
      staff: [],
      flags: [],
    },
  },
  {
    review_id: 'p-c',
    correction_class: 'apology-first',
    before: 'Thanks for letting us know the coffee was cold.',
    after: 'I am sorry the coffee was cold. We have spoken with the team.',
    review: {
      id: 'p-c',
      rating: 2,
      language: 'en',
      reviewer: 'Cleo',
      text: 'My coffee was cold when it reached the table.',
      topics: ['product'],
      staff: [],
      flags: [],
    },
  },
];

test('three edits of one class propose one rule and one test', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'review-desk-promote-'));
  try {
    const result = propose(edits, dir);
    assert.equal(result.count, 1);
    assert.deepEqual(readdirSync(dir).sort(), ['apology-first.mjs', 'apology-first.test.mjs']);
    const module = await import(
      pathToFileURL(join(dir, 'apology-first.mjs')).href + '?v=' + Math.random().toString(36).slice(2)
    );
    for (const row of edits) {
      assert.equal(module.check(row.review, row.before).pass, false, 'the rule passes a draft it should catch');
      assert.equal(module.check(row.review, row.after).pass, true, 'the rule rejects a corrected draft');
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('two edits of one class propose nothing', () => {
  const dir = mkdtempSync(join(tmpdir(), 'review-desk-none-'));
  try {
    const result = propose(edits.slice(0, 2), dir);
    assert.equal(result.count, 0);
    assert.deepEqual(readdirSync(dir), []);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
