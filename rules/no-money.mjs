// The reply promises no money: no currency amount, refund, reimbursement, credit, voucher,
// coupon, gift card, free item, discount, percent off, half price or comp.
// Keyword checks in English, Spanish and French, accent-insensitive. A person backs them up.
// This is a hard zero: a draft that trips it is never approvable.
export const id = 'no-money';
export const kind = 'hard-zero';
export const description = 'No money promise: currency amounts, refunds, credits, free items, discounts or comps. English, Spanish and French keywords.';

const NUMBER_WORD =
  '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)';

const SYMBOL_AMOUNT = new RegExp('[$€£₱¥₹]\\s*(?:\\d|' + NUMBER_WORD + '\\b)');
const CODE_AMOUNT = new RegExp(
  '\\b(?:\\d[\\d,.]*|' + NUMBER_WORD + ')\\s*(?:usd|php|eur|gbp|aud|cad|mxn|jpy|pesos?|dollars?|euros?|pounds?|yen)\\b',
);
const CODE_BEFORE_AMOUNT = /\b(?:usd|php|eur|gbp|aud|cad|mxn|jpy)\s*\d/i;
const PERCENT_OFF = new RegExp(
  '\\b(?:\\d+|' + NUMBER_WORD + ')\\s*(?:%|percent|per cent)\\s*(?:off|discount)?\\b',
);
const HALF_PRICE = /\bhalf[\s-]*(?:price|off)\b/i;

const ENGLISH = [
  /\brefund(?:s|ed|ing)?\b/i,
  /\breimburs(?:e|es|ed|ing|ement)\b/i,
  /\b(?:money|cash)\s+back\b/i,
  /\bcompensat(?:e|es|ed|ing|ion)\b/i,
  /\bcomp(?:s|ped|ping)?\b/i,
  /\bfree\b/i,
  /\bon the house\b/i,
  /\bon us\b/i,
  /\bour treat\b/i,
  /\bcomplimentary\b/i,
  /\bat no cost\b/i,
  /\bno charge\b/i,
  /\bdiscount(?:s|ed|ing)?\b/i,
  /\bcredit\b/i,
  /\bvoucher(?:s)?\b/i,
  /\bcoupon(?:s)?\b/i,
  /\bgift\s*cards?\b/i,
  /\bchargeback\b/i,
  /\bwaive[ds]?\b/i,
  /\bwrite off\b/i,
];

const SPANISH = [
  /\breembols\w*\b/i,
  /\bdevolucion(?:es)?\b/i,
  /\bdevolv(?:eremos|er|emos|era|eran|io|ieron|iendo|e|a|an)\b(?:\s+\w+){0,3}\s+\bdinero\b/i,
  /\bgratis\b/i,
  /\bdescuento(?:s)?\b/i,
  /\bcredito(?:s)?\b/i,
  /\bvale(?:s)?\b/i,
  /\bcupon(?:es)?\b/i,
  /\bsin cargo\b/i,
];

const FRENCH = [
  /\brembours(?:ement|ements|er|e|es|ons|ez)\b/i,
  /\bgratuit(?:e|es|ement)?\b/i,
  /\breduction(?:s)?\b/i,
  /\bavoir(?:s)?\b/i,
  /\bbon\s*d['’]?\s*achat\b/i,
];

const PATTERNS = [
  [SYMBOL_AMOUNT, 'a currency amount'],
  [CODE_AMOUNT, 'a currency amount'],
  [CODE_BEFORE_AMOUNT, 'a currency amount'],
  [PERCENT_OFF, 'a percent off offer'],
  [HALF_PRICE, 'a half price offer'],
];

const COMBINING = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');

function normalize(text) {
  return String(text == null ? '' : text)
    .normalize('NFKC')
    .normalize('NFKD')
    .replace(COMBINING, '')
    .toLowerCase();
}

export function check(review, draft) {
  const text = normalize(draft);
  for (const [pattern, label] of PATTERNS) {
    if (pattern.test(text)) {
      return { pass: false, reason: 'the reply promises money: ' + label };
    }
  }
  for (const [patterns, language] of [[ENGLISH, 'English'], [SPANISH, 'Spanish'], [FRENCH, 'French']]) {
    for (const pattern of patterns) {
      const match = pattern.exec(text);
      if (match) {
        return {
          pass: false,
          reason: 'the reply promises money: ' + language + ' word "' + match[0].trim() + '"',
        };
      }
    }
  }
  return { pass: true, reason: '' };
}
