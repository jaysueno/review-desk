// Turns a correction class that has repeated into a rule module and a test that travels with it.
// The rule is derived from the edits themselves: the longest word run that every corrected reply
// shares and no original draft has. That is the correction, stated as code.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MIN_EDITS = 3;
const MAX_PHRASE_WORDS = 5;

export function normalize(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokens(text) {
  const value = normalize(text);
  return value ? value.split(' ') : [];
}

function containsRun(haystack, needle) {
  return (' ' + haystack + ' ').includes(' ' + needle + ' ');
}

function commonPhrase(edits) {
  const afters = edits.map((row) => normalize(row.after));
  const befores = edits.map((row) => normalize(row.before));
  const first = afters[0] ? afters[0].split(' ') : [];
  for (let size = Math.min(MAX_PHRASE_WORDS, first.length); size >= 1; size -= 1) {
    for (let start = 0; start + size <= first.length; start += 1) {
      const phrase = first.slice(start, start + size).join(' ');
      const inEveryAfter = afters.every((text) => containsRun(text, phrase));
      const inNoBefore = befores.every((text) => !containsRun(text, phrase));
      if (inEveryAfter && inNoBefore) return phrase;
    }
  }
  return '';
}

export function ruleName(correctionClass) {
  const name = String(correctionClass == null ? '' : correctionClass)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return name || 'promoted-rule';
}

export function ruleSource(name, phrase) {
  return `// Proposed from three or more edits of the correction class "${name}".
// Every corrected reply shares this phrase and no original draft has it.
export const id = ${JSON.stringify(name)};
export const description = 'The reply carries the phrase this correction class added.';

const PHRASE = ${JSON.stringify(phrase)};
const COMBINING = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

function normalize(text) {
  return String(text == null ? '' : text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(COMBINING, '')
    .replace(/[^a-z0-9\\s']/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

export function check(review, draft) {
  const text = normalize(draft);
  if (!(' ' + text + ' ').includes(' ' + PHRASE + ' ')) {
    return { pass: false, reason: 'the reply does not carry the phrase this correction class added' };
  }
  return { pass: true, reason: '' };
}
`;
}

export function testSource(name, edits) {
  const cases = edits.map((row) => ({
    review_id: row.review_id,
    review: row.review,
    before: row.before,
    after: row.after,
  }));
  return `// Generated with the rule. It passes on its own: node --test ${name}.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { check } from './${name}.mjs';

const cases = ${JSON.stringify(cases, null, 2)};

cases.forEach((row, index) => {
  test('case ' + (index + 1) + ' refuses the draft this rule catches', () => {
    assert.equal(check(row.review, row.before).pass, false);
  });
  test('case ' + (index + 1) + ' passes the corrected draft', () => {
    assert.equal(check(row.review, row.after).pass, true);
  });
});
`;
}

export function groupEdits(edits) {
  const groups = new Map();
  for (const row of edits || []) {
    if (!row || typeof row.correction_class !== 'string' || !row.correction_class.trim()) continue;
    const key = row.correction_class.trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return groups;
}

export function propose(edits, outDir) {
  const groups = groupEdits(edits);
  const ready = [];
  for (const [correctionClass, rows] of groups) {
    if (rows.length >= MIN_EDITS) ready.push({ correctionClass, rows });
  }
  ready.sort((a, b) => a.correctionClass.localeCompare(b.correctionClass));
  if (!ready.length) return { count: 0, files: [] };

  mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const item of ready) {
    const name = ruleName(item.correctionClass);
    const phrase = commonPhrase(item.rows);
    if (!phrase) continue;
    const rulePath = join(outDir, name + '.mjs');
    const testPath = join(outDir, name + '.test.mjs');
    writeFileSync(rulePath, ruleSource(name, phrase));
    writeFileSync(testPath, testSource(name, item.rows));
    files.push(rulePath, testPath);
  }
  return { count: files.length / 2, files };
}
