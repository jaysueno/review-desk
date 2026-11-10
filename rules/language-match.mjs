// The reply is written in the review's language, with no second language above a fifth of its
// scored words. Six stopword lists: English, Spanish, French, German, Italian and Portuguese.
// It fails closed: a text whose language cannot be recognised is refused for a person to check.
// This is a hard zero.
export const id = 'language-match';
export const kind = 'hard-zero';
export const description = 'The reply language matches the review, with no second language over 20 percent. Fails closed when a text cannot be recognised.';

const ENGLISH = [
  'the', 'and', 'is', 'are', 'was', 'were', 'you', 'your', 'we', 'our', 'us', 'for', 'with',
  'this', 'that', 'thank', 'thanks', 'sorry', 'please', 'hope', 'glad', 'have', 'not', 'but',
  'from', 'at', 'on', 'to', 'of', 'it', 'its', 'they', 'them', 'their', 'she', 'will', 'would',
  'can', 'could', 'did', 'does', 'so', 'very', 'more', 'just', 'about', 'again', 'every', 'each',
  'some', 'any', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'read', 'hear', 'tell',
  'told', 'visit', 'team', 'words', 'kind', 'wonderful', 'lovely', 'fresh', 'love', 'loved',
  'enjoy', 'enjoyed', 'best', 'great', 'good', 'day', 'morning', 'soon', 'next', 'time', 'want',
  'like', 'make', 'made', 'come', 'came', 'get', 'got', 'give', 'gave', 'take', 'took', 'see',
  'saw', 'know', 'think', 'look', 'working', 'work', 'am', 'me', 'my',
];

const SPANISH = [
  'el', 'los', 'las', 'una', 'unos', 'unas', 'del', 'al', 'que', 'en', 'por', 'para', 'con',
  'sin', 'muy', 'gracias', 'pero', 'nos', 'te', 'tus', 'esta', 'estan', 'estaba', 'esperamos',
  'sentimos', 'alegra', 'contarnos', 'contarnoslo', 'visita', 'pronto', 'equipo', 'palabras',
  'pedido', 'pan', 'trato', 'amable', 'delicioso', 'gustado', 'gusto', 'gustara', 'haya', 'cada',
  'todo', 'siempre', 'cuando', 'donde', 'porque', 'tambien', 'mejor', 'mucho', 'poco', 'bien',
  'mal', 'les', 'nosotros', 'ellos', 'ella', 'hemos', 'han', 'hay', 'tiene', 'tienen', 'puedes',
  'puede', 'pueden', 'queremos', 'quiero', 'nuestro', 'nuestra', 'lugar', 'tranquilo', 'rico',
  'seco', 'frio', 'llego', 'atendio', 'revisaremos', 'revisara', 'detalles', 'persona',
  'escucharlo', 'preferimos', 'leera', 'su', 'sus', 'lo', 'damos', 'paciencia', 'avisarnos',
  'ocurrido', 'semana',
];

const FRENCH = [
  'merci', 'votre', 'vos', 'vous', 'nous', 'notre', 'nos', 'leur', 'leurs', 'sommes', 'etes',
  'sont', 'etait', 'etre', 'avons', 'avez', 'ont', 'peut', 'peuvent', 'voulons', 'veux',
  'toujours', 'quand', 'ou', 'parce', 'aussi', 'encore', 'deja', 'mais', 'beaucoup', 'peu',
  'bien', 'mal', 'bon', 'bonne', 'mauvais', 'pain', 'commande', 'equipe', 'visite', 'bientot',
  'lieu', 'tranquille', 'savoureux', 'sec', 'froid', 'arrive', 'servi', 'revision', 'details',
  'personne', 'ecouter', 'preferons', 'lira', 'desole', 'desolee', 'pardon', 'bonjour', 'salut',
  'pour', 'avec', 'dans', 'sur', 'pas', 'ne', 'plus', 'tres', 'comment', 'pourquoi', 'hui',
  'demain', 'hier', 'maintenant', 'fois', 'jour', 'semaine', 'matin', 'soir',
];

const GERMAN = [
  'der', 'die', 'das', 'und', 'ist', 'sind', 'war', 'waren', 'nicht', 'mit', 'fur', 'auf',
  'von', 'zu', 'den', 'dem', 'des', 'ein', 'eine', 'einen', 'einem', 'einer', 'wir', 'sie',
  'ich', 'du', 'ihr', 'unser', 'unsere', 'haben', 'hat', 'habe', 'kann', 'konnen', 'sehr',
  'danke', 'entschuldigung', 'leider', 'gerne', 'wieder', 'heute', 'morgen', 'immer', 'wenn',
  'wo', 'weil', 'auch', 'noch', 'schon', 'aber', 'oder', 'mehr', 'viel', 'gut', 'schlecht',
  'brot', 'bestellung', 'bitte',
];

const ITALIAN = [
  'il', 'gli', 'della', 'delle', 'degli', 'che', 'per', 'nel', 'nella', 'sono', 'molto',
  'grazie', 'scusa', 'scusate', 'siamo', 'speriamo', 'sentiamo', 'squadra', 'parole', 'ordine',
  'pane', 'posto', 'presto', 'sempre', 'quando', 'dove', 'anche', 'ancora', 'adesso', 'oggi',
  'domani', 'migliore', 'bene', 'male', 'noi', 'loro', 'lei', 'lui', 'abbiamo', 'hanno', 'puo',
  'possono', 'vogliamo', 'voglio', 'nostro', 'nostra', 'luogo', 'tranquillo', 'secco', 'freddo',
  'arrivato', 'servito', 'revisione', 'dettagli', 'ascoltarlo', 'preferiamo', 'leggera',
];

const PORTUGUESE = [
  'nao', 'com', 'uma', 'um', 'dos', 'das', 'do', 'da', 'em', 'ao', 'aos', 'e', 'sao', 'foi',
  'ser', 'estar', 'esta', 'estamos', 'muito', 'bem', 'mais', 'mas', 'tambem', 'quando', 'onde',
  'sempre', 'melhor', 'pouco', 'pessoa', 'obrigado', 'obrigada', 'desculpe', 'equipe', 'pao',
  'detalhes', 'gostei', 'gostado', 'amavel', 'nosso', 'nossa', 'eles', 'elas', 'voce', 'voces',
  'seu', 'sua', 'seus', 'suas', 'tem', 'ha', 'pode', 'podem', 'queremos', 'quero', 'vamos',
  'resolver', 'isso', 'breve', 'contar', 'atenciosamente',
];

const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese',
};

const SETS = Object.fromEntries(
  Object.entries({ en: ENGLISH, es: SPANISH, fr: FRENCH, de: GERMAN, it: ITALIAN, pt: PORTUGUESE })
    .map(([code, words]) => [code, new Set(words)]),
);

const COMBINING = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

function tokens(text) {
  return String(text == null ? '' : text)
    .normalize('NFKC')
    .normalize('NFKD')
    .replace(COMBINING, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

export function scoreLanguage(text) {
  const counts = { en: 0, es: 0, fr: 0, de: 0, it: 0, pt: 0 };
  let total = 0;
  for (const token of tokens(text)) {
    for (const code of Object.keys(counts)) {
      if (SETS[code].has(token)) {
        counts[code] += 1;
        total += 1;
      }
    }
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = ranked[0][1] > 0 ? ranked[0][0] : '';
  const second = ranked[1][1];
  return {
    counts,
    top,
    total,
    secondLang: second > 0 ? ranked[1][0] : '',
    secondShare: total > 0 ? second / total : 0,
  };
}

function baseLanguage(value) {
  return String(value == null ? 'en' : value).toLowerCase().split('-')[0];
}

export function check(review, draft) {
  const expected = baseLanguage(review && review.language);
  const reviewScore = scoreLanguage(review && review.text);
  const replyScore = scoreLanguage(draft);
  if (!reviewScore.top || !replyScore.top) {
    return { pass: false, reason: 'language not recognised, a person must check' };
  }
  if (replyScore.top !== expected || reviewScore.top !== expected) {
    const found = LANGUAGE_NAMES[replyScore.top] || replyScore.top;
    const want = LANGUAGE_NAMES[expected] || expected;
    return { pass: false, reason: `the reply reads as ${found} while the review is in ${want}` };
  }
  if (replyScore.secondShare > 0.2) {
    const other = LANGUAGE_NAMES[replyScore.secondLang] || replyScore.secondLang;
    const main = LANGUAGE_NAMES[replyScore.top] || replyScore.top;
    return {
      pass: false,
      reason: `the reply mixes ${main} and ${other}: ${Math.round(replyScore.secondShare * 100)} percent of its scored words are ${other}`,
    };
  }
  return { pass: true, reason: '' };
}
