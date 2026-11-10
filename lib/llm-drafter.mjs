// Optional model path. It is used only when LLM_URL points at an OpenAI-compatible endpoint.
// The last approved edits for the review's topic ride along as few-shot examples.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

function approvedExamples(topic) {
  const path = join(ROOT, 'data', 'edits.json');
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    const rows = Array.isArray(data.edits) ? data.edits : [];
    return rows
      .filter((row) => {
        if (!row || !row.review) return false;
        const topics = Array.isArray(row.review.topics) ? row.review.topics : [];
        return topics.includes(topic);
      })
      .slice(-3);
  } catch {
    return [];
  }
}

function buildMessages(review) {
  const topic = Array.isArray(review.topics) && review.topics.length ? review.topics[0] : 'product';
  const system = [
    'You write one short public reply to a bakery review.',
    'Use the same language as the review.',
    'Do not state a number unless the review states it.',
    'Do not name a staff member surname.',
    'Do not promise money, a refund or a discount.',
    'Do not make a medical or legal claim.',
    'Keep the reply between 40 and 600 characters.',
  ].join(' ');
  const messages = [{ role: 'system', content: system }];
  for (const row of approvedExamples(topic)) {
    messages.push({ role: 'user', content: String(row.before || '') });
    messages.push({ role: 'assistant', content: String(row.after || '') });
  }
  const language = review.language || 'en';
  messages.push({
    role: 'user',
    content: `Review (${language}, rating ${review.rating}, topic ${topic}): ${review.text}`,
  });
  return messages;
}

export default async function draft(review) {
  const base = String(process.env.LLM_URL || '').replace(/\/+$/, '');
  const model = process.env.LLM_MODEL || 'local-model';
  const response = await fetch(base + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: buildMessages(review), temperature: 0.2 }),
  });
  if (!response.ok) {
    throw new Error(`the model endpoint answered ${response.status}`);
  }
  const data = await response.json();
  const text = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  return String(text || '').trim();
}
