// Replays the approved set through the current drafter and the current gates. It fails when the
// pass rate drops below the stored baseline or when any hard-zero rule fires.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadRules, evaluate, HARD_ZERO_IDS } from './rule-runner.mjs';
import { digitTokens } from '../rules/numbers-from-review.mjs';

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export async function scoreSet({ root, drafter }) {
  const golden = loadJson(join(root, 'evals', 'golden.json'));
  const baseline = loadJson(join(root, 'evals', 'baseline.json'));
  const rules = await loadRules(join(root, 'rules'));
  const cases = Array.isArray(golden.cases) ? golden.cases : [];

  let selfCheckFailures = 0;
  let selfCheckFirst = '';
  for (const item of cases) {
    const verdict = await evaluate(rules, item.review, item.approved);
    if (!verdict.pass) {
      selfCheckFailures += 1;
      if (!selfCheckFirst) selfCheckFirst = `${item.review.id}: ${verdict.rule}`;
    }
  }

  let passed = 0;
  let hardZero = 0;
  let hardZeroRule = '';
  let numbersOutside = 0;

  for (const item of cases) {
    const draft = await drafter(item.review);
    const verdict = await evaluate(rules, item.review, draft);
    if (verdict.pass) passed += 1;
    if (!verdict.pass && HARD_ZERO_IDS.has(verdict.rule)) {
      hardZero += 1;
      if (!hardZeroRule) hardZeroRule = verdict.rule;
    }
    const allowed = new Set(digitTokens(item.review.text));
    for (const token of digitTokens(draft)) {
      if (!allowed.has(token)) numbersOutside += 1;
    }
  }

  const total = cases.length;
  const rate = total ? passed / total : 0;
  return {
    total,
    passed,
    rate,
    baseline: Number(baseline.rate),
    hardZero,
    hardZeroRule,
    numbersOutside,
    selfCheckFailures,
    selfCheckFirst,
  };
}

export function decide(result) {
  if (result.total === 0) {
    return { ok: false, reason: 'the approved set is empty' };
  }
  if (result.selfCheckFailures > 0) {
    return { ok: false, reason: `the approved set holds a reply that fails the current gates (${result.selfCheckFirst})` };
  }
  if (result.hardZero > 0) {
    return { ok: false, reason: `hard-zero rule ${result.hardZeroRule} failed on ${result.hardZero} case(s)` };
  }
  if (!Number.isFinite(result.baseline)) {
    return { ok: false, reason: 'no baseline is stored' };
  }
  if (result.rate + 1e-9 < result.baseline) {
    return {
      ok: false,
      reason: `pass rate dropped from ${result.baseline.toFixed(2)} to ${result.rate.toFixed(2)}`,
    };
  }
  return { ok: true, reason: '' };
}

export function formatRate(value) {
  return Number(value).toFixed(2);
}
