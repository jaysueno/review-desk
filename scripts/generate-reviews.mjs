#!/usr/bin/env node
// Writes the invented review set. Same seed, same bytes: nothing here reads the clock, the
// network or Math.random.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { generate } from '../lib/reviews.mjs';
import { parseFlags, failUsage } from '../lib/cli.mjs';

const USAGE = 'usage: node scripts/generate-reviews.mjs --seed 7 --out <file.json>';

let flags;
try {
  flags = parseFlags(process.argv.slice(2), ['seed', 'out']);
} catch (error) {
  failUsage(error.message, USAGE);
}

const seed = Number(flags.seed);
if (!Number.isInteger(seed)) {
  failUsage('--seed must be an integer', USAGE);
}

const set = generate(seed);
const out = flags.out;
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(set, null, 2) + '\n');
