#!/usr/bin/env node
// Three edits of one class propose one rule and its test. Two propose nothing.
import { readFileSync } from 'node:fs';
import { parseFlags, failUsage } from '../lib/cli.mjs';
import { propose } from '../lib/promote.mjs';

const USAGE = 'usage: node scripts/promote.mjs --edits <edits.json> --out <dir>';

let flags;
try {
  flags = parseFlags(process.argv.slice(2), ['edits', 'out']);
} catch (error) {
  failUsage(error.message, USAGE);
}

let edits;
try {
  const data = JSON.parse(readFileSync(flags.edits, 'utf8'));
  edits = Array.isArray(data.edits) ? data.edits : [];
} catch (error) {
  process.stderr.write(`the edits could not be read: ${error.message}\n`);
  process.exit(2);
}

const result = propose(edits, flags.out);
process.stdout.write(`PROPOSED ${result.count}\n`);
