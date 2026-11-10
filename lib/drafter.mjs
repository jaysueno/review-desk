// The template drafter. No model, no network, no clock: the same review always gets the same
// reply. It reads the rating, the first topic, the review language and, when a staff member is
// named, their first name only. It never states a digit, an amount, a surname or a health claim.

const EN_POSITIVE = {
  product: 'We are glad the bread hit the spot',
  service: 'We are glad the service felt right',
  order: 'We are glad the order came together',
  wait: 'We are glad the visit was worth the wait',
  atmosphere: 'We are glad the room felt warm',
  value: 'We are glad the visit felt fair',
};

const EN_NEGATIVE = {
  product: 'that the bread fell short',
  service: 'that the service fell short',
  order: 'that the order fell short',
  wait: 'about the long wait',
  atmosphere: 'that the room did not feel right',
  value: 'that the visit did not feel worth it',
};

const ES_POSITIVE = {
  product: 'el pan te gustara',
  service: 'el trato fuera amable',
  order: 'el pedido llegara bien',
  wait: 'la visita mereciera la espera',
  atmosphere: 'el lugar fuera tranquilo',
  value: 'la visita valiera la pena',
};

const ES_NEGATIVE = {
  product: 'el pan no estuviera a la altura',
  service: 'el trato no estuviera a la altura',
  order: 'el pedido no llegara bien',
  wait: 'la espera fuera tan larga',
  atmosphere: 'el lugar no fuera agradable',
  value: 'la visita no valiera la pena',
};

function safeText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function firstName(review) {
  const name = safeText(review && review.reviewer, 'friend');
  return name.split(/\s+/)[0];
}

function topicOf(review) {
  const list = review && Array.isArray(review.topics) ? review.topics : [];
  return list.length ? String(list[0]) : 'product';
}

function staffFirst(review) {
  const list = review && Array.isArray(review.staff) ? review.staff : [];
  if (!list.length || !list[0]) return '';
  return safeText(list[0].first, '');
}

export function templateDraft(review) {
  const r = review || {};
  const name = firstName(r);
  const topic = topicOf(r);
  const rating = Number(r.rating) || 3;
  const flags = Array.isArray(r.flags) ? r.flags : [];
  const language = safeText(r.language, 'en').toLowerCase();
  const spanish = language.startsWith('es');
  const staff = staffFirst(r);

  if (spanish) {
    if (rating >= 4) {
      const phrase = ES_POSITIVE[topic] || ES_POSITIVE.product;
      if (staff) return `Gracias, ${name}. Nos alegra que ${phrase} y que ${staff} te atendiera bien.`;
      return `Gracias, ${name}. Nos alegra que ${phrase}, y esperamos verte pronto por aqui.`;
    }
    if (rating === 3) {
      const phrase = ES_NEGATIVE[topic] || ES_NEGATIVE.product;
      return `Gracias por la nota honesta, ${name}. Sentimos que ${phrase}, y revisaremos lo que nos cuentas.`;
    }
    if (flags.includes('abusive')) {
      return `Sentimos leer esto, ${name}. Preferimos escucharlo en persona y el equipo leera cada palabra.`;
    }
    if (flags.includes('refund')) {
      const phrase = ES_NEGATIVE[topic] || ES_NEGATIVE.product;
      return `Sentimos que ${phrase}, ${name}. Gracias por los detalles; el equipo los revisara.`;
    }
    const phrase = ES_NEGATIVE[topic] || ES_NEGATIVE.product;
    return `Sentimos que ${phrase}, ${name}. Gracias por contarnoslo y esperamos poder hacerlo mejor.`;
  }

  if (rating >= 4) {
    const phrase = EN_POSITIVE[topic] || EN_POSITIVE.product;
    if (staff) return `Thank you, ${name}. ${phrase}, and it is good to hear that ${staff} took care of you.`;
    return `Thank you, ${name}. ${phrase}, and it means a lot to hear from you.`;
  }
  if (rating === 3) {
    const phrase = EN_NEGATIVE[topic] || EN_NEGATIVE.product;
    return `Thank you for the honest note, ${name}. We are sorry ${phrase}, and we will look at what you told us.`;
  }
  if (flags.includes('abusive')) {
    return `I am sorry to read this, ${name}. We would rather hear it in person, and the team will read every word.`;
  }
  if (flags.includes('refund')) {
    const phrase = EN_NEGATIVE[topic] || EN_NEGATIVE.product;
    return `I am sorry ${phrase}, ${name}. Thank you for the details, and the team will read them today.`;
  }
  const phrase = EN_NEGATIVE[topic] || EN_NEGATIVE.product;
  return `I am sorry ${phrase}, ${name}. Thank you for telling us, and we would like the chance to do better.`;
}

export default function draft(review) {
  return templateDraft(review);
}
