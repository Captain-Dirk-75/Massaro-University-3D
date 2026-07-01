/**
 * Creek + waterfall geometry — shared, pure (no THREE, no side effects).
 *
 * Consumed by:
 *   - ground.js   → carves the channel into the terrain height field
 *   - waterways.js→ lays the animated water ribbon, waterfall sheet, mist, stones
 *
 * The stream is born HIGH ON THE WEST VALLEY WALL, runs down a carved gully,
 * steps over a small WATERFALL where the hillside is steep, then winds across
 * the valley floor into the existing reflecting pool. The elevation comes from
 * the natural hills — no artificial mound on the flat.
 *
 * `bed` on each node is the WATER-SURFACE height (world Y). The terrain is
 * carved to `bed - CREEK_DEPTH` at the centreline and blended back up to the
 * natural ground over CREEK_BANK.
 */

// ── Channel shape ──
export const CREEK_HALF_WIDTH = 1.1; // flat channel bottom half-width
export const CREEK_BANK = 2.4; // blend distance from channel edge back to ground
export const CREEK_DEPTH = 0.26; // channel bottom below the water surface
export const PLUNGE_EXTRA_DEPTH = 0.35; // the plunge pool is carved a little deeper

/**
 * Centreline nodes, ordered spring → pond. `bed` is the water-surface Y.
 * Nodes 0–2 descend the west hillside; the steep drop between the lip node
 * (WATERFALL_SEGMENT) and the next node is the waterfall; the rest winds gently
 * across the valley floor to the pool.
 *
 * Bed heights sit just below the natural hillside so the water always runs in a
 * real channel (verified against getTerrainHeight in the tuning pass).
 */
export const CREEK_NODES = [
  { x: -50.0, z: -19.2, bed: 5.3 }, // spring, high on the west valley wall
  { x: -48.0, z: -18.9, bed: 4.3 },
  { x: -46.0, z: -18.6, bed: 3.3 },
  { x: -44.0, z: -18.3, bed: 1.9 }, // lip (top of waterfall) — on the hillside
  { x: -42.0, z: -18.0, bed: 0.35 }, // plunge pool at the foot of the hill
  { x: -39.5, z: -18.1, bed: 0.1 },
  { x: -33.0, z: -18.5, bed: -0.04 }, // winding across the valley floor
  { x: -24.0, z: -19.0, bed: -0.05 },
  { x: -15.0, z: -18.6, bed: -0.04 },
  { x: -7.0, z: -18.2, bed: -0.02 },
  { x: -1.5, z: -18.0, bed: 0.02 }, // meets the reflecting pool
];

/** Node index at the top of the waterfall; the segment to index+1 is the fall. */
export const WATERFALL_SEGMENT = 3;

/** The little waterfall — derived from the lip and plunge nodes. */
export const WATERFALL = {
  x: (CREEK_NODES[WATERFALL_SEGMENT].x + CREEK_NODES[WATERFALL_SEGMENT + 1].x) / 2,
  z: (CREEK_NODES[WATERFALL_SEGMENT].z + CREEK_NODES[WATERFALL_SEGMENT + 1].z) / 2,
  lipY: CREEK_NODES[WATERFALL_SEGMENT].bed,
  plungeY: CREEK_NODES[WATERFALL_SEGMENT + 1].bed,
  width: 1.8,
  // Flow direction over the lip (down the hillside, toward the valley), normalized.
  dir: (() => {
    const dx = CREEK_NODES[WATERFALL_SEGMENT + 1].x - CREEK_NODES[WATERFALL_SEGMENT].x;
    const dz = CREEK_NODES[WATERFALL_SEGMENT + 1].z - CREEK_NODES[WATERFALL_SEGMENT].z;
    const len = Math.hypot(dx, dz) || 1;
    return { x: dx / len, z: dz / len };
  })(),
};

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Nearest-point query against the creek polyline.
 * Returns { dl, bed, t, px, pz, segIndex, seg01 }.
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
 * to 0 past the banks, and `bottom` is the target carved terrain height. The
 * plunge pool (just below the lip) is dug a little deeper to hold the fall.
 */
export function creekCarveAt(x, z) {
  const near = creekNearest(x, z);
  if (!near) return { influence: 0, bottom: 0 };

  const segCount = CREEK_NODES.length - 1;
  const plungeStart = WATERFALL_SEGMENT / segCount;
  const plungeEnd = (WATERFALL_SEGMENT + 1.6) / segCount;
  const plunge =
    near.t > plungeStart && near.t < plungeEnd
      ? PLUNGE_EXTRA_DEPTH *
        Math.sin(((near.t - plungeStart) / (plungeEnd - plungeStart)) * Math.PI)
      : 0;

  const edge = near.dl - CREEK_HALF_WIDTH;
  const bottom = near.bed - CREEK_DEPTH - plunge;
  if (edge <= 0) return { influence: 1, bottom };
  if (edge >= CREEK_BANK) return { influence: 0, bottom };
  return { influence: 1 - smoothstep(0, CREEK_BANK, edge), bottom };
}

/** True within (or just beside) the water channel — used to keep scatter out. */
export function isInCreekChannel(x, z, pad = 0.8) {
  const near = creekNearest(x, z);
  return !!near && near.dl < CREEK_HALF_WIDTH + pad;
}
