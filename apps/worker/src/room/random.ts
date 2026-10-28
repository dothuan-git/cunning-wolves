import type { Random } from './machine';

const RANGE = 2 ** 32;

/** A fair `Random` from the platform's crypto source: rejection sampling, so no modulo bias. */
export const cryptoRandom: Random = (below) => {
  if (!Number.isInteger(below) || below < 1 || below > RANGE) {
    throw new Error(`cryptoRandom: bad range ${String(below)}`);
  }
  // The largest multiple of `below` that fits; values at or above it would favor small results.
  const limit = RANGE - (RANGE % below);
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    const value = buffer[0] ?? 0;
    if (value < limit) return value % below;
  }
};
