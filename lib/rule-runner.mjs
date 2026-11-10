// Loads every rule module in rules/ at call time, so a rule a person installs from a proposal is
// enforced on the next draft with no code change. The shipped six run first in a fixed order;
// promoted rules follow in name order. The first failure wins, so the gate's one line names one rule.
import { pathToFileURL } from 'node:url';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const RULE_ORDER = [
  'language-match',
  'no-money',
  'no-staff-surname',
  'length',
  'no-medical-legal',
  'numbers-from-review',
];

export const HARD_ZERO_IDS = new Set(['language-match', 'no-money', 'no-staff-surname']);

export async function loadRules(dir) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return [];
  }
  const ids = names
    .filter((name) => name.endsWith('.mjs') && !name.endsWith('.test.mjs'))
    .map((name) => name.slice(0, -4));
  const ordered = [
    ...RULE_ORDER.filter((id) => ids.includes(id)),
    ...ids.filter((id) => !RULE_ORDER.includes(id)).sort(),
  ];
  const rules = [];
  for (const id of ordered) {
    const path = join(dir, id + '.mjs');
    const stamp = statSync(path).mtimeMs;
    const module = await import(pathToFileURL(path).href + '?v=' + stamp);
    if (typeof module.check !== 'function') continue;
    rules.push({
      id,
      check: module.check,
      description: module.description || '',
      kind: module.kind || (HARD_ZERO_IDS.has(id) ? 'hard-zero' : 'gate'),
    });
  }
  return rules;
}

function clean(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

export async function evaluate(rules, review, draft) {
  for (const rule of rules) {
    const outcome = rule.check(review, draft) || {};
    if (!outcome.pass) {
      return { pass: false, rule: rule.id, reason: clean(outcome.reason) || 'failed' };
    }
  }
  return { pass: true, rule: '', reason: '' };
}
