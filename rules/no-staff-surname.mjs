// A staff member named in a review is protected: the reply may use their first name, never their
// surname. Both sides are normalised before matching: case, accents, line breaks, soft hyphens,
// zero-width characters, the non-breaking hyphen, hyphens and spaces inside words. A surname
// split across a line or restyled is still caught. This is a hard zero.
export const id = 'no-staff-surname';
export const kind = 'hard-zero';
export const description = 'No staff surname appears in a reply, even split or restyled. The first name is allowed.';

const COMBINING = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
const FORMAT = new RegExp(
  '[' + String.fromCharCode(0xad) + String.fromCharCode(0x200b) + '-' +
    String.fromCharCode(0x200f) + String.fromCharCode(0xfeff) + ']',
  'g',
);
const HYPHENS = new RegExp(
  '[' + String.fromCharCode(0x2d) + String.fromCharCode(0x2010) + '-' +
    String.fromCharCode(0x2015) + String.fromCharCode(0x2212) + ']',
  'g',
);

export function squash(text) {
  return String(text == null ? '' : text)
    .normalize('NFKC')
    .normalize('NFKD')
    .replace(COMBINING, '')
    .toLowerCase()
    .replace(FORMAT, '')
    .replace(/[\r\n\t]/g, '')
    .replace(HYPHENS, '')
    .replace(/\s+/g, '');
}

export function check(review, draft) {
  const text = squash(draft);
  const staff = review && Array.isArray(review.staff) ? review.staff : [];
  for (const member of staff) {
    const last = member && typeof member.last === 'string' ? squash(member.last) : '';
    if (last.length < 2) continue;
    if (text.includes(last)) {
      return { pass: false, reason: `the reply names a staff member surname: ${member.last}` };
    }
  }
  return { pass: true, reason: '' };
}
