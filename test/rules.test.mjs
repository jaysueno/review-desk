import test from 'node:test';
import assert from 'node:assert/strict';
import { check as checkMoney } from '../rules/no-money.mjs';
import { check as checkStaff } from '../rules/no-staff-surname.mjs';
import { check as checkLanguage } from '../rules/language-match.mjs';
import { check as checkMedical } from '../rules/no-medical-legal.mjs';
import { check as checkLength } from '../rules/length.mjs';
import { check as checkNumbers } from '../rules/numbers-from-review.mjs';

const review = {
  id: 't-01',
  rating: 3,
  language: 'en',
  reviewer: 'Ana',
  text: 'The rye loaf was dry and I was disappointed.',
  topics: ['product'],
  staff: [],
  flags: [],
};

test('the money rule refuses an amount and a refund promise', () => {
  assert.equal(checkMoney(review, 'We have refunded your $24 and it will appear in 24 hours.').pass, false);
  assert.equal(checkMoney(review, 'The refund is on its way.').pass, false);
  assert.equal(checkMoney(review, 'I am sorry the loaf was dry. Thank you for telling us.').pass, true);
});

test('the staff surname rule allows the first name and refuses the surname', () => {
  const staffed = {
    ...review,
    staff: [{ first: 'Mirela', last: 'Costa' }],
    text: 'Mirela Costa helped me choose a cake.',
    flags: ['staff-named'],
  };
  assert.equal(checkStaff(staffed, 'Thank you for the kind words about Mirela.').pass, true);
  assert.equal(checkStaff(staffed, 'Thank you for the kind words about Mirela Costa.').pass, false);
});

test('the language rule refuses an English reply to a Spanish review', () => {
  const spanish = {
    ...review,
    language: 'es',
    text: 'El pan de centeno estaba delicioso y el trato fue muy amable.',
    flags: ['non-english'],
  };
  assert.equal(checkLanguage(spanish, 'Gracias por contarnos lo que paso y esperamos verte pronto.').pass, true);
  assert.equal(checkLanguage(spanish, 'Thanks for telling us what happened and hope to see you soon.').pass, false);
});

test('the medical and legal rule refuses a cure claim', () => {
  assert.equal(checkMedical(review, 'Our seeded loaf will cure your digestion problems.').pass, false);
  assert.equal(checkMedical(review, 'Thank you for trying the seeded loaf. We bake it fresh each morning.').pass, true);
});

test('the length rule enforces the 40 to 600 bounds', () => {
  assert.equal(checkLength(review, 'Thanks!').pass, false);
  assert.equal(
    checkLength(review, 'Thank you for the kind words about our bread. We are glad you came by.').pass,
    true,
  );
  assert.equal(checkLength(review, 'a'.repeat(601)).pass, false);
});

test('the numbers rule refuses a digit the review never states', () => {
  const numbered = { ...review, text: 'I ordered 2 sourdough loaves at 8 am.' };
  assert.equal(checkNumbers(numbered, 'Thank you for coming by at 8 in the morning.').pass, true);
  assert.equal(checkNumbers(numbered, 'We bake 40 loaves every morning.').pass, false);
});

test('every rule returns a boolean pass and a reason string', () => {
  const rules = [checkMoney, checkStaff, checkLanguage, checkMedical, checkLength, checkNumbers];
  for (const rule of rules) {
    const outcome = rule(review, 'Thank you for the note. We will read it and do better.');
    assert.equal(typeof outcome.pass, 'boolean');
    assert.equal(typeof outcome.reason, 'string');
  }
});
