import * as THREE from 'three';
import {
  addShadowed,
  buildCeilingLights,
  buildFloorDeck,
  buildInteriorCeiling,
  buildStairMesh,
  buildWallSegmentsAlongX,
  buildWallSegmentsAlongZ,
  createPalette,
  floorMat,
  shellMat,
  woodMat,
} from './buildingPrimitives.js';

export const DEFAULT_STORY_HEIGHT = 4.0;
export const DEFAULT_FLOOR_HEIGHT = 0.14;

function floorLevelForIndex(index) {
  return index === 0 ? 'ground' : 'upper';
}

function buildPartition(
  partition, storyHeight, wallThickness, shellGroup, linerGroup, glassGroup,
  colliderBoxes, palette,
) {
  const { axis, at, spanMin, spanMax, floors, openings = [] } = partition;
  const spanHalf = (spanMax - spanMin) / 2;
  const spanCenter = (spanMin + spanMax) / 2;

  for (const floorIndex of floors) {
    const yBase = floorIndex * storyHeight;
    const level = floorLevelForIndex(floorIndex);
    const doorOpenings = openings.map((o) => ({
      ...o,
      offset: o.at - spanCenter,
      isDoor: true,
      sill: o.bottom ?? 0,
    }));

    if (axis === 'z') {
      buildWallSegmentsAlongX(
        at, spanHalf, yBase, storyHeight, wallThickness, doorOpenings,
        shellGroup, linerGroup, glassGroup, colliderBoxes, 1, palette, level, yBase,
      );
    } else {
      buildWallSegmentsAlongZ(
        at, spanHalf, yBase, storyHeight, wallThickness, doorOpenings,
        shellGroup, linerGroup, glassGroup, colliderBoxes, 1, palette, level, yBase,
      );
    }
  }
}

function buildPlaceholderFurniture(type, x, z, floorY, level, palette, group, colliderBoxes) {
  const items = {
    table: () => {
      const top = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.95), woodMat(palette)));
      top.position.set(x, floorY + 0.78, z);
      group.add(top);
      colliderBoxes.push({ minX: x - 0.95, maxX: x + 0.95, minZ: z - 0.52, maxZ: z + 0.52, level });
    },
    chair: () => {
      const seat = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), woodMat(palette)));
      seat.position.set(x, floorY + 0.48, z);
      group.add(seat);
      colliderBoxes.push({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35, level });
    },
    bookshelf: () => {
      const shelf = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 0.42), woodMat(palette)));
      shelf.position.set(x, floorY + 1.2, z);
      group.add(shelf);
      colliderBoxes.push({ minX: x - 1.05, maxX: x + 1.05, minZ: z - 0.28, maxZ: z + 0.28, level });
    },
    reception: () => {
      const desk = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.05, 0.9), woodMat(palette)));
      desk.position.set(x, floorY + 0.52, z);
      group.add(desk);
      colliderBoxes.push({ minX: x - 1.45, maxX: x + 1.45, minZ: z - 0.55, maxZ: z + 0.55, level });
    },
  };
  items[type]?.();
}

function defaultLightCountForRoom(width, depth) {
  const area = width * depth;
  if (area < 60) return 2;
  if (area < 120) return 3;
  return 4;
}

/**
 * Multi-room, multi-floor unified-world building.
 * @param {object} opts
 */
export function createCompoundBuilding(opts) {
  const {
    id,
    position,
    width,
    depth,
    storyHeight = DEFAULT_STORY_HEIGHT,
    floorCount = 2,
    wallThickness = 0.35,
    floorHeight = DEFAULT_FLOOR_HEIGHT,
    palette: paletteOverrides,
    exteriorDoors = [],
    exteriorWindows = [],
    partitions = [],
    stairs = null,
    floorHoles = [],
    gates = [],
    rooms = [],
    furniture = [],
    ceilingBeams = 0,
  } = opts;

  const palette = createPalette(paletteOverrides);
  const totalHeight = storyHeight * floorCount;
  const halfW = width / 2;
  const halfD = depth / 2;
  const insetW = width - wallThickness * 2;
  const insetD = depth - wallThickness * 2;
  const t = wallThickness;

  const root = new THREE.Group();
  root.position.set(position.x, position.y, position.z);
  root.userData.buildingId = id;

  const shellGroup = new THREE.Group();
  const linerGroup = new THREE.Group();
  const glassGroup = new THREE.Group();
  const furnitureGroup = new THREE.Group();
  const lightsGroup = new THREE.Group();
  const localColliders = [];

  const byWall = { south: [], north: [], east: [], west: [] };
  for (const win of exteriorWindows) byWall[win.wall]?.push(win);
  for (const door of exteriorDoors) {
    byWall[door.wall]?.push({ ...door, sill: door.bottom ?? 0, isDoor: true });
  }

  buildWallSegmentsAlongX(halfD, halfW, 0, totalHeight, t, byWall.south, shellGroup, linerGroup, glassGroup, localColliders, 1, palette);
  buildWallSegmentsAlongX(-halfD, halfW, 0, totalHeight, t, byWall.north, shellGroup, linerGroup, glassGroup, localColliders, -1, palette);
  buildWallSegmentsAlongZ(halfW, halfD, 0, totalHeight, t, byWall.east, shellGroup, linerGroup, glassGroup, localColliders, 1, palette);
  buildWallSegmentsAlongZ(-halfW, halfD, 0, totalHeight, t, byWall.west, shellGroup, linerGroup, glassGroup, localColliders, -1, palette);

  for (const partition of partitions) {
    buildPartition(partition, storyHeight, t, shellGroup, linerGroup, glassGroup, localColliders, palette);
  }

  const holesByFloor = new Map();
  for (const hole of floorHoles) {
    const list = holesByFloor.get(hole.floor) ?? [];
    list.push(hole);
    holesByFloor.set(hole.floor, list);
  }
  if (stairs) {
    const list = holesByFloor.get(stairs.topFloor) ?? [];
    list.push({ minX: stairs.minX, maxX: stairs.maxX, minZ: stairs.minZ, maxZ: stairs.maxZ });
    holesByFloor.set(stairs.topFloor, list);
  }

  for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
    const floorY = floorIndex * storyHeight + floorHeight;
    const holes = holesByFloor.get(floorIndex) ?? [];
    buildFloorDeck(insetW, insetD, floorY - floorHeight, floorHeight, holes, palette, linerGroup);

    const ceilingY = (floorIndex + 1) * storyHeight - 0.06 - 0.07;
    const beams = floorIndex === floorCount - 1 ? ceilingBeams : Math.min(ceilingBeams, 3);
    const ceiling = buildInteriorCeiling(insetW, insetD, ceilingY, palette, linerGroup, beams);

    for (const room of rooms.filter((r) => r.floor === floorIndex)) {
      const count = room.lightCount ?? defaultLightCountForRoom(room.width ?? insetW, room.depth ?? insetD);
      buildCeilingLights(room.x ?? 0, room.z ?? 0, (room.width ?? insetW) / 2 - 0.5, (room.depth ?? insetD) / 2 - 0.5, ceiling.bottomY, count, lightsGroup);
    }

    if (rooms.filter((r) => r.floor === floorIndex).length === 0) {
      buildCeilingLights(0, 0, halfW - 1, halfD - 1, ceiling.bottomY, defaultLightCountForRoom(insetW, insetD), lightsGroup);
    }
  }

  if (stairs) {
    buildStairMesh(stairs, storyHeight, palette, linerGroup);
  }

  const roof = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.28, depth),
      new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.9 }),
    ),
  );
  roof.position.set(0, totalHeight + 0.14, 0);
  shellGroup.add(roof);

  const portico = exteriorDoors.find((d) => d.wall === 'south');
  if (portico) {
    const porticoRoof = addShadowed(
      new THREE.Mesh(new THREE.BoxGeometry(portico.width + 2.4, 0.12, 1.8), shellMat(palette)),
    );
    porticoRoof.position.set(portico.offset, storyHeight * 0.55, halfD + 0.7);
    shellGroup.add(porticoRoof);
  }

  for (const piece of furniture) {
    const floorIndex = piece.floor ?? 0;
    const floorY = floorIndex * storyHeight + floorHeight;
    buildPlaceholderFurniture(
      piece.type, piece.x, piece.z, floorY, floorLevelForIndex(floorIndex),
      palette, furnitureGroup, localColliders,
    );
  }

  root.add(shellGroup);
  root.add(linerGroup);
  root.add(glassGroup);
  root.add(furnitureGroup);
  root.add(lightsGroup);

  const worldBoxes = localColliders.map((box) => ({
    minX: position.x + box.minX,
    maxX: position.x + box.maxX,
    minZ: position.z + box.minZ,
    maxZ: position.z + box.maxZ,
    level: box.level ?? 'all',
  }));

  function onStaircase(lx, lz) {
    if (!stairs) return false;
    return (
      lx >= stairs.minX &&
      lx <= stairs.maxX &&
      lz >= stairs.minZ &&
      lz <= stairs.maxZ
    );
  }

  function stairFloorY(lz) {
    const progress = THREE.MathUtils.clamp((stairs.maxZ - lz) / (stairs.maxZ - stairs.minZ), 0, 1);
    return progress * storyHeight + floorHeight;
  }

  function isInFloorHole(lx, lz, floorIndex) {
    const holes = holesByFloor.get(floorIndex) ?? [];
    return holes.some(
      (h) => lx >= h.minX && lx <= h.maxX && lz >= h.minZ && lz <= h.maxZ,
    );
  }

  function isInsideFootprint(lx, lz) {
    return Math.abs(lx) < halfW - 0.35 && Math.abs(lz) < halfD - 0.35;
  }

  function getFloorY(wx, wz, currentY = 1.7) {
    const lx = wx - position.x;
    const lz = wz - position.z;
    if (!isInsideFootprint(lx, lz)) return null;

    if (onStaircase(lx, lz)) {
      return stairFloorY(lz);
    }

    const preferUpper = currentY >= storyHeight + 0.8;
    const floorIndex = preferUpper ? floorCount - 1 : 0;
    if (isInFloorHole(lx, lz, floorIndex)) {
      if (preferUpper && floorIndex > 0) {
        return floorHeight;
      }
      return null;
    }

    return floorIndex * storyHeight + floorHeight;
  }

  const sectionGates = gates.map((gate) => ({
    ...gate,
    buildingPosition: position,
    storyHeight,
    floorHeight,
  }));

  return {
    group: root,
    id,
    colliders: { boxes: worldBoxes, circles: [] },
    getFloorY,
    storyHeight,
    footprint: { halfW, halfD, position },
    sectionGates,
  };
}