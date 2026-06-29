/**
 * Deterministic seeded PRNG — same seed always yields the same sequence.
 */
export function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export function hashSeed(x, z) {
  return ((Math.floor(x * 73.7) ^ Math.floor(z * 193.1)) * 2654435761) >>> 0;
}