// Plain HTML for the three surfaces. No framework, no client-side build step.

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function nav(active) {
  const items = [
    ['/', 'Queue'],
    ['/rules', 'Rules'],
    ['/eval', 'Eval'],
  ];
  return items
    .map(([href, label]) => {
      const cls = active === href ? ' class="on"' : '';
      return `<a href="${href}"${cls}>${label}</a>`;
    })
    .join('');
}

export function layout({ title, active, body, message }) {
  const banner = message ? `<div class="banner">${esc(message)}</div>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | Review desk</title>
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header>
  <div class="inner">
    <h1>Review desk</h1>
    <nav>${nav(active)}</nav>
  </div>
</header>
<main class="wrap">
${banner}
${body}
</main>
</body>
</html>
`;
}

function statusLine(draft) {
  if (!draft) return '<div class="status">No draft yet</div>';
  if (draft.pass) return '<div class="status ok">PASS every rule</div>';
  return `<div class="status bad">FAIL ${esc(draft.rule)}: ${esc(draft.reason)}</div>`;
}

export function queuePage({ reviews, drafts, page = 1, pages = 1, total = reviews.length }) {
  const rows = reviews
    .map((review) => {
      const draft = drafts.get(review.id);
      const draftText = draft ? draft.text : 'No draft yet.';
      return `<article class="card queue-row">
  <div>
    <div class="rating">${review.rating}/5</div>
    <div class="meta">${esc(review.language)}</div>
    <div class="meta">${esc(review.reviewer)}</div>
  </div>
  <div>
    <div class="meta">Review ${esc(review.id)}</div>
    <div class="text">${esc(review.text)}</div>
  </div>
  <div>
    <div class="meta">Draft</div>
    <div class="text">${esc(draftText)}</div>
    ${statusLine(draft)}
    <a class="button secondary" href="/review/${encodeURIComponent(review.id)}">Open</a>
  </div>
</article>`;
    })
    .join('\n');

  const previous = page > 1
    ? `<a class="button secondary" href="/?page=${page - 1}">Previous</a>`
    : '';
  const next = page < pages
    ? `<a class="button secondary" href="/?page=${page + 1}">Next</a>`
    : '';

  return layout({
    title: 'Queue',
    active: '/',
    body: `<h2>Review queue</h2>
<p class="lead">${total} invented reviews from the bakery, ${reviews.length} per page. Each row shows the review, the draft and the gate result. A failed draft is refused here, before a person sees it in the edit view.</p>
${rows}
<p class="meta">Page ${page} of ${pages}</p>
${previous}${next}`,
  });
}

function verdictStatus(verdict) {
  if (!verdict) return '<div class="status">No gate result</div>';
  if (verdict.pass) return '<div class="status ok">PASS every rule</div>';
  return `<div class="status bad">FAIL ${esc(verdict.rule)}: ${esc(verdict.reason)}</div>`;
}

export function editPage({ review, draft, approval, edits, beforeVerdict, currentVerdict, message }) {
  const before = approval ? approval.text : draft ? draft.text : '';
  const lastEdit = edits.length ? edits[edits.length - 1] : null;
  const starting = lastEdit ? lastEdit.after : draft ? draft.text : before;
  const history = edits
    .map(
      (row) => `<li>
  <div class="meta">${esc(row.correction_class)}</div>
  <div><strong>Before</strong></div>
  <div class="text">${esc(row.before)}</div>
  <div><strong>After</strong></div>
  <div class="text">${esc(row.after)}</div>
</li>`,
    )
    .join('');

  return layout({
    title: review.id,
    active: '/',
    message,
    body: `<p><a href="/">Back to the queue</a></p>
<h2>Review ${esc(review.id)}</h2>
<p class="meta">${review.rating}/5, ${esc(review.language)}, from ${esc(review.reviewer)}, topics ${esc(
      (review.topics || []).join(', '),
    )}${review.flags && review.flags.length ? ', flags ' + esc(review.flags.join(', ')) : ''}</p>
<div class="card">
  <div class="meta">Review</div>
  <div class="text">${esc(review.text)}</div>
</div>

<div class="split">
  <div class="card">
    <h3>Before: the approved draft</h3>
    <div class="text">${esc(before)}</div>
    <div class="meta">Gate result for this text</div>
    ${verdictStatus(beforeVerdict)}
  </div>
  <div class="card">
    <h3>After: your edit</h3>
    <form method="post" action="/api/edit">
      <input type="hidden" name="review_id" value="${esc(review.id)}">
      <textarea id="reply-text" name="after" aria-label="Your edited reply">${esc(starting)}</textarea>
      <input type="text" name="correction_class" value="${lastEdit ? esc(lastEdit.correction_class) : 'apology-first'}" aria-label="Correction class">
      <button type="submit">Save edit</button>
      <button type="submit" formaction="/api/approve" class="confirm">Approve this text</button>
    </form>
    <form method="post" action="/api/draft">
      <input type="hidden" name="review_id" value="${esc(review.id)}">
      <button type="submit" class="secondary">Draft again</button>
    </form>
    <div class="meta">Gate result for the text in the box</div>
    <div id="gate-status">${verdictStatus(currentVerdict)}</div>
  </div>
</div>

<h3>Stored edits for this review</h3>
${history ? `<ul class="history">${history}</ul>` : '<p>No edits stored yet. Saving one stores the before and the after.</p>'}

<h3>Promotion</h3>
<p class="lead">One correction class that appears three times can become a rule. The rules page shows the proposed module and its test.</p>
<form method="post" action="/api/promote">
  <button type="submit">Look for a rule to promote</button>
</form>
<script>
(() => {
  const box = document.getElementById('reply-text');
  const out = document.getElementById('gate-status');
  const reviewId = ${JSON.stringify(review.id)};
  if (!box || !out) return;
  let timer = null;
  function paint(value) {
    out.innerHTML = '';
    const line = document.createElement('div');
    line.className = 'status ' + (value && value.pass ? 'ok' : 'bad');
    line.textContent = value && value.pass
      ? 'PASS every rule'
      : 'FAIL ' + String(value && value.rule) + ': ' + String(value && value.reason);
    out.appendChild(line);
  }
  box.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        const url = '/api/gate?review_id=' + encodeURIComponent(reviewId) + '&text=' + encodeURIComponent(box.value);
        const response = await fetch(url);
        paint(await response.json());
      } catch (error) {}
    }, 250);
  });
})();
</script>`,
  });
}

export function rulesPage({ rules, ruleFiles, proposals, message }) {
  const rows = rules
    .map(
      (rule) => `<tr>
  <td><code>${esc(rule.id)}</code></td>
  <td>${esc(rule.kind)}</td>
  <td>${esc(rule.description)}</td>
</tr>`,
    )
    .join('');

  const extra = ruleFiles.filter((name) => !rules.some((rule) => name === rule.id + '.mjs'));

  const proposed = proposals.length
    ? proposals
        .map(
          (item) => `<div class="card">
  <h3>${esc(item.name)}</h3>
  <p class="meta">${esc(item.rule_path)}</p>
  <p class="meta">${esc(item.test_path)}</p>
  <pre>${esc(item.preview)}</pre>
  <form method="post" action="/api/install">
    <input type="hidden" name="name" value="${esc(item.name)}">
    <button type="submit" class="confirm">Install this rule</button>
  </form>
</div>`,
        )
        .join('')
    : '<p>No proposal yet. Three edits of one correction class produce one.</p>';

  return layout({
    title: 'Rules',
    active: '/rules',
    message,
    body: `<h2>Rules every draft must pass</h2>
<p class="lead">Each rule is one module in <code>rules/</code>. A hard-zero rule can never be approved around. The gate stops at the first failure and shows that one reason.</p>
<table>
  <thead><tr><th>Id</th><th>Kind</th><th>What it checks</th></tr></thead>
  <tbody>${rows}</tbody>
</table>
<h3>Rule modules on disk</h3>
<p class="lead">${ruleFiles.length} module(s) in <code>rules/</code>${
      extra.length ? ': ' + esc(extra.join(', ')) : ', the six above.'
    }</p>
<h2>Proposed rules</h2>
${proposed}`,
  });
}

export function evalPage({ result, verdict }) {
  const line = verdict.ok
    ? `EVAL PASS ${result.rate.toFixed(2)}`
    : `EVAL FAIL ${verdict.reason}`;
  return layout({
    title: 'Eval',
    active: '/eval',
    body: `<h2>Eval</h2>
<p class="lead">The approved set is replayed through the current drafter and the current gates. The run fails on a lower pass rate or any hard-zero hit.</p>
<div class="card">
  <div class="text">${esc(line)}</div>
  <p class="meta">${result.passed} of ${result.total} drafts through every gate. Baseline ${Number(
      result.baseline,
    ).toFixed(2)}. Hard-zero hits ${result.hardZero}. Number tokens outside a review ${result.numbersOutside}.</p>
</div>`,
  });
}
