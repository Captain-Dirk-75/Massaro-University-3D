import { PLAYER_RADIUS } from '../collisionVolumes.js';

/**
 * Interior wall bounds + optional furniture blockers (interior local XZ).
 */
export function createInteriorColliders(room, furniture = []) {
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
    },
    ...furniture,
  ];

  return { boxes, circles: [], playerRadius: PLAYER_RADIUS };
}