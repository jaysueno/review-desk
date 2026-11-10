// SQLite storage for the web app. The database lives under data/ and never ships.
// node:sqlite needs Node 22.5 or newer. The command line loop does not touch this module, so it
// still runs on Node 20.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  rating INTEGER NOT NULL,
  language TEXT NOT NULL,
  reviewer TEXT NOT NULL,
  text TEXT NOT NULL,
  topics TEXT NOT NULL,
  staff TEXT NOT NULL,
  flags TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS drafts (
  review_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  pass INTEGER NOT NULL,
  rule TEXT NOT NULL,
  reason TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS approvals (
  review_id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS proposals (
  name TEXT PRIMARY KEY,
  rule_path TEXT NOT NULL,
  test_path TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

function now() {
  return new Date().toISOString();
}

function reviewFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    rating: row.rating,
    language: row.language,
    reviewer: row.reviewer,
    text: row.text,
    topics: JSON.parse(row.topics),
    staff: JSON.parse(row.staff),
    flags: JSON.parse(row.flags),
  };
}

export async function openStore(dataDir) {
  let sqlite;
  try {
    sqlite = await import('node:sqlite');
  } catch {
    throw new Error('the web app needs node:sqlite, which ships with Node 22.5 or newer');
  }
  mkdirSync(dataDir, { recursive: true });
  const db = new sqlite.DatabaseSync(join(dataDir, 'review-desk.db'));
  db.exec(SCHEMA);

  const insertReview = db.prepare(
    'INSERT OR IGNORE INTO reviews (id, rating, language, reviewer, text, topics, staff, flags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const selectReview = db.prepare('SELECT * FROM reviews WHERE id = ?');
  const selectReviews = db.prepare('SELECT * FROM reviews ORDER BY id');
  const countReviews = db.prepare('SELECT COUNT(*) AS n FROM reviews');
  const upsertDraft = db.prepare(
    'INSERT INTO drafts (review_id, text, pass, rule, reason, updated_at) VALUES (?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(review_id) DO UPDATE SET text = excluded.text, pass = excluded.pass, ' +
      'rule = excluded.rule, reason = excluded.reason, updated_at = excluded.updated_at',
  );
  const selectDraft = db.prepare('SELECT * FROM drafts WHERE review_id = ?');
  const selectDrafts = db.prepare('SELECT * FROM drafts');
  const upsertApproval = db.prepare(
    'INSERT INTO approvals (review_id, text, updated_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT(review_id) DO UPDATE SET text = excluded.text, updated_at = excluded.updated_at',
  );
  const selectApproval = db.prepare('SELECT * FROM approvals WHERE review_id = ?');
  const upsertProposal = db.prepare(
    'INSERT INTO proposals (name, rule_path, test_path, created_at) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(name) DO UPDATE SET rule_path = excluded.rule_path, ' +
      'test_path = excluded.test_path, created_at = excluded.created_at',
  );
  const selectProposals = db.prepare('SELECT * FROM proposals ORDER BY name');

  function putDraft(reviewId, text, verdict) {
    upsertDraft.run(
      reviewId,
      text,
      verdict.pass ? 1 : 0,
      verdict.rule || '',
      verdict.reason || '',
      now(),
    );
  }

  return {
    close() {
      db.close();
    },
    countReviews() {
      return countReviews.get().n;
    },
    addReview(review) {
      insertReview.run(
        review.id,
        review.rating,
        review.language,
        review.reviewer,
        review.text,
        JSON.stringify(review.topics || []),
        JSON.stringify(review.staff || []),
        JSON.stringify(review.flags || []),
      );
    },
    getReview(id) {
      return reviewFromRow(selectReview.get(id));
    },
    listReviews() {
      return selectReviews.all().map(reviewFromRow);
    },
    putDraft,
    getDraft(id) {
      return selectDraft.get(id) || null;
    },
    listDrafts() {
      return selectDrafts.all();
    },
    approve(reviewId, text) {
      upsertApproval.run(reviewId, text, now());
    },
    getApproval(id) {
      return selectApproval.get(id) || null;
    },
    recordProposal(name, rulePath, testPath) {
      upsertProposal.run(name, rulePath, testPath, now());
    },
    listProposals() {
      return selectProposals.all();
    },
  };
}
