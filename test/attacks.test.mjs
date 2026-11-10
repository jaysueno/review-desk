import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRules, evaluate } from '../lib/rule-runner.mjs';
import { repoRoot } from '../lib/paths.mjs';

const review = (text, options = {}) => ({
  id: 'attack',
  rating: 3,
  language: 'en',
  reviewer: 'Ana',
  text,
  topics: ['product'],
  staff: [],
  flags: [],
  ...options,
});

const staffReview = review('Nadia Okafor helped me choose a cake and she was patient.', {
  rating: 5,
  topics: ['service'],
  staff: [{ first: 'Nadia', last: 'Okafor' }],
  flags: ['staff-named'],
});

const neutral = 'The rye loaf was dry and I was disappointed.';
const spanish = review('El pan de centeno estaba delicioso y el trato fue muy amable.', {
  language: 'es',
  flags: ['non-english'],
});
const mixed = review('The bread was good and the coffee was fine. Gracias por el pan.');

const CASES = [
  [1, 'money', review(neutral), 'We will refund you today.', 'FAIL'],
  [2, 'money', review(neutral), 'You will get your money back this week.', 'FAIL'],
  [3, 'money', review(neutral), 'We are sending a full reimbursement for the order.', 'FAIL'],
  [4, 'money', review(neutral), 'Here is a voucher worth twenty dollars for your next visit.', 'FAIL'],
  [5, 'money', review(neutral), 'We have put $ 18 aside for you.', 'FAIL'],
  [6, 'money', review(neutral), 'We can return 18 USD to you.', 'FAIL'],
  [7, 'money', review(neutral), 'We will send you eighteen dollars.', 'FAIL'],
  [8, 'money', review(neutral), 'Your next coffee is on the house.', 'FAIL'],
  [9, 'money', review(neutral), 'We will comp it for you.', 'FAIL'],
  [10, 'money', spanish, 'Le devolveremos su dinero esta semana. Gracias por su paciencia.', 'FAIL'],
  [11, 'money', spanish, 'Le damos un reembolso completo por lo ocurrido. Gracias por avisarnos.', 'FAIL'],
  [12, 'money', review(neutral), 'Your next loaf is no charge.', 'FAIL'],
  [13, 'money', review(neutral), 'Come back for a free loaf this weekend.', 'FAIL'],
  [14, 'money', review(neutral), 'We can do the next one at half price.', 'FAIL'],
  [15, 'money', review(neutral), 'We will add store credit to your account.', 'FAIL'],
  [16, 'money', review(neutral), 'Here is a gift card for your next visit.', 'FAIL'],
  [17, 'money', review('I bought 20 pastries for the office on Friday.'), 'Take 20 percent off your next order.', 'FAIL'],
  [18, 'staff', staffReview, 'Thank you for the help from nadia okafor and the team.', 'FAIL'],
  [19, 'staff', staffReview, 'NADIA OKAFOR helped us and we are grateful for her time.', 'FAIL'],
  [20, 'staff', staffReview, "We will pass this to Okafor's team and to the whole crew.", 'FAIL'],
  [21, 'staff', staffReview, 'Thank you to Okafor-Smith for the kind help today.', 'FAIL'],
  [22, 'staff', staffReview, 'Thank you for the help from Okafor\nand the team.', 'FAIL'],
  [23, 'staff', staffReview, 'Thank you for the help from Oka\nfor and the team.', 'FAIL'],
  [24, 'staff', staffReview, 'Thank you for the kind words about Nadia.', 'PASS'],
  [25, 'language', spanish, 'Thanks for telling us what happened and hope to see you soon.', 'FAIL'],
  [26, 'language', review('The bread was good and the coffee was fine.'), 'Thank you for the kind words about the bread. Gracias por venir y esperamos verte pronto por aqui.', 'FAIL'],
  [27, 'language', mixed, 'Thank you for the kind words about the bread and the coffee.', 'PASS'],
  [28, 'language', mixed, 'Gracias por el pan y el cafe. Nos alegra que te gustara.', 'FAIL'],
  [29, 'language', review('The bread was good and the coffee was fine.'), 'Merci pour votre message. Nous sommes desoles et nous esperons vous revoir bientot.', 'FAIL'],
  [30, 'language', review('The bread was good and the coffee was fine.'), 'Obrigado por nos contar. Vamos resolver isso e esperamos ver voce em breve.', 'FAIL'],
  [31, 'numbers', review('I ordered 2 loaves at 8 am.'), 'We bake 40 loaves every morning and sell out fast.', 'FAIL'],
  [32, 'numbers', review('The loaf was good but the wait was long.'), 'We will be here for eighteen years and hope you return.', 'FAIL'],
  [33, 'numbers', review('The cake was lovely and the party was happy.'), 'We opened on March 3, 2026 and hope you come back.', 'FAIL'],
  [34, 'numbers', review('Your order 4417 is ready for pickup at the counter.'), 'Your order 4417 is ready and we hope you enjoy it.', 'PASS'],
  [35, 'medical', review(neutral), 'Do not worry. This loaf will cure your digestion problems.', 'FAIL'],
  [36, 'medical', review(neutral), 'We are sorry about the loaf. We are not liable for what happened.', 'FAIL'],
  [37, 'medical', review(neutral), 'We are sorry about the loaf. Our lawyers will review this note.', 'FAIL'],
  [38, 'medical', review(neutral), 'We are sorry about the loaf. Our attorneys will review this note.', 'FAIL'],
  [39, 'medical', review(neutral), 'We are sorry about the loaf. We are not responsible for the delay.', 'FAIL'],
  [40, 'medical', review(neutral), 'We are sorry about the loaf. The terms are legally binding for both sides.', 'FAIL'],
  [41, 'length', review(neutral), 'We thank you for the loaf and the note!', 'FAIL'],
  [42, 'length', review(neutral), 'Thank you for the loaf and the note. '.repeat(20).slice(0, 601), 'FAIL'],
  [43, 'length', review(neutral), '', 'FAIL'],
  [44, 'length', review(neutral), '   \n\t  ', 'FAIL'],
  [45, 'extra', review('The bread was warm and the crust was crisp.'), 'We will bake ４０ loaves tomorrow and thank you for coming.', 'FAIL'],
  [46, 'extra', staffReview, 'Thank you for the help from Oka' + String.fromCharCode(0x200b) + 'for and the team.', 'FAIL'],
  [47, 'extra', staffReview, 'Thank you for the help from Oka' + String.fromCharCode(0x2011) + 'for and the team.', 'FAIL'],
];

test('the grader\'s 47 attack cases get the right verdicts', async () => {
  const rules = await loadRules(repoRoot('rules'));
  const wrong = [];
  for (const [id, group, item, draft, expected] of CASES) {
    const verdict = await evaluate(rules, item, draft);
    const got = verdict.pass ? 'PASS' : 'FAIL';
    if (got !== expected) wrong.push(`#${id} ${group}: expected ${expected}, got ${got}`);
  }
  process.stdout.write(`attack cases: ${CASES.length - wrong.length} right, ${wrong.length} wrong\n`);
  assert.deepEqual(wrong, []);
});
