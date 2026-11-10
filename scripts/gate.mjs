#!/usr/bin/env node
// Two forms.
// Single: node scripts/gate.mjs --review <review.json> --draft <draft.txt>
//   Prints exactly PASS (exit 0) or exactly one line FAIL <rule>: <reason> (exit 1).
// Batch: node scripts/gate.mjs --reviews <reviews.json> --drafts <drafts.json> --out <gated.json>
//   Writes one verdict per draft and exits 0.
import { readFileSync } from 'node:fs';
import { parseFlags, failUsage } from '../lib/cli.mjs';
import { gateOne, gateBatch, writeJson } from '../lib/gate-core.mjs';

const USAGE = [
  'usage: node scripts/gate.mjs --review <review.json> --draft <draft.txt>',
  '   or: node scripts/gate.mjs --reviews <reviews.json> --drafts <drafts.json> --out <gated.json>',
].join('\n');

let flags;
try {
  flags = parseFlags(
    process.argv.slice(2),
    [],
    ['review', 'draft', 'reviews', 'drafts', 'out'],
  );
} catch (error) {
  failUsage(error.message, USAGE);
}

const single = flags.review !== undefined || flags.draft !== undefined;
const batch = flags.reviews !== undefined || flags.drafts !== undefined;

if (single && batch) {
  failUsage('use either the single form or the batch form, not both', USAGE);
}

if (single) {
  if (!flags.review || !flags.draft) {
    failUsage('the single form needs --review and --draft', USAGE);
  }
  let review;
  let draft;
  try {
    review = JSON.parse(readFileSync(flags.review, 'utf8'));
    draft = readFileSync(flags.draft, 'utf8');
  } catch (error) {
    process.stderr.write(`the gate could not read its input: ${error.message}\n`);
    process.exit(2);
  }
  const verdict = await gateOne(review, draft);
  if (verdict.pass) {
    process.stdout.write('PASS\n');
    process.exit(0);
  }
  process.stdout.write(`FAIL ${verdict.rule}: ${verdict.reason}\n`);
  process.exit(1);
}

if (batch) {
  if (!flags.reviews || !flags.drafts || !flags.out) {
    failUsage('the batch form needs --reviews, --drafts and --out', USAGE);
  }
  const results = await gateBatch(flags.reviews, flags.drafts);
  writeJson(flags.out, { results });
  process.exit(0);
}

failUsage('give either --review and --draft, or --reviews, --drafts and --out', USAGE);
