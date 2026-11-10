// A reply has to be long enough to say something and short enough to read.
export const id = 'length';
export const kind = 'gate';
export const description = 'The reply is between 40 and 600 characters after trimming.';

export function check(review, draft) {
  const text = String(draft == null ? '' : draft).trim();
  if (text.length < 40) {
    return {
      pass: false,
      reason: `the reply is ${text.length} character${text.length === 1 ? '' : 's'}, under the 40 character floor`,
    };
  }
  if (text.length > 600) {
    return {
      pass: false,
      reason: `the reply is ${text.length} characters, over the 600 character ceiling`,
    };
  }
  return { pass: true, reason: '' };
}
