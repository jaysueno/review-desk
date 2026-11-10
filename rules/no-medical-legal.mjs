// A bakery reply never makes a medical or legal claim. Plurals and near-synonyms are covered.
export const id = 'no-medical-legal';
export const kind = 'gate';
export const description = 'No medical claim (cure, heal, treat, diagnose, medical advice) and no legal claim (lawyers, liable, not responsible, court).';

const MEDICAL =
  /\b(?:cure[sd]?|curing|heal(?:s|ed|ing)?|treat(?:s|ed|ing|ment|ments)?|diagnos(?:e|es|ed|ing|is)|medical(?:\s+advice)?|medicine|medication|prescri(?:be|bed|ption)|therapy|therapeutic|clinic|doctor|patient|symptom[s]?|disease[s]?|infection[s]?|pain relief)\b/i;
const LEGAL =
  /\b(?:lawyer[s]?|attorney[s]?|legal(?:ly)?|liabilit(?:y|ies)|liable|lawsuit[s]?|litigation|sue[sd]?|suing|court[s]?|guarantee[sd]?|warrant(?:y|ies)|indemnif(?:y|ied))\b|\bnot responsible\b/i;

export function check(review, draft) {
  const text = String(draft == null ? '' : draft);
  const medical = MEDICAL.exec(text);
  if (medical) {
    return { pass: false, reason: `the reply makes a medical claim: ${medical[0]}` };
  }
  const legal = LEGAL.exec(text);
  if (legal) {
    return { pass: false, reason: `the reply makes a legal claim: ${legal[0]}` };
  }
  return { pass: true, reason: '' };
}
