import * as THREE from 'three';
import {
  addShadowed,
  buildCeilingLights,
  buildChandelier,
  buildFloorDeck,
  buildGalleryRailing,
  buildInteriorCeiling,
  buildSplitStairMesh,
  buildStairMesh,
  buildStraightStair,
  buildWallSconces,
  buildWallSegmentsAlongX,
  buildWallSegmentsAlongZ,
  createPalette,
  floorMat,
  shellMat,
  woodMat,
} from './buildingPrimitives.js';
import { buildClassicalFacade } from './classicalFacade.js';

export const DEFAULT_STORY_HEIGHT = 4.0;
export const DEFAULT_FLOOR_HEIGHT = 0.14;

function floorLevelForIndex(index) {
  return index === 0 ? 'ground' : 'upper';
}

function pointInRect(lx, lz, rect) {
  return (
    lx >= rect.minX &&
    lx <= rect.maxX &&
    lz >= rect.minZ &&
    lz <= rect.maxZ
  );
}

function buildPartition(
  partition, storyHeight, wallThickness, shellGroup, linerGroup, glassGroup,
  colliderBoxes, palette,
) {
  const { axis, at, spanMin, spanMax, floors, openings = [] } = partition;
  const spanHalf = (spanMax - spanMin) / 2;
  const spanCenter = (spanMin + spanMax) / 2;
  const colliderLevel = partition.colliderLevel ?? 'all';

  for (const floorIndex of floors) {
    const yBase = floorIndex * storyHeight;
    const doorOpenings = openings.map((o) => ({
      ...o,
      offset: o.at - spanCenter,
      isDoor: true,
      sill: o.bottom ?? 0,
    }));

    if (axis === 'z') {
      buildWallSegmentsAlongX(
        at, spanHalf, yBase, storyHeight, wallThickness, doorOpenings,
        shellGroup, linerGroup, glassGroup, colliderBoxes, 1, palette, colliderLevel, yBase,
      );
    } else {
      buildWallSegmentsAlongZ(
        at, spanHalf, yBase, storyHeight, wallThickness, doorOpenings,
        shellGroup, linerGroup, glassGroup, colliderBoxes, 1, palette, colliderLevel, yBase,
      );
    }
  }
}

function buildPlaceholderFurniture(type, x, z, floorY, level, palette, group, colliderBoxes, opts = {}) {
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
    serviceDesk: () => {
      const radius = opts.radius ?? 1.35;
      const height = opts.height ?? 1.05;
      const deskColor = palette.serviceDesk ?? 0xc8a882;
      const mat = new THREE.MeshStandardMaterial({ color: deskColor, roughness: 0.78, metalness: 0.02 });
      const desk = addShadowed(
        new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius, height, 20, 1, false, 0, Math.PI),
          mat,
        ),
      );
      desk.position.set(x, floorY + height / 2, z);
      desk.rotation.y = Math.PI / 2;
      group.add(desk);
      colliderBoxes.push({
        minX: x - 0.45 * (radius / 1.35),
        maxX: x + 0.45 * (radius / 1.35),
        minZ: z - radius,
        maxZ: z - 0.2,
        level,
      });
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

function holesForFloor(index, ceilingHoles, floorHoles) {
  const fromCeiling = (ceilingHoles ?? []).filter((h) => h.floor === index);
  const fromFloor = (floorHoles ?? []).filter((h) => h.floor === index);
  return [...fromCeiling, ...fromFloor].map(({ minX, maxX, minZ, maxZ }) => ({
    minX, maxX, minZ, maxZ,
  }));
}

function buildRoomLighting(room, floorIndex, storyHeight, floorHeight, totalHeight, ceiling, lightsGroup, palette) {
  const floorY = floorIndex * storyHeight + floorHeight;
  const halfW = (room.width ?? 12) / 2 - 0.5;
  const halfD = (room.depth ?? 10) / 2 - 0.5;
  const style = room.lightStyle ?? 'hanging';

  if (style === 'chandelier') {
    const list = room.chandeliers ?? [room.chandelier ?? { x: room.x ?? 0, z: room.z ?? 0 }];
    for (const c of list) {
      const hangY = c.fromY === 'total' ? totalHeight - 0.2 : ceiling.bottomY;
      buildChandelier(c.x, c.z, hangY, palette, lightsGroup, {
        cordLength: c.cordLength ?? 3.0,
      });
    }
    return;
  }

  if (style === 'sconce') {
    buildWallSconces(
      room.x ?? 0,
      room.z ?? 0,
      halfW,
      halfD,
      floorY,
      room.sconceHeight ?? 2.6,
      palette,
      lightsGroup,
      room.sconceCount ?? 2,
    );
    return;
  }

  const count = room.lightCount ?? defaultLightCountForRoom(room.width ?? 12, room.depth ?? 10);
  buildCeilingLights(room.x ?? 0, room.z ?? 0, halfW, halfD, ceiling.bottomY, count, lightsGroup);
}

function collectStairRects(stairs, splitStairs) {
  if (splitStairs) {
    return [splitStairs.main, splitStairs.left, splitStairs.right];
  }
  if (stairs) return [stairs];
  return [];
}

function splitStairFloorY(lx, lz, split, storyHeight, floorHeight) {
  const { main, left, right, landingY } = split;

  if (pointInRect(lx, lz, main)) {
    const t = THREE.MathUtils.clamp((main.maxZ - lz) / (main.maxZ - main.minZ), 0, 1);
    return t * landingY + floorHeight;
  }
  if (pointInRect(lx, lz, left)) {
    const t = THREE.MathUtils.clamp((left.maxZ - lz) / (left.maxZ - left.minZ), 0, 1);
    return landingY + t * (storyHeight - landingY) + floorHeight;
  }
  if (pointInRect(lx, lz, right)) {
    const t = THREE.MathUtils.clamp((right.maxZ - lz) / (right.maxZ - right.minZ), 0, 1);
    return landingY + t * (storyHeight - landingY) + floorHeight;
  }
  return null;
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
    splitStairs = null,
    straightStairs = [],
    floorHoles = [],
    ceilingHoles = [],
    galleryRailings = [],
    gates = [],
    rooms = [],
    furniture = [],
    ceilingBeams = 0,
    facade = null,
    hallVoid = null,
    floorPads = [],
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
  const facadeGroup = new THREE.Group();
  const localColliders = [];

  for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
    const yBase = floorIndex * storyHeight;
    const byWall = { south: [], north: [], east: [], west: [] };

    for (const win of exteriorWindows) {
      const winFloor = win.floor ?? (win.sill >= storyHeight ? 1 : 0);
      if (winFloor !== floorIndex) continue;
      const sill = (win.sill ?? 0) - winFloor * storyHeight;
      byWall[win.wall]?.push({ ...win, sill });
    }

    if (floorIndex === 0) {
      for (const door of exteriorDoors) {
        byWall[door.wall]?.push({ ...door, sill: door.bottom ?? 0, isDoor: true });
      }
    }

    buildWallSegmentsAlongX(halfD, halfW, yBase, storyHeight, t, byWall.south, shellGroup, linerGroup, glassGroup, localColliders, 1, palette, 'all', yBase);
    buildWallSegmentsAlongX(-halfD, halfW, yBase, storyHeight, t, byWall.north, shellGroup, linerGroup, glassGroup, localColliders, -1, palette, 'all', yBase);
    buildWallSegmentsAlongZ(halfW, halfD, yBase, storyHeight, t, byWall.east, shellGroup, linerGroup, glassGroup, localColliders, 1, palette, 'all', yBase);
    buildWallSegmentsAlongZ(-halfW, halfD, yBase, storyHeight, t, byWall.west, shellGroup, linerGroup, glassGroup, localColliders, -1, palette, 'all', yBase);
  }

  for (const partition of partitions) {
    buildPartition(partition, storyHeight, t, shellGroup, linerGroup, glassGroup, localColliders, palette);
  }

  const holesByFloor = new Map();
  for (const hole of floorHoles) {
    const list = holesByFloor.get(hole.floor) ?? [];
    list.push(hole);
    holesByFloor.set(hole.floor, list);
  }

  const stairTopFloor = splitStairs?.topFloor ?? stairs?.topFloor;
  for (const rect of collectStairRects(stairs, splitStairs)) {
    if (stairTopFloor == null) continue;
    const list = holesByFloor.get(stairTopFloor) ?? [];
    list.push({ minX: rect.minX, maxX: rect.maxX, minZ: rect.minZ, maxZ: rect.maxZ });
    holesByFloor.set(stairTopFloor, list);
  }

  for (let floorIndex = 0; floorIndex < floorCount; floorIndex++) {
    const floorY = floorIndex * storyHeight + floorHeight;
    const deckHoles = holesByFloor.get(floorIndex) ?? [];
    buildFloorDeck(insetW, insetD, floorY - floorHeight, floorHeight, deckHoles, palette, linerGroup);

    for (const pad of floorPads.filter((p) => p.floor === floorIndex)) {
      const pw = pad.maxX - pad.minX;
      const pd = pad.maxZ - pad.minZ;
      if (pw < 0.15 || pd < 0.15) continue;
      const slab = addShadowed(
        new THREE.Mesh(new THREE.BoxGeometry(pw, floorHeight, pd), floorMat(palette)),
      );
      slab.position.set(
        (pad.minX + pad.maxX) / 2,
        floorY - floorHeight + floorHeight / 2,
        (pad.minZ + pad.maxZ) / 2,
      );
      linerGroup.add(slab);
    }

    const ceilingY = (floorIndex + 1) * storyHeight - 0.06 - 0.07;
    // Beams only on the top (grand) ceiling — lower ceilings have the hall void
    // cut into them, so beams there would float over open air.
    const beams = floorIndex === floorCount - 1 ? ceilingBeams : 0;
    const ceiling = buildInteriorCeiling(
      insetW, insetD, ceilingY, palette, linerGroup, beams,
      holesForFloor(floorIndex, ceilingHoles, null),
    );

    const floorRooms = rooms.filter((r) => r.floor === floorIndex);
    for (const room of floorRooms) {
      buildRoomLighting(room, floorIndex, storyHeight, floorHeight, totalHeight, ceiling, lightsGroup, palette);
    }

    if (floorRooms.length === 0) {
      buildCeilingLights(0, 0, halfW - 1, halfD - 1, ceiling.bottomY, defaultLightCountForRoom(insetW, insetD), lightsGroup);
    }
  }

  if (splitStairs) {
    buildSplitStairMesh(splitStairs, storyHeight, palette, linerGroup);
  } else if (stairs) {
    buildStairMesh(stairs, storyHeight, palette, linerGroup);
  }

  for (const flight of straightStairs) {
    buildStraightStair(flight, storyHeight, palette, linerGroup, { steps: flight.steps });
  }

  if (galleryRailings.length > 0) {
    const galleryY = storyHeight + floorHeight;
    buildGalleryRailing(galleryRailings, galleryY, palette, linerGroup, localColliders);
  }

  const roof = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.28, depth),
      new THREE.MeshStandardMaterial({ color: palette.roof, roughness: 0.9 }),
    ),
  );
  roof.position.set(0, totalHeight + 0.14, 0);
  shellGroup.add(roof);

  if (facade) {
    const mainDoor = exteriorDoors.find((d) => d.wall === (facade.wall ?? 'south'));
    buildClassicalFacade({
      wall: facade.wall ?? 'south',
      halfW,
      halfD,
      totalHeight,
      storyHeight,
      palette,
      facadeGroup,
      config: {
        ...facade,
        doorClearWidth: facade.doorClearWidth ?? (mainDoor?.width ?? 3.6) + 0.6,
      },
    });
  } else {
    const portico = exteriorDoors.find((d) => d.wall === 'south');
    if (portico) {
      const porticoRoof = addShadowed(
        new THREE.Mesh(new THREE.BoxGeometry(portico.width + 2.4, 0.12, 1.8), shellMat(palette)),
      );
      porticoRoof.position.set(portico.offset, storyHeight * 0.55, halfD + 0.7);
      shellGroup.add(porticoRoof);
    }
  }

  for (const piece of furniture) {
    const floorIndex = piece.floor ?? 0;
    const floorY = floorIndex * storyHeight + floorHeight;
    buildPlaceholderFurniture(
      piece.type, piece.x, piece.z, floorY, floorLevelForIndex(floorIndex),
      palette, furnitureGroup, localColliders, piece,
    );
  }

  root.add(shellGroup);
  root.add(linerGroup);
  root.add(glassGroup);
  root.add(furnitureGroup);
  root.add(lightsGroup);
  root.add(facadeGroup);

  const worldBoxes = localColliders.map((box) => ({
    minX: position.x + box.minX,
    maxX: position.x + box.maxX,
    minZ: position.z + box.minZ,
    maxZ: position.z + box.maxZ,
    level: box.level ?? 'all',
  }));

  function straightStairAt(lx, lz) {
    for (const flight of straightStairs) {
      if (pointInRect(lx, lz, flight)) return flight;
    }
    return null;
  }

  function onStaircase(lx, lz) {
    if (straightStairAt(lx, lz)) return true;
    if (splitStairs) {
      return collectStairRects(null, splitStairs).some((rect) => pointInRect(lx, lz, rect));
    }
    if (!stairs) return false;
    return pointInRect(lx, lz, stairs);
  }

  function stairFloorY(lx, lz) {
    const flight = straightStairAt(lx, lz);
    if (flight) {
      // Straight run: floor at the south edge (maxZ), +storyHeight at the north edge (minZ).
      const progress = THREE.MathUtils.clamp((flight.maxZ - lz) / (flight.maxZ - flight.minZ), 0, 1);
      return progress * storyHeight + floorHeight;
    }
    if (splitStairs) {
      return splitStairFloorY(lx, lz, splitStairs, storyHeight, floorHeight);
    }
    if (!stairs) return floorHeight;
    const progress = THREE.MathUtils.clamp((stairs.maxZ - lz) / (stairs.maxZ - stairs.minZ), 0, 1);
    return progress * storyHeight + floorHeight;
  }

  function isInFloorHole(lx, lz, floorIndex) {
    const holes = holesByFloor.get(floorIndex) ?? [];
    return holes.some((h) => pointInRect(lx, lz, h));
  }

  function isInsideFootprint(lx, lz) {
    return Math.abs(lx) < halfW - 0.35 && Math.abs(lz) < halfD - 0.35;
  }

  function getFloorY(wx, wz, currentY = 1.7) {
    const lx = wx - position.x;
    const lz = wz - position.z;
    if (!isInsideFootprint(lx, lz)) return null;

    if (onStaircase(lx, lz)) {
      return stairFloorY(lx, lz);
    }

    const preferUpper = currentY >= storyHeight + 0.8;
    const floorIndex = preferUpper ? floorCount - 1 : 0;
    if (isInFloorHole(lx, lz, floorIndex)) {
      if (preferUpper && floorIndex > 0) {
        // Only the grand hall void drops to ground — stair wells keep the upper deck.
        if (hallVoid && pointInRect(lx, lz, hallVoid)) {
          return floorHeight;
        }
        return storyHeight + floorHeight;
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