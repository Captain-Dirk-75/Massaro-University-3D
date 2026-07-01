/**
 * Curved campus path network — stone/gravel routes that connect key places.
 * Used by ground coloring, scatter exclusion, and prop placement.
 */

// ── Mood knobs ──
export const PATH_WIDTH_MAIN = 3.1;
export const PATH_WIDTH_BRANCH = 2.5;
export const PATH_WIDTH_PLAZA = 3.4;

/** Reflecting pool centre (world XZ). Keep paths outside this radius. */
export const POND_CENTER = { x: 0, z: -18 };
export const POND_RADIUS = 6.2;
export const POND_PATH_RING_INNER = 6.0;
export const POND_PATH_RING_OUTER = 8.6;

/**
 * Polyline routes with optional quadratic midpoint for soft curves.
 * points: [{ x, z }] — consecutive pairs form segments; insert curve via mid.
 */
export const PATH_ROUTES = [
  {
    id: 'main-spine',
    width: PATH_WIDTH_MAIN,
    segments: [
      { from: { x: 0, z: 16 }, to: { x: 0, z: 8 }, mid: { x: 1.2, z: 12 } },
      { from: { x: 0, z: 8 }, to: { x: -0.8, z: 0 }, mid: { x: 0.6, z: 4 } },
      { from: { x: -0.8, z: 0 }, to: { x: 0, z: -10 }, mid: { x: -1.4, z: -5 } },
      { from: { x: 0, z: -10 }, to: { x: 0, z: -26 }, mid: { x: 0.8, z: -18 } },
      { from: { x: 0, z: -26 }, to: { x: 0, z: -42 }, mid: { x: -0.6, z: -34 } },
    ],
  },
  {
    id: 'pavilion-branch',
    width: PATH_WIDTH_BRANCH,
    segments: [
      { from: { x: 0, z: 5 }, to: { x: 8, z: 7 }, mid: { x: 4, z: 8 } },
      { from: { x: 8, z: 7 }, to: { x: 20, z: 11 }, mid: { x: 14, z: 10 } },
    ],
  },
  {
    id: 'pool-plaza',
    width: PATH_WIDTH_PLAZA,
    segments: [
      { from: { x: -10, z: -15 }, to: { x: 0, z: -18 }, mid: { x: -5, z: -17 } },
      { from: { x: 0, z: -18 }, to: { x: 10, z: -15 }, mid: { x: 5, z: -17 } },
    ],
  },
  {
    id: 'patron-approach',
    width: PATH_WIDTH_BRANCH,
    segments: [
      { from: { x: -6, z: -12 }, to: { x: -16, z: -10 }, mid: { x: -11, z: -8 } },
      { from: { x: -16, z: -10 }, to: { x: -22, z: -8 }, mid: { x: -19, z: -7 } },
    ],
  },
];

/** Library forecourt stone pad in front of the portico. */
export const LIBRARY_PLAZA = {
  minX: -14,
  maxX: 14,
  minZ: -42,
  maxZ: -12,
};

function distToSegment(px, pz, x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const lenSq = dx * dx + dz * dz;
  if (lenSq < 1e-6) return Math.hypot(px - x1, pz - z1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (pz - z1) * dz) / lenSq));
  const nx = x1 + t * dx;
  const nz = z1 + t * dz;
  return Math.hypot(px - nx, pz - nz);
}

/** Distance from point to a quadratic bezier segment (from → mid → to). */
function distToCurve(px, pz, from, mid, to, samples = 12) {
  let min = Infinity;
  let prev = from;
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const u = 1 - t;
    const x = u * u * from.x + 2 * u * t * mid.x + t * t * to.x;
    const z = u * u * from.z + 2 * u * t * mid.z + t * t * to.z;
    const d = distToSegment(px, pz, prev.x, prev.z, x, z);
    if (d < min) min = d;
    prev = { x, z };
  }
  return min;
}

export function isInsidePond(wx, wz) {
  return Math.hypot(wx - POND_CENTER.x, wz - POND_CENTER.z) < POND_RADIUS;
}

export function distanceToNearestPath(wx, wz) {
  let min = Infinity;

  for (const route of PATH_ROUTES) {
    for (const seg of route.segments) {
      const d = seg.mid
        ? distToCurve(wx, wz, seg.from, seg.mid, seg.to)
        : distToSegment(wx, wz, seg.from.x, seg.from.z, seg.to.x, seg.to.z);
      if (d < min) min = d;
    }
  }

  const pondDist = Math.hypot(wx - POND_CENTER.x, wz - POND_CENTER.z);
  if (pondDist >= POND_PATH_RING_INNER && pondDist <= POND_PATH_RING_OUTER) {
    min = Math.min(min, pondDist - POND_PATH_RING_INNER);
  }

  if (
    wx >= LIBRARY_PLAZA.minX &&
    wx <= LIBRARY_PLAZA.maxX &&
    wz >= LIBRARY_PLAZA.minZ &&
    wz <= LIBRARY_PLAZA.maxZ &&
    !isInsidePond(wx, wz)
  ) {
    min = Math.min(min, 0);
  }

  return min;
}

export function isStonePath(wx, wz) {
  if (isInsidePond(wx, wz)) return false;

  for (const route of PATH_ROUTES) {
    const halfW = route.width * 0.5;
    for (const seg of route.segments) {
      const d = seg.mid
        ? distToCurve(wx, wz, seg.from, seg.mid, seg.to)
        : distToSegment(wx, wz, seg.from.x, seg.from.z, seg.to.x, seg.to.z);
      if (d < halfW) return true;
    }
  }

  const pondDist = Math.hypot(wx - POND_CENTER.x, wz - POND_CENTER.z);
  if (pondDist >= POND_PATH_RING_INNER && pondDist <= POND_PATH_RING_OUTER) {
    return true;
  }

  if (
    wx >= LIBRARY_PLAZA.minX &&
    wx <= LIBRARY_PLAZA.maxX &&
    wz >= LIBRARY_PLAZA.minZ &&
    wz <= LIBRARY_PLAZA.maxZ
  ) {
    return true;
  }

  return false;
}

/** Sample a point along the main spine (t 0 = spawn, 1 = library). */
export function sampleMainSpine(t) {
  const spine = PATH_ROUTES[0];
  const segCount = spine.segments.length;
  const segIndex = Math.min(segCount - 1, Math.floor(t * segCount));
  const localT = t * segCount - segIndex;
  const seg = spine.segments[segIndex];
  const u = 1 - localT;
  const x = u * u * seg.from.x + 2 * u * localT * seg.mid.x + localT * localT * seg.to.x;
  const z = u * u * seg.from.z + 2 * u * localT * seg.mid.z + localT * localT * seg.to.z;
  return { x, z };
}