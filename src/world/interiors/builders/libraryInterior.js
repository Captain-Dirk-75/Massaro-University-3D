import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from '../../procedural/random.js';
import { createInteriorColliders } from '../interiorCollisions.js';
import { getLibraryFloorY, LIBRARY_SECOND_FLOOR_Y } from '../interiorFloors.js';
import { SUN_COLOR, SUN_INTENSITY } from '../../lighting.js';

// ── Mood knobs ──
export const FLOOR_COLOR = 0xc8b8a0;
export const WALL_COLOR = 0xe8e0d4;
export const WOOD_COLOR = 0x9a8068;
export const BOOK_COLOR = 0x6a5848;
export const INTERIOR_AMBIENT = 0xfff4e8;
export const INTERIOR_AMBIENT_INTENSITY = 0.32;
export const INTERIOR_POINT_INTENSITY = 0.85;
export const INTERIOR_POINT_WARMTH = 0xffd8a0;

const MEZZANINE_BOUNDS = {
  minX: -13.4,
  maxX: -3.6,
  minZ: -11.8,
  maxZ: -1.8,
};

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function woodMat() {
  return new THREE.MeshStandardMaterial({
    color: WOOD_COLOR,
    roughness: 0.82,
    metalness: 0.02,
  });
}

function wallMat() {
  return new THREE.MeshStandardMaterial({
    color: WALL_COLOR,
    roughness: 0.9,
    metalness: 0.0,
  });
}

function buildShell(room) {
  const group = new THREE.Group();
  const hw = room.width / 2;
  const hd = room.depth / 2;
  const h = room.height;
  const windows = [];

  const floor = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(room.width, 0.18, room.depth),
      new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.88 }),
    ),
  );
  floor.position.y = 0.09;
  group.add(floor);

  const ceiling = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(room.width, 0.22, room.depth),
      new THREE.MeshStandardMaterial({ color: 0xf0ebe2, roughness: 0.92 }),
    ),
  );
  ceiling.position.y = h - 0.11;
  group.add(ceiling);

  const wallThickness = 0.35;
  const wallH = h - 0.2;
  const doorW = 3.6;
  const doorH = 3.2;

  const northWall = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(room.width, wallH, wallThickness), wallMat()),
  );
  northWall.position.set(0, wallH / 2, -hd);
  group.add(northWall);

  const southLeftW = (room.width - doorW) / 2;
  const southRightW = southLeftW;
  const southLeft = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(southLeftW, wallH, wallThickness), wallMat()),
  );
  southLeft.position.set(-doorW / 2 - southLeftW / 2, wallH / 2, hd);
  group.add(southLeft);

  const southRight = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(southRightW, wallH, wallThickness), wallMat()),
  );
  southRight.position.set(doorW / 2 + southRightW / 2, wallH / 2, hd);
  group.add(southRight);

  const southLint = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(doorW, wallH - doorH, wallThickness), wallMat()),
  );
  southLint.position.set(0, doorH + (wallH - doorH) / 2, hd);
  group.add(southLint);

  const westWall = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, room.depth), wallMat()),
  );
  westWall.position.set(-hw, wallH / 2, 0);
  group.add(westWall);

  const eastWall = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallH, room.depth), wallMat()),
  );
  eastWall.position.set(hw, wallH / 2, 0);
  group.add(eastWall);

  const windowRows = [-8, 0, 8];
  const glassGeo = new THREE.PlaneGeometry(3.2, 2.4);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xd0c8bc, roughness: 0.85 });

  for (const wx of windowRows) {
    for (const side of [-1, 1]) {
      const wz = side * (hd - 0.2);
      const glass = new THREE.Mesh(
        glassGeo,
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.08,
          metalness: 0.05,
          transparent: true,
          opacity: 0.15,
        }),
      );
      glass.position.set(wx, 2.8, wz);
      glass.rotation.y = side > 0 ? Math.PI : 0;
      group.add(glass);

      const frame = addShadowed(
        new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.6, 0.1), frameMat),
      );
      frame.position.set(wx, 2.8, wz - side * 0.05);
      frame.rotation.y = side > 0 ? Math.PI : 0;
      group.add(frame);

      const normal = new THREE.Vector3(0, 0, side);
      windows.push({
        mesh: glass,
        localPosition: new THREE.Vector3(wx, 2.8, wz - side * 0.15),
        outwardNormal: normal,
      });
    }
  }

  return { group, windows };
}

function buildExitDoorway(room) {
  const group = new THREE.Group();
  const hd = room.depth / 2;

  const mat = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.06, 2.2),
      new THREE.MeshStandardMaterial({
        color: 0x4a8a58,
        emissive: 0x2a5a38,
        emissiveIntensity: 0.35,
        roughness: 0.9,
      }),
    ),
  );
  mat.position.set(0, 0.23, hd - 1.6);
  group.add(mat);

  const arrow = addShadowed(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.7, 3),
      new THREE.MeshStandardMaterial({
        color: 0xe8f0e8,
        emissive: 0xa8d8b0,
        emissiveIntensity: 0.5,
        roughness: 0.7,
      }),
    ),
  );
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0, 0.42, hd - 1.35);
  group.add(arrow);

  const frame = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 3.5, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xc8b8a0, roughness: 0.82 }),
    ),
  );
  frame.position.set(0, 1.75, hd - 0.08);
  group.add(frame);

  const signBacking = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.55, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x2a5a38,
        emissive: 0x1a4028,
        emissiveIntensity: 0.4,
        roughness: 0.85,
      }),
    ),
  );
  signBacking.position.set(0, 3.15, hd - 0.2);
  group.add(signBacking);

  const signText = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.28, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0xf0fff0,
        emissive: 0xc8f0c8,
        emissiveIntensity: 0.85,
        roughness: 0.5,
      }),
    ),
  );
  signText.position.set(0, 3.15, hd - 0.12);
  group.add(signText);

  const portalGlow = new THREE.PointLight(0xa8e8b0, 0.55, 8);
  portalGlow.position.set(0, 2.2, hd - 0.5);
  group.add(portalGlow);

  return group;
}

function buildReceptionDesk() {
  const desk = new THREE.Group();
  const top = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 1.4), woodMat()),
  );
  top.position.y = 1.05;
  desk.add(top);

  const front = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 0.55), woodMat()),
  );
  front.position.set(0, 0.5, 0.42);
  desk.add(front);

  const panel = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.7, 0.08),
      new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.85 }),
    ),
  );
  panel.position.set(0, 1.45, 0.48);
  desk.add(panel);

  desk.position.set(0, 0, 8.5);
  return {
    group: desk,
    collider: { minX: -2.3, maxX: 2.3, minZ: 7.6, maxZ: 9.4, level: 'ground' },
  };
}

function buildReadingStation(x, z, rotY, level = 'ground') {
  const station = new THREE.Group();
  const table = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), woodMat()),
  );
  table.position.y = 0.78;
  station.add(table);

  const legGeo = new THREE.BoxGeometry(0.1, 0.78, 0.1);
  for (const [lx, lz] of [[-0.65, -0.32], [0.65, -0.32], [-0.65, 0.32], [0.65, 0.32]]) {
    const leg = addShadowed(new THREE.Mesh(legGeo, woodMat()));
    leg.position.set(lx, 0.39, lz);
    station.add(leg);
  }

  const chair = new THREE.Group();
  const seat = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), woodMat()));
  seat.position.y = 0.48;
  chair.add(seat);
  const back = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.08), woodMat()));
  back.position.set(0, 0.78, -0.24);
  chair.add(back);
  chair.position.set(0, 0, 0.85);
  station.add(chair);

  station.position.set(x, 0, z);
  station.rotation.y = rotY;
  return {
    group: station,
    collider: {
      minX: x - 1.0,
      maxX: x + 1.0,
      minZ: z - 1.1,
      maxZ: z + 1.1,
      level,
    },
  };
}

function buildBookshelves(room, count, yOffset = 0, level = 'ground') {
  const group = new THREE.Group();
  const unitGeo = new THREE.BoxGeometry(2.4, 2.8, 0.38);
  const shelfGeo = new THREE.BoxGeometry(2.2, 0.06, 0.32);
  const bookGeometries = [];

  const hw = room.width / 2 - 0.8;
  const hd = room.depth / 2 - 0.8;
  const placements = [];
  const rand = seededRandom(1209 + yOffset * 100);

  for (let i = 0; i < count; i++) {
    const wall = i % 4;
    let x;
    let z;
    let rotY = 0;

    if (wall === 0) {
      x = -hw;
      z = -hd + 3 + (i % 3) * 4.5;
      rotY = Math.PI / 2;
    } else if (wall === 1) {
      x = hw;
      z = -hd + 3 + (i % 3) * 4.5;
      rotY = -Math.PI / 2;
    } else if (wall === 2) {
      x = -8 + (i % 4) * 5;
      z = -hd;
      rotY = 0;
    } else {
      x = -8 + (i % 4) * 5;
      z = hd - 4;
      rotY = Math.PI;
    }

    placements.push({ x, z, rotY });
  }

  for (const place of placements) {
    const unit = addShadowed(new THREE.Mesh(unitGeo, woodMat()));
    unit.position.set(place.x, 1.45 + yOffset, place.z);
    unit.rotation.y = place.rotY;
    group.add(unit);

    for (let s = 0; s < 4; s++) {
      const shelf = addShadowed(new THREE.Mesh(shelfGeo, woodMat()));
      shelf.position.set(place.x, 0.55 + s * 0.65 + yOffset, place.z);
      shelf.rotation.y = place.rotY;
      group.add(shelf);

      for (let b = 0; b < 5 + Math.floor(rand() * 3); b++) {
        const bh = 0.22 + rand() * 0.18;
        const book = new THREE.BoxGeometry(0.14, bh, 0.22);
        const matrix = new THREE.Matrix4();
        const localX = -0.85 + b * 0.32;
        const localY = 0.62 + s * 0.65 + yOffset;
        matrix.makeRotationY(place.rotY);
        const offset = new THREE.Vector3(localX, localY, 0.05);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), place.rotY);
        matrix.setPosition(place.x + offset.x, offset.y, place.z + offset.z);
        book.applyMatrix4(matrix);
        bookGeometries.push(book);
      }
    }
  }

  if (bookGeometries.length > 0) {
    const merged = mergeGeometries(bookGeometries, false);
    const books = addShadowed(
      new THREE.Mesh(
        merged,
        new THREE.MeshStandardMaterial({
          color: BOOK_COLOR,
          roughness: 0.92,
          flatShading: true,
        }),
      ),
    );
    group.add(books);
  }

  return group;
}

function buildStaircase() {
  const stairs = new THREE.Group();
  const stepCount = 10;
  const stepW = 2.8;
  const stepD = 0.38;
  const stepH = 0.22;

  for (let i = 0; i < stepCount; i++) {
    const step = addShadowed(
      new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), woodMat()),
    );
    step.position.set(-10, stepH / 2 + i * stepH, -6 - i * stepD);
    stairs.add(step);
  }

  const landing = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(stepW + 2.4, 0.18, 3.2), woodMat()),
  );
  landing.position.set(-8.8, stepCount * stepH + 0.09, -6 - stepCount * stepD - 1.2);
  stairs.add(landing);

  const railMat = new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.8 });
  const rail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, stepCount * stepD + 2.8), railMat),
  );
  rail.position.set(-8.4, stepCount * stepH * 0.5, -6 - stepCount * stepD * 0.5);
  stairs.add(rail);

  const leftRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, stepCount * stepD + 2.8), railMat),
  );
  leftRail.position.set(-11.6, stepCount * stepH * 0.5, -6 - stepCount * stepD * 0.5);
  stairs.add(leftRail);

  return {
    group: stairs,
    colliders: [
      { minX: -11.9, maxX: -11.5, minZ: -12.5, maxZ: -4.5, level: 'all' },
      { minX: -8.1, maxX: -7.7, minZ: -12.5, maxZ: -4.5, level: 'all' },
    ],
  };
}

function buildSecondFloor(room) {
  const group = new THREE.Group();
  const floorY = LIBRARY_SECOND_FLOOR_Y;
  const { minX, maxX, minZ, maxZ } = MEZZANINE_BOUNDS;
  const width = maxX - minX;
  const depth = maxZ - minZ;

  const platform = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.16, depth),
      new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.88 }),
    ),
  );
  platform.position.set((minX + maxX) / 2, floorY + 0.08, (minZ + maxZ) / 2);
  group.add(platform);

  const underside = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.08, depth),
      new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.92 }),
    ),
  );
  underside.position.set((minX + maxX) / 2, floorY - 0.04, (minZ + maxZ) / 2);
  group.add(underside);

  const railMat = new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.8 });
  const railH = 0.9;
  const railY = floorY + railH / 2 + 0.16;

  const eastRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(width, railH, 0.08), railMat),
  );
  eastRail.position.set((minX + maxX) / 2, railY, maxZ);
  group.add(eastRail);

  const westRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(depth, railH, 0.08), railMat),
  );
  westRail.position.set(minX, railY, (minZ + maxZ) / 2);
  westRail.rotation.y = Math.PI / 2;
  group.add(westRail);

  const southRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(width * 0.55, railH, 0.08), railMat),
  );
  southRail.position.set(minX + width * 0.28, railY, minZ);
  group.add(southRail);

  group.add(buildBookshelves(room, 3, floorY, 'upper'));

  const upperDesk = buildReadingStation(-7, -5, Math.PI / 2, 'upper');
  upperDesk.group.position.y = floorY;
  group.add(upperDesk.group);

  return {
    group,
    colliders: [upperDesk.collider],
  };
}

function buildRug() {
  const rug = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.04, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xb8a898, roughness: 0.95 }),
    ),
  );
  rug.position.set(2, 0.2, 0);
  return rug;
}

function buildPlant() {
  const plant = new THREE.Group();
  const pot = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.34, 0.42, 10),
      new THREE.MeshStandardMaterial({ color: 0xa89078, roughness: 0.88 }),
    ),
  );
  pot.position.y = 0.21;
  plant.add(pot);

  const foliage = addShadowed(
    new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.45, 1),
      new THREE.MeshStandardMaterial({
        color: 0x5a8a58,
        roughness: 0.92,
        flatShading: true,
      }),
    ),
  );
  foliage.position.y = 0.75;
  plant.add(foliage);

  plant.position.set(5.5, 0, 6);
  return plant;
}

function buildHangingLights(room) {
  const group = new THREE.Group();
  const positions = [
    [-6, 0], [0, 0], [6, 0],
    [-6, -8], [6, -8],
  ];

  for (const [x, z] of positions) {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.9 }),
    );
    cord.position.set(x, room.height - 0.7, z);
    group.add(cord);

    const shade = addShadowed(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.42, 0.35, 12, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xf0e8d8,
          emissive: INTERIOR_POINT_WARMTH,
          emissiveIntensity: 0.25,
          roughness: 0.75,
          side: THREE.DoubleSide,
        }),
      ),
    );
    shade.position.set(x, room.height - 1.35, z);
    group.add(shade);

    const light = new THREE.PointLight(INTERIOR_POINT_WARMTH, INTERIOR_POINT_INTENSITY, 16);
    light.position.set(x, room.height - 1.5, z);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    group.add(light);
  }

  return group;
}

function buildLighting(room) {
  const group = new THREE.Group();
  group.add(new THREE.AmbientLight(INTERIOR_AMBIENT, INTERIOR_AMBIENT_INTENSITY));

  const fill = new THREE.HemisphereLight(0xfff0e0, 0xc8b8a0, 0.38);
  group.add(fill);

  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY * 0.55);
  sun.position.set(42, 26, 38);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 80;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  group.add(sun);

  return group;
}

export function buildLibraryInterior(definition) {
  const root = new THREE.Group();
  const room = definition.room;
  const furniture = definition.furniture ?? {};
  const colliderBoxes = [];

  const shell = buildShell(room);
  root.add(shell.group);
  root.add(buildExitDoorway(room));
  root.add(buildLighting(room));
  root.add(buildHangingLights(room));

  const reception = buildReceptionDesk();
  root.add(reception.group);
  colliderBoxes.push(reception.collider);

  const deskCount = furniture.readingDesks ?? 6;
  const deskSpots = [
    [-5, 2, 0], [5, 2, Math.PI], [-5, -2, 0], [5, -2, Math.PI],
    [-2, -5, Math.PI / 2], [2, -5, -Math.PI / 2],
  ];
  for (let i = 0; i < Math.min(deskCount, deskSpots.length); i++) {
    const [x, z, rot] = deskSpots[i];
    const station = buildReadingStation(x, z, rot);
    root.add(station.group);
    colliderBoxes.push(station.collider);
  }

  root.add(buildBookshelves(room, furniture.bookshelfRuns ?? 8));

  const stairs = buildStaircase();
  root.add(stairs.group);
  colliderBoxes.push(...stairs.colliders);

  const secondFloor = buildSecondFloor(room);
  root.add(secondFloor.group);
  colliderBoxes.push(...secondFloor.colliders);

  root.add(buildRug());
  root.add(buildPlant());

  return {
    group: root,
    colliders: createInteriorColliders(room, colliderBoxes, {
      upperBounds: MEZZANINE_BOUNDS,
    }),
    windows: shell.windows,
    getFloorY: getLibraryFloorY,
  };
}