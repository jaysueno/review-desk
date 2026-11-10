#!/usr/bin/env node
// npm run eval. One EVAL line on stdout, exit 0 or 1. Set REVIEW_DESK_DRAFTER to replay the set
// with another drafter module.
import { parseFlags } from '../lib/cli.mjs';
import { repoRoot } from '../lib/paths.mjs';
import { loadDrafter } from '../lib/drafter-select.mjs';
import { scoreSet, decide, formatRate } from '../lib/eval.mjs';

// No flags: a run that names a drafter uses the environment, which the checks control.
try {
  parseFlags(process.argv.slice(2), [], []);
} catch (error) {
  process.stderr.write(`${error.message}\nusage: npm run eval\n`);
  process.exit(2);
}

const root = repoRoot();
const drafter = await loadDrafter();
const result = await scoreSet({ root, drafter });
const verdict = decide(result);

process.stdout.write(
  `golden set: ${result.total} approved case(s), ${result.passed} draft(s) through every gate\n`,
);
process.stdout.write(
  `numbers: ${result.numbersOutside} draft token(s) outside the review they answer\n`,
);

if (!verdict.ok) {
  process.stdout.write(`EVAL FAIL ${verdict.reason}\n`);
  process.exit(1);
}

process.stdout.write(`EVAL PASS ${formatRate(result.rate)}\n`);
