// A reply may state only numbers the review itself states. Digits and number words both count,
// and fullwidth digits are normalised first. A number word may match the same word or the same
// value in digits; a digit may match the same digits or the same value as a word.
export const id = 'numbers-from-review';
export const kind = 'gate';
export const description = 'Every digit and number word in the reply appears in the review as the same word or value.';

// "one" is left out on purpose: in a reply it is nearly always a pronoun ("your next one"),
// and a rule that fails ordinary sentences gets switched off.
const WORD_VALUES = {
  zero: 0, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000, dozen: 12,
  half: 0.5,
};

export function normalize(text) {
  return String(text == null ? '' : text).normalize('NFKC').toLowerCase();
}

export function digitTokens(text) {
  const found = normalize(text).match(/\d+/g);
  return found || [];
}

function wordTokens(text) {
  const found = normalize(text).match(/[a-z]+/g);
  return (found || []).filter((word) => Object.prototype.hasOwnProperty.call(WORD_VALUES, word));
}

function tokens(text) {
  const out = [];
  const value = normalize(text);
  const pattern = /\d+|[a-z]+/g;
  let match;
  while ((match = pattern.exec(value)) !== null) {
    const raw = match[0];
    if (/^\d+$/.test(raw)) {
      out.push({ raw, value: Number(raw), word: false });
    } else if (Object.prototype.hasOwnProperty.call(WORD_VALUES, raw)) {
      out.push({ raw, value: WORD_VALUES[raw], word: true });
    }
  }
  return out;
}

export function check(review, draft) {
  const reviewText = review && typeof review.text === 'string' ? review.text : '';
  const allowedDigits = new Set(digitTokens(reviewText));
  const reviewWords = wordTokens(reviewText);
  const allowedWords = new Set(reviewWords);
  const allowedWordValues = new Set(reviewWords.map((word) => String(WORD_VALUES[word])));
  for (const token of tokens(draft)) {
    if (token.word) {
      if (allowedWords.has(token.raw) || allowedDigits.has(String(token.value))) continue;
    } else if (allowedDigits.has(token.raw) || allowedWordValues.has(token.raw)) {
      continue;
    }
    return {
      pass: false,
      reason: `the reply states ${token.raw}, which the review never states`,
    };
  }
  return { pass: true, reason: '' };
}
