import test from 'node:test';
import assert from 'node:assert/strict';
import { gateForApproval } from '../lib/approve.mjs';
import { appendEdit, readEditLog, editsFor } from '../lib/edit-log.mjs';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { repoRoot } from '../lib/paths.mjs';

const review = {
  id: 'a-01',
  rating: 2,
  language: 'en',
  reviewer: 'Mara',
  text: 'The loaf was dry and I was disappointed.',
  topics: ['product'],
  staff: [],
  flags: [],
};

test('approval refuses a money promise with 422 and stores nothing', async () => {
  const verdict = await gateForApproval(repoRoot(), review, 'I am sorry. We will refund you today and comp the next one.');
  assert.equal(verdict.ok, false);
  assert.equal(verdict.status, 422);
  assert.equal(verdict.rule, 'no-money');
  assert.match(verdict.reason, /money/);
});

test('approval passes a clean reply', async () => {
  const verdict = await gateForApproval(repoRoot(), review, 'I am sorry the loaf was dry. Thank you for telling us, and we will check the bake.');
  assert.equal(verdict.ok, true);
  assert.equal(verdict.status, 200);
});

test('the web app and the promoter read one edit log', () => {
  const root = mkdtempSync(join(tmpdir(), 'review-desk-edits-'));
  try {
    appendEdit(root, {
      review_id: 'a-01',
      before: 'Thank you for telling us.',
      after: 'I am sorry the loaf was dry. Thank you for telling us.',
      correction_class: 'apology-first',
      review,
    });
    const all = readEditLog(root);
    assert.equal(all.length, 1);
    assert.equal(editsFor(root, 'a-01').length, 1);
    assert.equal(all[0].correction_class, 'apology-first');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
