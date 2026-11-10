import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../lib/store.mjs';

test('the store keeps a draft and an approval', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'review-desk-store-'));
  let store;
  try {
    try {
      store = await openStore(dir);
    } catch (error) {
      t.skip('node:sqlite is not available on this Node');
      return;
    }
    const review = {
      id: 's-01',
      rating: 3,
      language: 'en',
      reviewer: 'Ana',
      text: 'The rye loaf was dry.',
      topics: ['product'],
      staff: [],
      flags: [],
    };
    store.addReview(review);
    store.putDraft('s-01', 'Thank you for telling us about the loaf. We will look at the bake.', {
      pass: true,
      rule: '',
      reason: '',
    });
    store.approve('s-01', 'I am sorry the loaf was dry. Thank you for telling us.');
    assert.equal(store.countReviews(), 1);
    assert.equal(store.getDraft('s-01').pass, 1);
    assert.equal(store.getApproval('s-01').text, 'I am sorry the loaf was dry. Thank you for telling us.');
  } finally {
    if (store) store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
