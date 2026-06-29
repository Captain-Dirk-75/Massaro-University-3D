import * as THREE from 'three';

// ── Tunable constants ──
export const GLASS_OPACITY = 0.18;
export const LINER_INSET = 0.03;
export const INTERIOR_FLOOR_HEIGHT = 0.14;
export const SHELL_COLOR = 0xd8d0c4;
export const LINER_COLOR = 0xe8e0d4;
export const INTERIOR_EMISSIVE = 0xfff0d8;
export const INTERIOR_EMISSIVE_INTENSITY = 0.12;
export const WOOD_COLOR = 0x8a7060;

const GLASS_RENDER_ORDER = 2;

/** Wall segments with bottom Y above this do not get walking colliders (door/window headers). */
const FLOOR_COLLIDER_MAX_Y = 0.15;

function segmentTouchesFloor(y1) {
  return y1 <= FLOOR_COLLIDER_MAX_Y;
}

function shellMat() {
  return new THREE.MeshStandardMaterial({
    color: SHELL_COLOR,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

function linerMat() {
  return new THREE.MeshStandardMaterial({
    color: LINER_COLOR,
    emissive: INTERIOR_EMISSIVE,
    emissiveIntensity: INTERIOR_EMISSIVE_INTENSITY,
    roughness: 0.92,
    metalness: 0,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

function glassMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xd8e8f4,
    transparent: true,
    opacity: GLASS_OPACITY,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.06,
    metalness: 0.02,
  });
}

function woodMat() {
  return new THREE.MeshStandardMaterial({
    color: WOOD_COLOR,
    roughness: 0.82,
    metalness: 0.02,
  });
}

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function openingsToRects(openings, wallH) {
  return openings.map((o) => {
    const bottom = o.sill ?? o.bottom ?? 0;
    const top = Math.min(bottom + o.height, wallH - 0.05);
    const half = o.width / 2;
    return {
      left: o.offset - half,
      right: o.offset + half,
      bottom,
      top,
      isDoor: o.isDoor ?? false,
    };
  });
}

function buildWallSegmentsAlongX(z, halfW, wallH, thickness, openings, shellGroup, linerGroup, glassGroup, colliderBoxes, sign) {
  const rects = openingsToRects(openings, wallH).sort((a, b) => a.left - b.left);
  const shellM = shellMat();
  const linerM = linerMat();
  const inset = LINER_INSET * sign;

  let cursor = -halfW;

  function addSegment(x1, x2, y1, y2) {
    if (x2 - x1 < 0.02 || y2 - y1 < 0.02) return;

    const w = x2 - x1;
    const h = y2 - y1;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    const shell = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, thickness), shellM));
    shell.position.set(cx, cy, z);
    shellGroup.add(shell);

    const liner = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, thickness * 0.6), linerM));
    liner.position.set(cx, cy, z - inset);
    linerGroup.add(liner);

    if (segmentTouchesFloor(y1)) {
      colliderBoxes.push({
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minZ: z - thickness / 2 - 0.05,
        maxZ: z + thickness / 2 + 0.05,
      });
    }
  }

  function addGlass(rect) {
    const w = rect.right - rect.left;
    const h = rect.top - rect.bottom;
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.bottom + rect.top) / 2;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat());
    glass.position.set(cx, cy, z - inset * 0.5);
    glass.rotation.y = sign > 0 ? Math.PI : 0;
    glass.renderOrder = GLASS_RENDER_ORDER;
    glassGroup.add(glass);
  }

  for (const rect of rects) {
    if (rect.left > cursor) addSegment(cursor, rect.left, 0, wallH);
    if (rect.top < wallH) addSegment(rect.left, rect.right, rect.top, wallH);
    if (rect.bottom > 0) addSegment(rect.left, rect.right, 0, rect.bottom);
    if (!rect.isDoor) addGlass(rect);
    cursor = rect.right;
  }

  if (cursor < halfW) addSegment(cursor, halfW, 0, wallH);
}

function buildWallSegmentsAlongZ(x, halfD, wallH, thickness, openings, shellGroup, linerGroup, glassGroup, colliderBoxes, sign) {
  const rects = openingsToRects(openings, wallH).sort((a, b) => a.left - b.left);
  const shellM = shellMat();
  const linerM = linerMat();
  const inset = LINER_INSET * sign;

  let cursor = -halfD;

  function addSegment(z1, z2, y1, y2) {
    if (z2 - z1 < 0.02 || y2 - y1 < 0.02) return;

    const d = z2 - z1;
    const h = y2 - y1;
    const cz = (z1 + z2) / 2;
    const cy = (y1 + y2) / 2;

    const shell = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(thickness, h, d), shellM));
    shell.position.set(x, cy, cz);
    shellGroup.add(shell);

    const liner = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(thickness * 0.6, h, d), linerM));
    liner.position.set(x - inset, cy, cz);
    linerGroup.add(liner);

    if (segmentTouchesFloor(y1)) {
      colliderBoxes.push({
        minX: x - thickness / 2 - 0.05,
        maxX: x + thickness / 2 + 0.05,
        minZ: cz - d / 2,
        maxZ: cz + d / 2,
      });
    }
  }

  function addGlass(rect) {
    const w = rect.right - rect.left;
    const h = rect.top - rect.bottom;
    const cz = (rect.left + rect.right) / 2;
    const cy = (rect.bottom + rect.top) / 2;
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat());
    glass.position.set(x - inset * 0.5, cy, cz);
    glass.rotation.y = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
    glass.renderOrder = GLASS_RENDER_ORDER;
    glassGroup.add(glass);
  }

  for (const rect of rects) {
    if (rect.left > cursor) addSegment(cursor, rect.left, 0, wallH);
    if (rect.top < wallH) addSegment(rect.left, rect.right, rect.top, wallH);
    if (rect.bottom > 0) addSegment(rect.left, rect.right, 0, rect.bottom);
    if (!rect.isDoor) addGlass(rect);
    cursor = rect.right;
  }

  if (cursor < halfD) addSegment(cursor, halfD, 0, wallH);
}

function buildFurniture(type, x, z, floorY, group, colliderBoxes) {
  const items = {
    table: () => {
      const top = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), woodMat()));
      top.position.set(x, floorY + 0.78, z);
      group.add(top);
      colliderBoxes.push({ minX: x - 0.85, maxX: x + 0.85, minZ: z - 0.5, maxZ: z + 0.5 });
    },
    chair: () => {
      const seat = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), woodMat()));
      seat.position.set(x, floorY + 0.48, z);
      group.add(seat);
      colliderBoxes.push({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35 });
    },
    bookshelf: () => {
      const shelf = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.2, 0.4), woodMat()));
      shelf.position.set(x, floorY + 1.1, z);
      group.add(shelf);
      colliderBoxes.push({ minX: x - 0.95, maxX: x + 0.95, minZ: z - 0.25, maxZ: z + 0.25 });
    },
  };
  items[type]?.();
}

/**
 * @param {object} opts
 * @param {string} opts.id
 * @param {{ x:number, y:number, z:number }} opts.position
 * @param {number} opts.width
 * @param {number} opts.depth
 * @param {number} opts.height
 * @param {number} [opts.wallThickness]
 * @param {number} [opts.floorHeight]
 * @param {{ wall:'south'|'north'|'east'|'west', width:number, height:number, offset:number, sill?:number, bottom?:number }} opts.door
 * @param {Array<{ wall:'south'|'north'|'east'|'west', width:number, height:number, offset:number, sill?:number }>} opts.windows
 * @param {Array<{ type:'table'|'chair'|'bookshelf', x:number, z:number }>} [opts.furniture]
 */
export function createBuilding(opts) {
  const {
    id,
    position,
    width,
    depth,
    height,
    wallThickness = 0.32,
    floorHeight = INTERIOR_FLOOR_HEIGHT,
    door,
    windows = [],
    furniture = [],
  } = opts;

  const root = new THREE.Group();
  root.position.set(position.x, position.y, position.z);
  root.userData.buildingId = id;

  const halfW = width / 2;
  const halfD = depth / 2;
  const wallH = height;
  const t = wallThickness;

  const shellGroup = new THREE.Group();
  const linerGroup = new THREE.Group();
  const glassGroup = new THREE.Group();
  const furnitureGroup = new THREE.Group();
  const localColliders = [];

  const byWall = { south: [], north: [], east: [], west: [] };
  for (const win of windows) byWall[win.wall]?.push(win);
  if (door) byWall[door.wall]?.push({ ...door, sill: door.bottom ?? 0, isDoor: true });

  buildWallSegmentsAlongX(halfD, halfW, wallH, t, byWall.south, shellGroup, linerGroup, glassGroup, localColliders, 1);
  buildWallSegmentsAlongX(-halfD, halfW, wallH, t, byWall.north, shellGroup, linerGroup, glassGroup, localColliders, -1);
  buildWallSegmentsAlongZ(halfW, halfD, wallH, t, byWall.east, shellGroup, linerGroup, glassGroup, localColliders, 1);
  buildWallSegmentsAlongZ(-halfW, halfD, wallH, t, byWall.west, shellGroup, linerGroup, glassGroup, localColliders, -1);

  const floor = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width - t * 2, floorHeight, depth - t * 2),
      new THREE.MeshStandardMaterial({ color: 0xc8b8a0, roughness: 0.9 }),
    ),
  );
  floor.position.set(0, floorHeight / 2, 0);
  linerGroup.add(floor);

  const roof = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.22, depth),
      new THREE.MeshStandardMaterial({ color: 0xb8a898, roughness: 0.9 }),
    ),
  );
  roof.position.set(0, height + 0.11, 0);
  roof.userData.isRoof = true;
  shellGroup.add(roof);

  for (const piece of furniture) {
    buildFurniture(piece.type, piece.x, piece.z, floorHeight, furnitureGroup, localColliders);
  }

  root.add(shellGroup);
  root.add(linerGroup);
  root.add(glassGroup);
  root.add(furnitureGroup);

  const margin = 0.35;
  const worldBoxes = localColliders.map((box) => ({
    minX: position.x + box.minX,
    maxX: position.x + box.maxX,
    minZ: position.z + box.minZ,
    maxZ: position.z + box.maxZ,
  }));

  function isInsideFootprint(wx, wz) {
    const lx = wx - position.x;
    const lz = wz - position.z;
    return (
      Math.abs(lx) < halfW - margin &&
      Math.abs(lz) < halfD - margin
    );
  }

  function getFloorY(wx, wz) {
    if (!isInsideFootprint(wx, wz)) return null;
    return floorHeight;
  }

  function updateRoof(cameraPos) {
    roof.visible = !isInsideFootprint(cameraPos.x, cameraPos.z);
  }

  return {
    group: root,
    id,
    colliders: { boxes: worldBoxes, circles: [] },
    getFloorY,
    updateRoof,
    roof,
    footprint: { halfW, halfD, position },
  };
}