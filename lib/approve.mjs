// The approval gate. Every rule runs on the exact text being approved. A failed rule returns
// 422 with the rule and reason, and the caller stores nothing.
import { join } from 'node:path';
import { loadRules, evaluate } from './rule-runner.mjs';

export async function gateForApproval(root, review, text) {
  const rules = await loadRules(join(root, 'rules'));
  const verdict = await evaluate(rules, review, text);
  if (verdict.pass) {
    return { ok: true, status: 200, rule: '', reason: '' };
  }
  return { ok: false, status: 422, rule: verdict.rule, reason: verdict.reason };
}
