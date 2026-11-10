// One edit log for the whole app: data/edits.json. The web app appends to it, the model drafter
// reads it for few-shot examples, and promote.mjs reads the same file. The command line edit
// command writes the path given with --out, so the CLI loop works in any folder.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export function editLogPath(root) {
  return join(root, 'data', 'edits.json');
}

export function readEditLog(root) {
  const path = editLogPath(root);
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    return Array.isArray(data.edits) ? data.edits : [];
  } catch {
    return [];
  }
}

export function editsFor(root, reviewId) {
  return readEditLog(root).filter((edit) => edit.review_id === reviewId);
}

export function appendEdit(root, edit) {
  const edits = readEditLog(root);
  edits.push(edit);
  const path = editLogPath(root);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ edits }, null, 2) + '\n');
  return edit;
}
