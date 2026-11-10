import test from 'node:test';
import assert from 'node:assert/strict';
import { check as checkMoney } from '../rules/no-money.mjs';
import { check as checkLanguage, scoreLanguage } from '../rules/language-match.mjs';
import { check as checkStaff } from '../rules/no-staff-surname.mjs';
import { check as checkMedical } from '../rules/no-medical-legal.mjs';
import { check as checkNumbers } from '../rules/numbers-from-review.mjs';
import { loadRules, evaluate } from '../lib/rule-runner.mjs';
import { repoRoot } from '../lib/paths.mjs';

const review = (text, options = {}) => ({
  id: 'r2',
  rating: 3,
  language: 'en',
  reviewer: 'Ana',
  text,
  topics: ['product'],
  staff: [],
  flags: [],
  ...options,
});

test('no-money covers the Spanish and French money words, accent-insensitive', () => {
  const es = ['Le damos un reembolso.', 'Vamos a reembolsar el pedido.', 'Le devolvemos el dinero.', 'La devolucion esta lista.', 'Su proxima visita es gratis.', 'Le damos un descuento.', 'Tiene credito en la tienda.', 'Le damos un vale.', 'Aqui tiene un cupon.'];
  const fr = ['Nous offrons un remboursement.', 'Nous allons rembourser la commande.', 'Votre prochaine visite est gratuite.', 'Nous appliquons une reduction.', 'Vous avez un avoir.', "Voici un bon d'achat.", 'Voici un bon d’achat.'];
  for (const draft of [...es, ...fr]) {
    assert.equal(checkMoney(review('The loaf was dry.'), draft).pass, false, draft);
  }
});

test('no-money covers comp, free, credit, gift card, no charge, half price and percent off', () => {
  const drafts = [
    'We will comp it for you.',
    'Come back for a free loaf this weekend.',
    'We will add store credit to your account.',
    'Here is a gift card for your next visit.',
    'Your next loaf is no charge.',
    'We can do the next one at half price.',
    'Take 20 percent off your next order.',
  ];
  for (const draft of drafts) {
    assert.equal(checkMoney(review('I bought 20 pastries.'), draft).pass, false, draft);
  }
});

test('language-match recognises six languages and refuses a mixed reply', () => {
  const en = review('The bread was good and the coffee was fine.');
  const es = review('El pan estaba bueno y el cafe estaba frio.', { language: 'es' });
  const fr = review('Le pain etait bon et le cafe etait froid.', { language: 'fr' });
  const de = review('Das Brot war gut und der Kaffee war lecker.', { language: 'de' });
  const it = review('Il pane era buono e il caffe era ottimo.', { language: 'it' });
  const pt = review('O pao estava bom e o cafe estava otimo.', { language: 'pt' });

  assert.equal(checkLanguage(en, 'Thank you for the kind words about the bread and the coffee.').pass, true);
  assert.equal(checkLanguage(es, 'Gracias por contarnos lo que paso y esperamos verte pronto.').pass, true);
  assert.equal(checkLanguage(fr, 'Merci pour votre message. Nous sommes desoles et nous esperons vous revoir bientot.').pass, true);
  assert.equal(checkLanguage(de, 'Vielen Dank fur Ihre Nachricht. Es tut uns leid und wir werden es prufen.').pass, true);
  assert.equal(checkLanguage(it, 'Grazie per il messaggio. Siamo spiacenti e speriamo di rivedervi presto.').pass, true);
  assert.equal(checkLanguage(pt, 'Obrigado pela mensagem. Vamos resolver isso com muito cuidado e atenciosamente.').pass, true);

  assert.equal(checkLanguage(en, 'Merci pour votre message. Nous sommes desoles et nous esperons vous revoir bientot.').pass, false);
  assert.equal(checkLanguage(en, 'Thank you for the bread. Gracias por venir y esperamos verte pronto por aqui.').pass, false);
  assert.equal(checkLanguage(en, '').pass, false);
  assert.equal(checkLanguage(en, '').reason, 'language not recognised, a person must check');
});

test('language-match scores each language separately', () => {
  assert.equal(scoreLanguage('Thank you for the bread and the coffee.').top, 'en');
  assert.equal(scoreLanguage('Gracias por el pan y el cafe.').top, 'es');
  assert.equal(scoreLanguage('Merci pour votre message et votre visite.').top, 'fr');
  assert.equal(scoreLanguage('Danke fur die Nachricht und die Bestellung.').top, 'de');
  assert.equal(scoreLanguage('Grazie per il messaggio e la visita.').top, 'it');
  assert.equal(scoreLanguage('Obrigado pela mensagem e pela visita.').top, 'pt');
});

test('no-staff-surname catches split and restyled surnames', () => {
  const staffed = review('Nadia Okafor helped me choose a cake.', {
    staff: [{ first: 'Nadia', last: 'Okafor' }],
    flags: ['staff-named'],
  });
  const splits = [
    'Thank you for the help from Oka for and the team.',
    'Thank you for the help from Oka' + String.fromCharCode(0xad) + 'for and the team.',
    'Thank you for the help from Oka' + String.fromCharCode(0x2011) + 'for and the team.',
    'Thank you for the help from Oka' + String.fromCharCode(0x200b) + 'for and the team.',
    'Thank you for the help from Oka\nfor and the team.',
    'Thank you for the help from OKAFOR and the team.',
  ];
  for (const draft of splits) {
    assert.equal(checkStaff(staffed, draft).pass, false, JSON.stringify(draft));
  }
  assert.equal(checkStaff(staffed, 'Thank you for the kind words about Nadia.').pass, true);
});

test('no-medical-legal catches plurals and near-synonyms', () => {
  const drafts = [
    'Our lawyers will read this note and reply.',
    'Our attorneys will read this note and reply.',
    'The terms are legally binding for both sides.',
    'We are not responsible for the delay you saw.',
    'This loaf will cure your digestion problems.',
    'This tea will heal your stomach and help you rest.',
    'This loaf treats a bad stomach and helps you rest.',
    'We can diagnose your problem from this note alone.',
    'This is medical advice from our team to you.',
  ];
  for (const draft of drafts) {
    assert.equal(checkMedical(review('The loaf was dry.'), draft).pass, false, draft);
  }
});

test('numbers-from-review normalises fullwidth digits and counts number words', () => {
  const digitReview = review('I ordered 20 loaves at 8 am.');
  assert.equal(checkNumbers(digitReview, 'We baked ２０ loaves for you today.').pass, true);
  assert.equal(checkNumbers(digitReview, 'We baked twenty loaves for you today.').pass, true);
  assert.equal(checkNumbers(digitReview, 'We baked 40 loaves for you today.').pass, false);
  assert.equal(checkNumbers(digitReview, 'We baked ４０ loaves for you today.').pass, false);
  assert.equal(checkNumbers(digitReview, 'We baked twenty loaves for you today.').pass, true);
  assert.equal(checkNumbers(review('I ordered twenty loaves.'), 'We baked 20 loaves for you today.').pass, true);
  assert.equal(checkNumbers(digitReview, 'We baked half the loaves for you today.').pass, false);
});

test('a promoted rule joins the gate with no code change', async () => {
  const { mkdtempSync, readdirSync, copyFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { propose } = await import('../lib/promote.mjs');
  const dir = mkdtempSync(join(tmpdir(), 'review-desk-rules-'));
  try {
    for (const name of readdirSync(repoRoot('rules'))) {
      if (name.endsWith('.mjs') && !name.endsWith('.test.mjs')) {
        copyFileSync(join(repoRoot('rules'), name), join(dir, name));
      }
    }
    const item = review('The loaf was dry and I was disappointed.');
    const edits = [1, 2, 3].map((n) => ({
      review_id: 'p-' + n,
      correction_class: 'apology-first',
      before: 'Thank you for the feedback about the loaf.',
      after: 'Please accept my apology for the dry loaf. Thank you for telling us number ' + n + '.',
      review: item,
    }));
    const result = propose(edits, dir);
    assert.equal(result.count, 1);
    const rules = await loadRules(dir);
    assert.ok(rules.some((rule) => rule.id === 'apology-first'));
    const forbidden = await evaluate(rules, item, 'Thank you for the feedback about the loaf and the team will read it.');
    assert.equal(forbidden.pass, false);
    assert.equal(forbidden.rule, 'apology-first');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('no-money covers complimentary, on us, our treat and at no cost', () => {
  for (const draft of [
    'We will make it right with a complimentary cake for you.',
    'Please come back, the next loaf is on us this week.',
    'Stop by on Friday and a coffee will be our treat.',
    'We will remake the whole order at no cost to you.',
  ]) {
    assert.equal(checkMoney(review('The loaf was dry.'), draft).pass, false, draft);
  }
});
