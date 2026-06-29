import * as THREE from 'three';

/** Height of each story (floor surface to floor surface). */
export const LIBRARY_STORY_HEIGHT = 4.0;

/** Eye-level threshold for upper-floor collision + snapping. */
export const LIBRARY_UPPER_THRESHOLD = 3.0;

/** Cut-out in the second-floor deck — must clear the full stair shaft. */
export const LIBRARY_STAIR_HOLE = {
  minX: -13.8,
  maxX: -8.2,
  minZ: -4.8,
  maxZ: 7.0,
};

const STAIR = {
  minX: -12.9,
  maxX: -10.1,
  bottomZ: 5.5,
  topZ: -4.0,
};

function onStaircase(x, z) {
  return (
    x >= STAIR.minX &&
    x <= STAIR.maxX &&
    z <= STAIR.bottomZ &&
    z >= STAIR.topZ
  );
}

function stairFloorY(z) {
  const run = STAIR.bottomZ - STAIR.topZ;
  const progress = THREE.MathUtils.clamp((STAIR.bottomZ - z) / run, 0, 1);
  return progress * LIBRARY_STORY_HEIGHT;
}

/**
 * Returns ground elevation (metres) for library interior local XZ.
 * Uses current camera Y to stay on the correct story when XZ overlaps both floors.
 */
export function getLibraryFloorY(x, z, currentY = 1.7) {
  if (onStaircase(x, z)) {
    return stairFloorY(z);
  }

  if (currentY >= LIBRARY_UPPER_THRESHOLD) {
    return LIBRARY_STORY_HEIGHT;
  }
  return 0;
}

export function getLibraryFloorLevel(floorY) {
  return floorY >= LIBRARY_STORY_HEIGHT - 0.2 ? 'upper' : 'ground';
}