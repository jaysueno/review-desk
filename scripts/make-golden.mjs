#!/usr/bin/env node
// Writes evals/golden.json. The cases are invented, the reviewer names come from the seed, and the
// output is the same every run. A test regenerates it and compares bytes.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { makeRng, pick } from '../lib/rng.mjs';
import { parseFlags, failUsage } from '../lib/cli.mjs';

const REVIEWERS = [
  'Mara', 'Tobin', 'Kai', 'Sena', 'Dov', 'Pilar', 'Koa', 'Ines', 'Lucia', 'Tavi',
  'Rosa', 'Nia', 'Oren', 'Uma', 'Zeno', 'Alba', 'Boro', 'Cira', 'Esme', 'Fia',
  'Gus', 'Hoda', 'Joss', 'Kira', 'Lio', 'Mora', 'Nils', 'Ola', 'Pia', 'Rami',
  'Sol', 'Tino',
];

const CASES = [
  { rating: 5, language: 'en', topics: ['product'], staff: [], flags: [], text: 'The sourdough was warm and the crust was perfect. I came back the next day for another loaf.', approved: 'Thank you for the kind words about the sourdough. We are glad it made your morning.' },
  { rating: 2, language: 'en', topics: ['order'], staff: [], flags: [], text: 'My order was missing the cardamom buns and nobody called me back.', approved: 'I am sorry the cardamom buns were missing from your order. Thank you for telling us, and the team will look into it.' },
  { rating: 5, language: 'en', topics: ['service'], staff: [{ first: 'Nell', last: 'Marchetti' }], flags: ['staff-named'], text: 'Nell Marchetti helped me choose a cake and was patient with my questions.', approved: 'Thank you for the kind words about Nell. We will pass them on to her.' },
  { rating: 1, language: 'en', topics: ['wait'], staff: [], flags: [], text: 'I waited almost an hour for a flat white and the room was packed.', approved: 'I am sorry about the long wait for your flat white. Thank you for your patience, and we are working on the morning rush.' },
  { rating: 3, language: 'en', topics: ['atmosphere'], staff: [], flags: [], text: 'The room is pretty but the tables were sticky and the music was loud.', approved: 'Thank you for the honest note. We are sorry the room did not feel right, and we will look at the tables and the music.' },
  { rating: 2, language: 'en', topics: ['order'], staff: [], flags: ['refund'], text: 'I paid $21 for a cake and it arrived damaged. I would like a refund.', approved: 'I am sorry the cake arrived damaged. Thank you for the details; please talk with us at the counter so we can hear more.' },
  { rating: 1, language: 'en', topics: ['service'], staff: [], flags: ['abusive'], text: 'This counter is a joke and nobody seems to care.', approved: 'I am sorry to read this. We would rather hear it directly, and the team will read every word.' },
  { rating: 4, language: 'en', topics: ['value'], staff: [], flags: [], text: 'The bread is good and the prices feel fair for the size.', approved: 'Thank you for the kind words about the value. We are glad the visit felt fair and hope to see you again.' },
  { rating: 5, language: 'es', topics: ['product'], staff: [], flags: ['non-english'], text: 'El pan de centeno estaba delicioso y el trato fue muy amable.', approved: 'Gracias por las palabras sobre el pan. Nos alegra que te gustara y esperamos verte pronto por aqui.' },
  { rating: 2, language: 'es', topics: ['service'], staff: [], flags: ['non-english'], text: 'El trato fue frio y nadie nos atendio.', approved: 'Sentimos que el trato no estuviera a la altura. Gracias por contarnoslo y el equipo lo revisara.' },
  { rating: 4, language: 'es', topics: ['order'], staff: [], flags: ['non-english'], text: 'El pedido llego bien y el pan estaba rico.', approved: 'Gracias por contarnos tu visita. Nos alegra que el pedido llegara bien y esperamos verte de nuevo.' },
  { rating: 1, language: 'es', topics: ['wait'], staff: [], flags: ['non-english'], text: 'La espera fue muy larga y el cafe llego frio.', approved: 'Sentimos la espera tan larga. Gracias por la paciencia y estamos trabajando en las mananas.' },
  { rating: 4, language: 'en', topics: ['product'], staff: [], flags: [], text: 'The focaccia was soft and the olive bread sold out before noon.', approved: 'Thank you for the kind words about the focaccia. We are glad the bake landed well and hope to see you soon.' },
  { rating: 2, language: 'en', topics: ['product'], staff: [], flags: [], text: 'The seeded loaf was dry and the brownie was stale.', approved: 'I am sorry the seeded loaf was dry. Thank you for telling us and the team will check the bake.' },
  { rating: 5, language: 'en', topics: ['atmosphere'], staff: [], flags: [], text: 'The light in the room is lovely and the coffee was just right.', approved: 'Thank you for the kind words about the room. We are glad the light and the coffee felt right.' },
  { rating: 3, language: 'es', topics: ['atmosphere'], staff: [], flags: ['non-english'], text: 'El lugar es bonito pero la mesa estaba sucia y la musica muy alta.', approved: 'Gracias por la nota honesta. Sentimos que el lugar no fuera agradable y revisaremos lo que nos cuentas.' },
];

export function buildGolden(seed = 7) {
  const rng = makeRng(seed);
  const cases = CASES.map((spec, index) => ({
    review: {
      id: 'g-' + String(index + 1).padStart(2, '0'),
      rating: spec.rating,
      language: spec.language,
      reviewer: pick(rng, REVIEWERS),
      text: spec.text,
      topics: spec.topics,
      staff: spec.staff,
      flags: spec.flags,
    },
    approved: spec.approved,
  }));
  return { cases };
}

const USAGE = 'usage: node scripts/make-golden.mjs [--seed 7] [--out evals/golden.json]';

if (process.argv[1] && process.argv[1].endsWith('make-golden.mjs')) {
  let flags;
  try {
    flags = parseFlags(process.argv.slice(2), [], ['seed', 'out']);
  } catch (error) {
    failUsage(error.message, USAGE);
  }
  const seed = flags.seed === undefined ? 7 : Number(flags.seed);
  if (!Number.isInteger(seed)) failUsage('--seed must be an integer', USAGE);
  const out = flags.out || 'evals/golden.json';
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(buildGolden(seed), null, 2) + '\n');
  process.stdout.write(`wrote ${out}\n`);
}
