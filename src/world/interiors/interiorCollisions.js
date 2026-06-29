import { PLAYER_RADIUS } from '../collisionVolumes.js';

/**
 * Interior wall bounds + optional furniture blockers (interior local XZ).
 * Boxes may set level: 'ground' | 'upper' | 'all' (default all).
 */
export function createInteriorColliders(room, furniture = [], { upperBounds } = {}) {
  const margin = 0.45;
  const hw = room.width / 2 - margin;
  const hd = room.depth / 2 - margin;

  const boxes = [
    {
      minX: -hw,
      maxX: hw,
      minZ: -hd,
      maxZ: hd,
      boundary: true,
      level: 'ground',
    },
    ...furniture,
  ];

  if (upperBounds) {
    boxes.push({
      minX: upperBounds.minX,
      maxX: upperBounds.maxX,
      minZ: upperBounds.minZ,
      maxZ: upperBounds.maxZ,
      boundary: true,
      level: 'upper',
    });
  }

  return { boxes, circles: [], playerRadius: PLAYER_RADIUS };
}