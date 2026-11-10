// Chooses the drafter: a module named by REVIEW_DESK_DRAFTER, else the model path when LLM_URL
// is set, else the built-in template drafter. All three default-export (review) => string.
import { pathToFileURL } from 'node:url';

export async function loadDrafter() {
  const custom = process.env.REVIEW_DESK_DRAFTER;
  if (custom) {
    const module = await import(pathToFileURL(custom).href);
    if (typeof module.default !== 'function') {
      throw new Error('REVIEW_DESK_DRAFTER does not default-export a function');
    }
    return module.default;
  }
  if (process.env.LLM_URL) {
    const module = await import('./llm-drafter.mjs');
    return module.default;
  }
  const module = await import('./drafter.mjs');
  return module.default;
}
