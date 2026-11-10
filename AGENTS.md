# AGENTS.md

Instructions for an AI agent working in this repo.

## Install

```bash
npm ci
```

Node 20 or newer. There are no runtime dependencies. The web app uses `node:sqlite`, which needs
Node 22.5 or newer. The command line loop runs on Node 20.

## Run

```bash
npm start                                       # the app on localhost, PORT (default 3000)
node scripts/generate-reviews.mjs --seed 7 --out data/reviews.json
node scripts/draft.mjs --reviews data/reviews.json --out data/drafts.json
node scripts/gate.mjs --review <review.json> --draft <draft.txt>
node scripts/promote.mjs --edits data/edits.json --out data/proposed
```

## Test

```bash
npm test
npm run eval
```

CI runs `npm test` and `npm run eval` on Node 20 and Node 22. Every test is offline and uses the
invented set.

## Where you may edit

- `rules/`, `lib/`, `scripts/`, `ui/`, `test/`: code and its tests. A new rule needs a failing case
  and a passing one.
- `docs/img/loop.svg`: only through `node docs/img/make.mjs`.
- `evals/golden.json`: only through `node scripts/make-golden.mjs`, and the regenerated file is
  committed with the change. `evals/baseline.json` moves only when a deliberate change improves the
  approved set, and the change says why. Never lower the baseline to make a run pass.
- `README.md` and `AGENTS.md`: plain technical prose.

## Where you may not edit

- The first section of `README.md` (the story under the title) is the owner's words. Leave it.
- `LICENSE`.
- `data/`: it is generated and ignored by git. `data/edits.json` is the one edit log the app, the
  drafter and promotion share. Do not add a second edit store.

## Never

- Never post a reply anywhere, add a network call to a publishing service, or send a review to an
  external service.
- Never add a real review, a real person, a real address or a real business. The generator invents
  everything from a seed.
- Never weaken a hard-zero rule, remove a test, or raise the eval baseline to pass a regression.
- Never write a numeric loopback address. Use `localhost`.
- Never use em dashes in prose.
- Never commit `data/` or `node_modules/`.

## Before each commit

Run `npm test` and `npm run eval`, then the identity scan from your private QA tooling. Both must
pass before the commit.
