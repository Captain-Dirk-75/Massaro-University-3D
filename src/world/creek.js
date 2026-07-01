/**
 * Creek + waterfall geometry — shared, pure (no THREE, no side effects).
 *
 * Consumed by:
 *   - ground.js   → carves the channel into the terrain height field
 *   - waterways.js→ lays the animated water ribbon, waterfall sheet, mist, stones
 *
 * The stream is fed by a gentle SPRING MOUND on the north-west lawn; it steps
 * down a small WATERFALL on the mound's south-east face, then winds across the
 * valley floor into the existing reflecting pool.
 *
 * `bed` on each node is the WATER-SURFACE height (world Y). The terrain is
 * carved to `bed - CREEK_DEPTH` at the centreline and blended back up to the
 * natural ground over CREEK_BANK.
 */

// ── Spring mound (a soft grassy knoll the creek springs from) ──
export const SPRING_MOUND = { x: -21, z: -31, radius: 6.5, height: 2.9 };

// ── Channel shape ──
export const CREEK_HALF_WIDTH = 1.1; // flat channel bottom half-width
export const CREEK_BANK = 2.3; // blend distance from channel edge back to ground
export const CREEK_DEPTH = 0.26; // channel bottom below the water surface

// ── Waterfall (the little step on the mound's SE face) ──
export const WATERFALL = {
  x: -18.0,
  z: -28.5,
  lipY: 1.2, // water surface at the top of the fall
  plungeY: 0.15, // water surface of the plunge pool
  width: 1.7,
  // Flow direction over the lip (south-east), normalized.
  dir: { x: 0.64, z: 0.77 },
};

/**
 * Centreline nodes, ordered spring → pond. `bed` is the water-surface Y.
 * The steep drop between the lip node (index 2) and plunge node (index 3)
 * forms the waterfall; the terrain carve turns it into a real little step.
 */
export const CREEK_NODES = [
  { x: -22.0, z: -32.5, bed: 1.75 }, // spring, high on the mound
  { x: -20.0, z: -30.5, bed: 1.5 },
  { x: -18.5, z: -29.0, bed: 1.2 }, // lip (top of waterfall)
  { x: -17.5, z: -28.0, bed: 0.15 }, // plunge pool (base of waterfall)
  { x: -13.0, z: -25.0, bed: 0.13 },
  { x: -9.0, z: -22.5, bed: 0.12 },
  { x: -5.0, z: -20.5, bed: 0.11 },
  { x: -2.0, z: -19.0, bed: 0.12 }, // meets the reflecting pool
];

/** Node index at the top of the waterfall; the segment to index+1 is the fall. */
export const WATERFALL_SEGMENT = 2;

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Soft radial bump for the spring mound (world Y contribution). */
export function springMoundHeight(x, z) {
  const dx = x - SPRING_MOUND.x;
  const dz = z - SPRING_MOUND.z;
  const d = Math.hypot(dx, dz);
  if (d >= SPRING_MOUND.radius) return 0;
  // Smooth dome — flat-ish top, easing to zero at the rim.
  return SPRING_MOUND.height * (1 - smoothstep(0, SPRING_MOUND.radius, d));
}

/**
 * Nearest-point query against the creek polyline.
 * Returns { dl, bed, t, px, pz, segIndex, seg01 } where:
 *   dl      — lateral distance from the centreline
 *   bed     — interpolated water-surface height at the nearest point
 *   t       — global param 0..1 along the whole creek
 *   px,pz   — nearest centreline point
 *   segIndex/seg01 — which segment and local param (for tangents)
 */
export function creekNearest(x, z) {
  let best = null;
  const segCount = CREEK_NODES.length - 1;

  for (let i = 0; i < segCount; i++) {
    const a = CREEK_NODES[i];
    const b = CREEK_NODES[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const lenSq = dx * dx + dz * dz || 1e-6;
    let s = ((x - a.x) * dx + (z - a.z) * dz) / lenSq;
    s = Math.max(0, Math.min(1, s));
    const px = a.x + s * dx;
    const pz = a.z + s * dz;
    const dl = Math.hypot(x - px, z - pz);
    if (!best || dl < best.dl) {
      best = {
        dl,
        bed: a.bed + s * (b.bed - a.bed),
        t: (i + s) / segCount,
        px,
        pz,
        segIndex: i,
        seg01: s,
      };
    }
  }

  return best;
}

/**
 * Creek influence on the terrain at (x, z).
 * Returns { influence, bottom } where `influence` is 1 in the channel and eases
 * to 0 past the banks, and `bottom` is the target carved terrain height.
 */
export function creekCarveAt(x, z) {
  const near = creekNearest(x, z);
  if (!near) return { influence: 0, bottom: 0 };

  const edge = near.dl - CREEK_HALF_WIDTH;
  if (edge <= 0) {
    return { influence: 1, bottom: near.bed - CREEK_DEPTH };
  }
  if (edge >= CREEK_BANK) {
    return { influence: 0, bottom: near.bed - CREEK_DEPTH };
  }
  const influence = 1 - smoothstep(0, CREEK_BANK, edge);
  return { influence, bottom: near.bed - CREEK_DEPTH };
}

/** True within (or just beside) the water channel — used to keep scatter out. */
export function isInCreekChannel(x, z, pad = 0.8) {
  const near = creekNearest(x, z);
  return !!near && near.dl < CREEK_HALF_WIDTH + pad;
}
