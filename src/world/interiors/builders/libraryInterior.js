import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from '../../procedural/random.js';
import { createInteriorColliders } from '../interiorCollisions.js';

// ── Mood knobs ──
export const FLOOR_COLOR = 0xc8b8a0;
export const WALL_COLOR = 0xe8e0d4;
export const WOOD_COLOR = 0x9a8068;
export const BOOK_COLOR = 0x6a5848;
export const WINDOW_GLOW = 0xffe8c8;
export const INTERIOR_AMBIENT = 0xfff4e8;
export const INTERIOR_AMBIENT_INTENSITY = 0.32;
export const INTERIOR_POINT_INTENSITY = 0.85;
export const INTERIOR_POINT_WARMTH = 0xffd8a0;

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

  const walls = [
    [0, wallH / 2, -hd, room.width, wallH, wallThickness],
    [0, wallH / 2, hd, room.width, wallH, wallThickness],
    [-hw, wallH / 2, 0, wallThickness, wallH, room.depth],
    [hw, wallH / 2, 0, wallThickness, wallH, room.depth],
  ];

  for (const [x, y, z, w, wh, d] of walls) {
    const wall = addShadowed(
      new THREE.Mesh(new THREE.BoxGeometry(w, wh, d), wallMat()),
    );
    wall.position.set(x, y, z);
    group.add(wall);
  }

  const windowRows = [-8, 0, 8];
  for (const wx of windowRows) {
    for (const side of [-1, 1]) {
      const wz = side * (hd - 0.2);
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 2.4),
        new THREE.MeshStandardMaterial({
          color: 0xb8d0e0,
          emissive: WINDOW_GLOW,
          emissiveIntensity: 0.55,
          roughness: 0.15,
          transparent: true,
          opacity: 0.82,
        }),
      );
      glass.position.set(wx, 2.8, wz);
      glass.rotation.y = side > 0 ? Math.PI : 0;
      group.add(glass);

      const light = new THREE.PointLight(INTERIOR_POINT_WARMTH, 0.45, 14);
      light.position.set(wx, 3.2, wz - side * 0.8);
      group.add(light);
    }
  }

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
    collider: { minX: -2.3, maxX: 2.3, minZ: 7.6, maxZ: 9.4 },
  };
}

function buildReadingStation(x, z, rotY) {
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
    },
  };
}

function buildBookshelves(room, count) {
  const group = new THREE.Group();
  const unitGeo = new THREE.BoxGeometry(2.4, 2.8, 0.38);
  const shelfGeo = new THREE.BoxGeometry(2.2, 0.06, 0.32);
  const bookGeometries = [];

  const hw = room.width / 2 - 0.8;
  const hd = room.depth / 2 - 0.8;
  const placements = [];
  const rand = seededRandom(1209);

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
    unit.position.set(place.x, 1.45, place.z);
    unit.rotation.y = place.rotY;
    group.add(unit);

    for (let s = 0; s < 4; s++) {
      const shelf = addShadowed(new THREE.Mesh(shelfGeo, woodMat()));
      shelf.position.set(place.x, 0.55 + s * 0.65, place.z);
      shelf.rotation.y = place.rotY;
      group.add(shelf);

      for (let b = 0; b < 5 + Math.floor(rand() * 3); b++) {
        const bh = 0.22 + rand() * 0.18;
        const book = new THREE.BoxGeometry(0.14, bh, 0.22);
        const matrix = new THREE.Matrix4();
        const localX = -0.85 + b * 0.32;
        const localY = 0.62 + s * 0.65;
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
    new THREE.Mesh(new THREE.BoxGeometry(stepW, 0.18, 2.4), woodMat()),
  );
  landing.position.set(-10, stepCount * stepH + 0.09, -6 - stepCount * stepD - 0.8);
  stairs.add(landing);

  const railMat = new THREE.MeshStandardMaterial({ color: 0xb0a090, roughness: 0.8 });
  const rail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, stepCount * stepD + 2), railMat),
  );
  rail.position.set(-8.4, stepCount * stepH * 0.5, -6 - stepCount * stepD * 0.5);
  stairs.add(rail);

  const upperWall = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 2.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.9 }),
    ),
  );
  upperWall.position.set(-10, stepCount * stepH + 1.2, -6 - stepCount * stepD - 1.8);
  stairs.add(upperWall);

  return {
    group: stairs,
    collider: {
      minX: -11.8,
      maxX: -8.2,
      minZ: -12.5,
      maxZ: -4.5,
    },
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

  return group;
}

export function buildLibraryInterior(definition) {
  const root = new THREE.Group();
  const room = definition.room;
  const furniture = definition.furniture ?? {};
  const colliderBoxes = [];

  root.add(buildShell(room));
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
  colliderBoxes.push(stairs.collider);

  root.add(buildRug());
  root.add(buildPlant());

  const doorFrame = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.4, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.88 }),
    ),
  );
  doorFrame.position.set(0, 1.7, room.depth / 2 - 0.12);
  root.add(doorFrame);

  return {
    group: root,
    colliders: createInteriorColliders(room, colliderBoxes),
  };
}