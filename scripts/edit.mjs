#!/usr/bin/env node
// Stores one person's edit: the approved text as before, the person's reply as after, and the
// correction class that names what changed.
import { readFileSync, existsSync } from 'node:fs';
import { parseFlags, failUsage } from '../lib/cli.mjs';
import { readJson, writeJson } from '../lib/gate-core.mjs';

const USAGE = 'usage: node scripts/edit.mjs --approved <approved.json> --review <id> --reply <text> --class <slug> --out <edits.json>';

let flags;
try {
  flags = parseFlags(process.argv.slice(2), ['approved', 'review', 'reply', 'class', 'out']);
} catch (error) {
  failUsage(error.message, USAGE);
}

let approved;
try {
  approved = readJson(flags.approved);
} catch (error) {
  process.stderr.write(`the approved set could not be read: ${error.message}\n`);
  process.exit(2);
}

const row = (approved.approved || []).find((item) => item.review_id === flags.review);
if (!row) {
  process.stderr.write(`the approved set holds no reply for ${flags.review}\n`);
  process.exit(2);
}

const edit = {
  review_id: flags.review,
  before: row.text,
  after: flags.reply,
  correction_class: flags.class,
  review: row.review || null,
};

let edits = [];
if (existsSync(flags.out)) {
  try {
    const current = JSON.parse(readFileSync(flags.out, 'utf8'));
    edits = Array.isArray(current.edits) ? current.edits : [];
  } catch {
    edits = [];
  }
}
edits.push(edit);
writeJson(flags.out, { edits });
