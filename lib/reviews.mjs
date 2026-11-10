// The invented bakery and its reviews. Everything here is fiction: the business name, every
// reviewer, every staff member and every sentence. The same seed always writes the same file.
import { makeRng, pick, intBetween } from './rng.mjs';

export const BUSINESS = {
  name: 'Hearth and Crumb',
  kind: 'bakery',
  town: 'Willow Bay',
};

const ITEMS = [
  'sourdough',
  'rye loaf',
  'seeded loaf',
  'cinnamon roll',
  'butter croissant',
  'cardamom bun',
  'olive bread',
  'focaccia',
  'brownie',
  'flat white',
  'chai',
];

const TOPICS = ['product', 'service', 'order', 'wait', 'atmosphere', 'value'];

// Invented first names for reviewers. No real person is named here.
const REVIEWERS = [
  'Ana', 'Ben', 'Cleo', 'Dario', 'Elif', 'Farid', 'Gita', 'Hana', 'Ivo', 'Juno',
  'Kaito', 'Lena', 'Miro', 'Nia', 'Oren', 'Paloma', 'Quinn', 'Rosa', 'Sana', 'Tavi',
  'Uma', 'Vera', 'Wren', 'Xavi', 'Yara', 'Zeno', 'Alba', 'Boro', 'Cira', 'Dov',
  'Esme', 'Fia', 'Gus', 'Hoda', 'Ines', 'Joss', 'Kira', 'Lio', 'Mora', 'Nils',
  'Ola', 'Pia', 'Rami', 'Sol', 'Tino', 'Ulla', 'Vito', 'Wilma', 'Yannis', 'Zuri',
  'Amara', 'Bo', 'Cato', 'Dana', 'Emre', 'Fern', 'Gil', 'Hild', 'Isa', 'Koa',
];

// Invented staff. The surname is the value the no-staff-surname rule protects.
const STAFF = [
  { first: 'Nell', last: 'Marchetti' },
  { first: 'Ivo', last: 'Sandoval' },
  { first: 'Priya', last: 'Ravel' },
  { first: 'Marco', last: 'Delun' },
  { first: 'Tessa', last: 'Moreau' },
  { first: 'Rune', last: 'Kessler' },
  { first: 'Ada', last: 'Lindqvist' },
  { first: 'Omar', last: 'Fareed' },
];

const EN_POSITIVE = [
  (item) => `The ${item} was excellent and the room smelled like butter.`,
  (item) => `Best ${item} I have had in a long time, and the coffee was just right.`,
  (item) => `We came in for the ${item} and stayed for the light. Lovely place.`,
  (item) => `The ${item} was fresh and the team was kind. We will be back.`,
  (item) => `Everything we tried was good, especially the ${item}.`,
  (item) => `The ${item} made my morning. Simple, warm and well made.`,
];

const EN_MIXED = [
  (item) => `The ${item} was fine but the room was loud and the wait was long.`,
  (item) => `Good ${item}, though the coffee arrived cold and nobody checked on us.`,
  (item) => `The ${item} was lovely. The queue moved slowly and the tables were not cleared.`,
  (item) => `The ${item} was worth it, but the seats are cramped and the music is loud.`,
];

const EN_NEGATIVE = [
  (item) => `The ${item} was dry and the staff seemed rushed. I was disappointed.`,
  (item) => `We waited a long time for the ${item} and it was not worth it.`,
  (item) => `The ${item} was stale and the room felt tired.`,
  (item) => `My ${item} was cold when it reached the table and nobody came back.`,
];

const REFUND_TEXTS = [
  'I paid $18 for a celebration cake and it collapsed on the way home. I would like a refund.',
  'The loaf was mouldy when I cut it open. I want my money back.',
  'I was charged twice for one coffee. Please give me my money back.',
  'The cake was the wrong one and the party was that afternoon. I would like a refund.',
];

const ABUSIVE_TEXTS = [
  'This place is a joke and the staff are useless.',
  'What a waste of time. The whole counter moves like it does not care.',
  'I have never seen a bakery this badly run. Sort it out.',
  'The service was a disgrace and nobody seemed to care.',
];

const STAFF_TEXTS = [
  { staff: 0, rating: 5, topic: 'service', text: 'Nell Marchetti helped me choose a cake and she was patient and kind.' },
  { staff: 1, rating: 5, topic: 'service', text: 'Ivo Sandoval took my order and got everything right.' },
  { staff: 2, rating: 1, topic: 'service', text: 'Priya Ravel was rude when I asked about the bread.' },
  { staff: 3, rating: 5, topic: 'product', text: 'Marco Delun made the best flat white I have had here.' },
  { staff: 4, rating: 2, topic: 'service', text: 'Tessa Moreau forgot our order and did not apologise.' },
  { staff: 5, rating: 5, topic: 'service', text: 'Rune Kessler helped my mother to a table and was lovely.' },
  { staff: 6, rating: 2, topic: 'service', text: 'Ada Lindqvist was short with us at the counter.' },
  { staff: 7, rating: 4, topic: 'order', text: 'Omar Fareed fixed a mix up with our order quickly.' },
];

const ES_REVIEWS = [
  { rating: 5, topic: 'product', text: 'El pan de centeno estaba delicioso y el trato fue muy amable.' },
  { rating: 4, topic: 'product', text: 'El cafe estaba perfecto y el lugar es tranquilo.' },
  { rating: 5, topic: 'product', text: 'Las tartas son increibles y el equipo es encantador.' },
  { rating: 3, topic: 'wait', text: 'El pan estaba bueno pero la espera fue larga y la mesa estaba sucia.' },
  { rating: 2, topic: 'product', text: 'El cafe llego frio y nadie nos atendio, aunque el pan estaba rico.' },
  { rating: 1, topic: 'service', text: 'El pan estaba seco y el trato fue frio. No vuelvo.' },
  { rating: 2, topic: 'order', text: 'Esperamos mucho y el pedido llego mal. Muy decepcionante.' },
  { rating: 4, topic: 'atmosphere', text: 'El lugar es bonito y el pan esta muy bueno, aunque hay poca mesa.' },
];

const RATING_CYCLE = [5, 4, 5, 3, 4, 2, 5, 4, 1, 3];

function makeReview(index, rating, language, reviewer, text, topics, staff, flags) {
  return {
    id: 'rd-' + String(index).padStart(4, '0'),
    rating,
    language,
    reviewer,
    text,
    topics,
    staff,
    flags,
  };
}

export function generate(seed = 7) {
  const rng = makeRng(seed);
  const reviews = [];
  let index = 1;

  for (let i = 0; i < 100; i += 1) {
    const rating = RATING_CYCLE[i % RATING_CYCLE.length];
    const topic = TOPICS[(i + rating) % TOPICS.length];
    const item = pick(rng, ITEMS);
    const reviewer = pick(rng, REVIEWERS);
    const bank = rating >= 4 ? EN_POSITIVE : rating === 3 ? EN_MIXED : EN_NEGATIVE;
    const text = pick(rng, bank)(item);
    reviews.push(makeReview(index, rating, 'en', reviewer, text, [topic], [], []));
    index += 1;
  }

  for (const row of ES_REVIEWS) {
    const reviewer = pick(rng, REVIEWERS);
    reviews.push(makeReview(index, row.rating, 'es', reviewer, row.text, [row.topic], [], ['non-english']));
    index += 1;
  }

  for (const row of STAFF_TEXTS) {
    const reviewer = pick(rng, REVIEWERS);
    const member = STAFF[row.staff];
    reviews.push(makeReview(
      index,
      row.rating,
      'en',
      reviewer,
      row.text,
      [row.topic],
      [{ first: member.first, last: member.last }],
      ['staff-named'],
    ));
    index += 1;
  }

  for (const text of REFUND_TEXTS) {
    const reviewer = pick(rng, REVIEWERS);
    const rating = intBetween(rng, 1, 2);
    reviews.push(makeReview(index, rating, 'en', reviewer, text, ['order'], [], ['refund']));
    index += 1;
  }

  for (const text of ABUSIVE_TEXTS) {
    const reviewer = pick(rng, REVIEWERS);
    reviews.push(makeReview(index, 1, 'en', reviewer, text, ['service'], [], ['abusive']));
    index += 1;
  }

  return {
    business: { name: BUSINESS.name, kind: BUSINESS.kind, town: BUSINESS.town },
    seed,
    reviews,
  };
}
