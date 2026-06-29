import * as THREE from 'three';

export const LIBRARY_SECOND_FLOOR_Y = 2.2;

const STAIR = {
  minX: -11.6,
  maxX: -8.4,
  bottomZ: -6,
  topZ: -10.2,
  rise: LIBRARY_SECOND_FLOOR_Y,
};

const MEZZANINE = {
  minX: -13.4,
  maxX: -3.6,
  minZ: -11.8,
  maxZ: -1.8,
};

function onMezzanine(x, z) {
  return (
    x >= MEZZANINE.minX &&
    x <= MEZZANINE.maxX &&
    z >= MEZZANINE.minZ &&
    z <= MEZZANINE.maxZ
  );
}

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
  return progress * STAIR.rise;
}

/**
 * Returns ground elevation (metres) for library interior local XZ.
 */
export function getLibraryFloorY(x, z) {
  if (onStaircase(x, z)) {
    return stairFloorY(z);
  }
  if (onMezzanine(x, z)) {
    return LIBRARY_SECOND_FLOOR_Y;
  }
  return 0;
}

export function getLibraryFloorLevel(floorY) {
  return floorY >= LIBRARY_SECOND_FLOOR_Y - 0.15 ? 'upper' : 'ground';
}