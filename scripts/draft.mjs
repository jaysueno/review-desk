#!/usr/bin/env node
// Drafts one reply per review with the selected drafter: REVIEW_DESK_DRAFTER, the model path when
// LLM_URL is set, or the built-in template.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { parseFlags, failUsage } from '../lib/cli.mjs';
import { loadDrafter } from '../lib/drafter-select.mjs';

const USAGE = 'usage: node scripts/draft.mjs --reviews <reviews.json> --out <drafts.json>';

let flags;
try {
  flags = parseFlags(process.argv.slice(2), ['reviews', 'out']);
} catch (error) {
  failUsage(error.message, USAGE);
}

let set;
try {
  set = JSON.parse(readFileSync(flags.reviews, 'utf8'));
} catch (error) {
  process.stderr.write(`the review set could not be read: ${error.message}\n`);
  process.exit(2);
}

const drafter = await loadDrafter();
const drafts = [];
for (const review of set.reviews || []) {
  const text = await drafter(review);
  drafts.push({ review_id: review.id, text: String(text == null ? '' : text) });
}

mkdirSync(dirname(flags.out), { recursive: true });
writeFileSync(flags.out, JSON.stringify({ drafts }, null, 2) + '\n');
