#!/usr/bin/env node
// The local review desk. Plain node:http, no framework, no external asset, no outbound call.
// PORT sets the port (default 3000). Every edit is appended to data/edits.json, the one log the
// model drafter and promotion read. Approval runs every rule on the exact text.
import { createServer } from 'node:http';
import { readFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { repoRoot } from '../lib/paths.mjs';
import { generate } from '../lib/reviews.mjs';
import { openStore } from '../lib/store.mjs';
import { loadDrafter } from '../lib/drafter-select.mjs';
import { loadRules, evaluate } from '../lib/rule-runner.mjs';
import { gateForApproval } from '../lib/approve.mjs';
import { appendEdit, readEditLog, editsFor } from '../lib/edit-log.mjs';
import { propose } from '../lib/promote.mjs';
import { scoreSet, decide } from '../lib/eval.mjs';
import { layout, queuePage, editPage, rulesPage, evalPage, esc } from '../ui/render.mjs';

const ROOT = repoRoot();
const DATA = join(ROOT, 'data');
const RULES_DIR = join(ROOT, 'rules');
const PROPOSED_DIR = join(DATA, 'proposed');
const PORT = Number(process.env.PORT || 3000);

const store = await openStore(DATA);
const drafter = await loadDrafter();

function ruleFiles() {
  try {
    return readdirSync(RULES_DIR)
      .filter((name) => name.endsWith('.mjs') && !name.endsWith('.test.mjs'))
      .sort();
  } catch {
    return [];
  }
}

async function gate(review, text) {
  return evaluate(await loadRules(RULES_DIR), review, text);
}

async function seed() {
  if (store.countReviews() === 0) {
    for (const review of generate(7).reviews) store.addReview(review);
  }
  const rules = await loadRules(RULES_DIR);
  for (const review of store.listReviews()) {
    if (store.getDraft(review.id)) continue;
    const text = await drafter(review);
    const verdict = await evaluate(rules, review, text);
    store.putDraft(review.id, String(text == null ? '' : text), verdict);
  }
}

await seed();

function send(res, status, body, type) {
  res.writeHead(status, { 'Content-Type': type || 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), 'application/json; charset=utf-8');
}

function redirect(res, location) {
  res.writeHead(303, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('the form is too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(new URLSearchParams(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', reject);
  });
}

function messageFrom(url) {
  const message = url.searchParams.get('message');
  return message ? message.slice(0, 300) : '';
}

function renderQueue(res, url, message) {
  const reviews = store.listReviews();
  const drafts = new Map();
  for (const row of store.listDrafts()) drafts.set(row.review_id, row);
  const perPage = 24;
  const pages = Math.max(1, Math.ceil(reviews.length / perPage));
  const wanted = Number(url.searchParams.get('page') || 1);
  const page = Math.min(pages, Math.max(1, Number.isFinite(wanted) ? Math.floor(wanted) : 1));
  const start = (page - 1) * perPage;
  const slice = reviews.slice(start, start + perPage);
  send(res, 200, queuePage({ reviews: slice, drafts, page, pages, total: reviews.length, message }));
}

async function renderEdit(res, id, message) {
  const review = store.getReview(id);
  if (!review) {
    send(res, 404, layout({ title: 'Not found', active: '/', body: '<h2>Review not found</h2><p><a href="/">Back to the queue</a></p>' }));
    return;
  }
  const draft = store.getDraft(id);
  const approval = store.getApproval(id);
  const edits = editsFor(ROOT, id);
  const before = approval ? approval.text : draft ? draft.text : '';
  const current = edits.length ? edits[edits.length - 1].after : draft ? draft.text : before;
  const beforeVerdict = await gate(review, before);
  const currentVerdict = await gate(review, current);
  send(res, 200, editPage({ review, draft, approval, edits, beforeVerdict, currentVerdict, message }));
}

async function renderRules(res, message) {
  const rules = await loadRules(RULES_DIR);
  const proposals = store.listProposals().map((item) => {
    let preview = '';
    try {
      const testPath = isAbsolute(item.test_path) ? item.test_path : join(ROOT, item.test_path);
      preview = readFileSync(testPath, 'utf8').slice(0, 1200);
    } catch {
      preview = 'the test file is no longer on disk';
    }
    return { ...item, preview };
  });
  send(res, 200, rulesPage({ rules, ruleFiles: ruleFiles(), proposals, message }));
}

async function renderEval(res) {
  const result = await scoreSet({ root: ROOT, drafter });
  const verdict = decide(result);
  send(res, 200, evalPage({ result, verdict }));
}

const style = readFileSync(join(ROOT, 'ui', 'style.css'));

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'GET' && path === '/style.css') {
      send(res, 200, style, 'text/css; charset=utf-8');
      return;
    }

    if (req.method === 'GET' && path === '/favicon.ico') {
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      res.end();
      return;
    }

    if (req.method === 'GET' && path === '/') {
      renderQueue(res, url, messageFrom(url));
      return;
    }

    if (req.method === 'GET' && path.startsWith('/review/')) {
      const id = decodeURIComponent(path.slice('/review/'.length));
      await renderEdit(res, id, messageFrom(url));
      return;
    }

    if (req.method === 'GET' && path === '/rules') {
      await renderRules(res, messageFrom(url));
      return;
    }

    if (req.method === 'GET' && path === '/eval') {
      await renderEval(res);
      return;
    }

    if (req.method === 'GET' && path === '/api/gate') {
      const review = store.getReview(String(url.searchParams.get('review_id') || ''));
      const text = String(url.searchParams.get('text') || '').slice(0, 10_000);
      if (!review) {
        sendJson(res, 404, { pass: false, rule: 'review', reason: 'review not found' });
        return;
      }
      sendJson(res, 200, await gate(review, text));
      return;
    }

    if (req.method === 'POST' && path === '/api/draft') {
      const body = await readBody(req);
      const id = String(body.get('review_id') || '');
      const review = store.getReview(id);
      if (!review) {
        redirect(res, '/?message=review+not+found');
        return;
      }
      const text = await drafter(review);
      const verdict = await gate(review, text);
      store.putDraft(id, String(text == null ? '' : text), verdict);
      redirect(res, `/review/${encodeURIComponent(id)}?message=draft+written`);
      return;
    }

    if (req.method === 'POST' && path === '/api/approve') {
      const body = await readBody(req);
      const id = String(body.get('review_id') || '');
      const text = String(body.get('after') || body.get('text') || '');
      const review = store.getReview(id);
      if (!review) {
        send(res, 404, layout({ title: 'Not found', active: '/', body: '<h2>Review not found</h2><p><a href="/">Back to the queue</a></p>' }));
        return;
      }
      const verdict = await gateForApproval(ROOT, review, text);
      if (!verdict.ok) {
        send(
          res,
          422,
          layout({
            title: 'Approval refused',
            active: '/',
            body: `<h2>Approval refused</h2>
<p class="lead">The gate refused this text, so nothing was stored. A hard-zero rule blocks approval.</p>
<div class="status bad">FAIL ${esc(verdict.rule)}: ${esc(verdict.reason)}</div>
<p><a href="/review/${encodeURIComponent(id)}">Back to the review</a></p>`,
          }),
        );
        return;
      }
      store.approve(id, text);
      redirect(res, `/review/${encodeURIComponent(id)}?message=approved`);
      return;
    }

    if (req.method === 'POST' && path === '/api/edit') {
      const body = await readBody(req);
      const id = String(body.get('review_id') || '');
      const review = store.getReview(id);
      const after = String(body.get('after') || '').trim();
      const correctionClass = String(body.get('correction_class') || 'general').trim() || 'general';
      if (!review || !after) {
        redirect(res, `/?message=${encodeURIComponent('the edit needs a review and a reply')}`);
        return;
      }
      const approval = store.getApproval(id);
      const draft = store.getDraft(id);
      const before = approval ? approval.text : draft ? draft.text : '';
      appendEdit(ROOT, { review_id: id, before, after, correction_class: correctionClass, review });
      redirect(res, `/review/${encodeURIComponent(id)}?message=edit+stored`);
      return;
    }

    if (req.method === 'POST' && path === '/api/promote') {
      const result = propose(readEditLog(ROOT), PROPOSED_DIR);
      const relative = (file) => {
        if (!file.startsWith(ROOT)) return file;
        return file.slice(ROOT.endsWith('/') ? ROOT.length : ROOT.length + 1);
      };
      for (const file of result.files) {
        if (!file.endsWith('.test.mjs')) {
          const name = file.slice(file.lastIndexOf('/') + 1).replace(/\.mjs$/, '');
          store.recordProposal(
            name,
            relative(file),
            relative(file.replace(/\.mjs$/, '.test.mjs')),
          );
        }
      }
      redirect(res, `/rules?message=${encodeURIComponent(`PROPOSED ${result.count}`)}`);
      return;
    }

    if (req.method === 'POST' && path === '/api/install') {
      const body = await readBody(req);
      const name = String(body.get('name') || '').replace(/[^a-z0-9-]/g, '');
      const rule = join(PROPOSED_DIR, name + '.mjs');
      const test = join(PROPOSED_DIR, name + '.test.mjs');
      if (!name || !existsSync(rule) || !existsSync(test)) {
        redirect(res, '/rules?message=proposal+not+found');
        return;
      }
      copyFileSync(rule, join(RULES_DIR, name + '.mjs'));
      copyFileSync(test, join(RULES_DIR, name + '.test.mjs'));
      redirect(res, `/rules?message=${encodeURIComponent(`installed ${name}`)}`);
      return;
    }

    send(res, 404, layout({ title: 'Not found', active: '/', body: '<h2>Not found</h2><p><a href="/">Back to the queue</a></p>' }));
  } catch (error) {
    send(
      res,
      500,
      layout({
        title: 'Error',
        active: '/',
        body: `<h2>The request failed</h2><p class="text">${esc(error.message)}</p><p><a href="/">Back to the queue</a></p>`,
      }),
    );
  }
});

server.listen(PORT, 'localhost', () => {
  process.stdout.write(`Review desk on http://localhost:${PORT}\n`);
});
