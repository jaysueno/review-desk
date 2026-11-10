// Builds the README hero image. Node built-ins only. Same script, same bytes: no clock, no
// randomness, no network. Run from the repo root: node docs/img/make.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));

const NAVY = '#001B3B';
const SAND = '#EDE7DC';
const TERRACOTTA = '#8C5348';
const OLIVE = '#59591D';
const HEAD = '#F2EDE2';
const SUB = '#D8D3CA';
const SERIF = "Georgia, 'Playfair Display', serif";
const SANS = "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif";

const W = 1200;
const H = 460;

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function text(x, y, value, options = {}) {
  const parts = [
    `x="${x}"`,
    `y="${y}"`,
    `font-family="${options.serif ? SERIF : SANS}"`,
    `font-size="${options.size || 16}"`,
  ];
  if (options.bold) parts.push('font-weight="700"');
  if (options.anchor) parts.push(`text-anchor="${options.anchor}"`);
  parts.push(`fill="${options.fill || SUB}"`);
  return `<text ${parts.join(' ')}>${esc(value)}</text>`;
}

function box(x, y, w, h, options = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${
    options.fill || 'none'
  }" stroke="${options.stroke || SAND}" stroke-width="1"/>`;
}

function arrow(x1, x2, y) {
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${TERRACOTTA}" stroke-width="2"/>
<polygon points="${x2},${y} ${x2 - 10},${y - 6} ${x2 - 10},${y + 6}" fill="${TERRACOTTA}"/>`;
}

const STAGES = [
  { title: 'Draft', line1: 'Template or model', line2: 'last approved edits' },
  { title: 'Gate', line1: 'six rule modules', line2: 'hard zeros stop it' },
  { title: 'Edit', line1: 'a person decides', line2: 'before and after stored' },
  { title: 'Promote', line1: 'three edits of one class', line2: 'a rule and its test' },
  { title: 'Eval', line1: 'approved set replayed', line2: 'no lower pass rate' },
];

export function render() {
  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">`);
  parts.push('<title>The review desk loop</title>');
  parts.push(
    '<desc>A draft passes six gates, a person edits it, three edits of one correction class become a rule with its test, and the eval replays the approved set so the pass rate never drops.</desc>',
  );
  parts.push(box(1, 1, W - 2, H - 2, { fill: NAVY, stroke: SAND }));
  parts.push(text(50, 66, 'The review desk loop', { serif: true, size: 34, fill: HEAD }));
  parts.push(
    text(50, 100, 'A draft, a gate, a person, a rule. The edit is stored and the rule is tested.', {
      size: 16,
      fill: SUB,
    }),
  );

  const boxW = 200;
  const boxH = 132;
  const y = 150;
  let x = 50;
  STAGES.forEach((stage, index) => {
    parts.push(box(x, y, boxW, boxH, { stroke: SAND }));
    parts.push(text(x + 18, y + 38, stage.title, { serif: true, size: 24, fill: HEAD }));
    parts.push(text(x + 18, y + 72, stage.line1, { size: 14, fill: SUB }));
    parts.push(text(x + 18, y + 94, stage.line2, { size: 14, fill: SUB }));
    parts.push(`<circle cx="${x + 18}" cy="${y + boxH - 22}" r="5" fill="${
      index === 1 ? TERRACOTTA : index === 2 ? OLIVE : SAND
    }"/>`);
    if (index < STAGES.length - 1) parts.push(arrow(x + boxW + 6, x + boxW + 22, y + boxH / 2));
    x += boxW + 25;
  });

  parts.push(text(50, 356, 'Every edit is data. Every repeated edit is a rule.', { serif: true, size: 22, fill: TERRACOTTA }));
  parts.push(
    text(50, 392, 'The gate never hides a refusal: a failed draft is shown with its reason.', {
      size: 15,
      fill: SUB,
    }),
  );
  parts.push('</svg>');
  return parts.join('\n') + '\n';
}

const target = join(OUT, 'loop.svg');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(target, render());
  process.stdout.write(`wrote ${target}\n`);
}
