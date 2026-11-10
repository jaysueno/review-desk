import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function repoRoot(...parts) {
  return parts.length ? join(ROOT, ...parts) : ROOT;
}
