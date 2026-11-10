// A small seeded random number generator.
// Same seed, same sequence, on every machine and every Node version: only integer math is used.
export function makeRng(seed) {
  let a = (Number(seed) >>> 0) || 1;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(rng, list) {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}

export function intBetween(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}
