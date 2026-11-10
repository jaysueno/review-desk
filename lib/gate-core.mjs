// The gate's two shapes. The single form prints one line for a person and exits 0 or 1. The batch
// form writes one verdict per draft and always exits 0, because it describes the set rather than
// refusing one reply.
import { readFileSync, writeFileSync } from 'node:fs';
import { loadRules, evaluate } from './rule-runner.mjs';
import { repoRoot } from './paths.mjs';

export async function rulesForRepo() {
  return loadRules(repoRoot('rules'));
}

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, value) {
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n');
}

export async function gateOne(review, draft, rules) {
  const list = rules || (await rulesForRepo());
  return evaluate(list, review, draft);
}

export async function gateBatch(reviewsFile, draftsFile) {
  const reviews = readJson(reviewsFile);
  const drafts = readJson(draftsFile);
  const rules = await rulesForRepo();
  const byId = new Map();
  for (const review of reviews.reviews || []) {
    byId.set(review.id, review);
  }
  const results = [];
  for (const row of drafts.drafts || []) {
    const review = byId.get(row.review_id);
    if (!review) {
      results.push({
        review_id: row.review_id,
        pass: false,
        rule: 'unknown-review',
        reason: 'the draft names a review that is not in the set',
      });
      continue;
    }
    const verdict = await evaluate(rules, review, row.text);
    results.push({
      review_id: row.review_id,
      pass: verdict.pass,
      rule: verdict.rule,
      reason: verdict.reason,
    });
  }
  return results;
}
