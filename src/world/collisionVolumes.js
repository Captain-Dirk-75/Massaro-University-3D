import { getCachedCampusAreas } from '../platform/index.js';

// ── Mood knobs ──
export const PLAYER_RADIUS = 0.38;

/** Per-builder collision half-extents (world units, tuned to procedural meshes). */
const BUILD_COLLIDERS = {
  library: { halfW: 21, halfD: 9.5, offsetX: 0, offsetZ: 0.5 },
  'water-feature': { halfW: 6.5, halfD: 8.5, offsetX: 0, offsetZ: 0 },
  'patron-garden': { halfW: 7.5, halfD: 6.5, offsetX: 0, offsetZ: 0 },
  'stillness-pavilion': { halfW: 5.5, halfD: 5, offsetX: 0, offsetZ: 0 },
};

const PROP_CIRCLES = [
  { x: 6, z: 3, r: 1.15 },
  { x: -7, z: 5, r: 0.8 },
];

const WORLD_BOUNDS = { halfExtent: 54 };

/**
 * Build static XZ colliders for first-person movement.
 */
export function createWorldColliders({ treeColliders = [], rockColliders = [] }) {
  const boxes = [];
  const circles = [...PROP_CIRCLES];

  boxes.push({
    minX: -WORLD_BOUNDS.halfExtent,
    maxX: WORLD_BOUNDS.halfExtent,
    minZ: -WORLD_BOUNDS.halfExtent,
    maxZ: WORLD_BOUNDS.halfExtent,
    boundary: true,
  });

  for (const area of getCachedCampusAreas()) {
    if (!area.build) continue;

    const spec = BUILD_COLLIDERS[area.build];
    if (!spec) continue;

    const cx = area.position.x + (spec.offsetX ?? 0);
    const cz = area.position.z + (spec.offsetZ ?? 0);

    boxes.push({
      minX: cx - spec.halfW,
      maxX: cx + spec.halfW,
      minZ: cz - spec.halfD,
      maxZ: cz + spec.halfD,
      id: area.id,
    });
  }

  for (const tree of treeColliders) {
    circles.push({
      x: tree.x,
      z: tree.z,
      r: tree.r,
    });
  }

  for (const rock of rockColliders) {
    circles.push({
      x: rock.x,
      z: rock.z,
      r: rock.r,
    });
  }

  return { boxes, circles, playerRadius: PLAYER_RADIUS };
}