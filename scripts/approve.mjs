#!/usr/bin/env node
// Keeps only drafts that pass every rule, and carries each review object so a later edit can be
// replayed against the review it answered.
import { readFileSync } from 'node:fs';
import { parseFlags, failUsage } from '../lib/cli.mjs';
import { rulesForRepo, readJson, writeJson } from '../lib/gate-core.mjs';
import { evaluate } from '../lib/rule-runner.mjs';

const USAGE = 'usage: node scripts/approve.mjs --reviews <reviews.json> --drafts <drafts.json> --out <approved.json>';

let flags;
try {
  flags = parseFlags(process.argv.slice(2), ['reviews', 'drafts', 'out']);
} catch (error) {
  failUsage(error.message, USAGE);
}

let reviews;
let drafts;
try {
  reviews = readJson(flags.reviews);
  drafts = readJson(flags.drafts);
} catch (error) {
  process.stderr.write(`the approver could not read its input: ${error.message}\n`);
  process.exit(2);
}

const rules = await rulesForRepo();
const byId = new Map();
for (const review of reviews.reviews || []) {
  byId.set(review.id, review);
}

const approved = [];
for (const row of drafts.drafts || []) {
  const review = byId.get(row.review_id);
  if (!review) continue;
  const verdict = await evaluate(rules, review, row.text);
  if (verdict.pass) {
    approved.push({ review_id: row.review_id, text: row.text, review });
  }
}

writeJson(flags.out, { approved });
