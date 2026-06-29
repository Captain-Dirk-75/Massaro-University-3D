import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from '../../procedural/random.js';
import { createInteriorColliders } from '../interiorCollisions.js';
import { getLibraryFloorY, LIBRARY_STORY_HEIGHT, LIBRARY_STAIR_HOLE } from '../interiorFloors.js';
import { SUN_COLOR, SUN_INTENSITY } from '../../lighting.js';

// ── Mood knobs ──
export const FLOOR_COLOR = 0xb8a888;
export const WALL_COLOR = 0xe8e0d4;
export const PANEL_COLOR = 0x7a6048;
export const WOOD_COLOR = 0x6a5040;
export const BOOK_COLOR = 0x5a4838;
export const INTERIOR_AMBIENT = 0xfff4e8;
export const INTERIOR_AMBIENT_INTENSITY = 0.34;
export const INTERIOR_POINT_INTENSITY = 0.9;
export const INTERIOR_POINT_WARMTH = 0xffd8a0;

const STAIR_HOLE = LIBRARY_STAIR_HOLE;
const DECK_EDGE_X = STAIR_HOLE.maxX;

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function woodMat(color = WOOD_COLOR) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.78,
    metalness: 0.03,
  });
}

function wallMat() {
  return new THREE.MeshStandardMaterial({
    color: WALL_COLOR,
    roughness: 0.92,
    metalness: 0.0,
  });
}

function panelMat() {
  return new THREE.MeshStandardMaterial({
    color: PANEL_COLOR,
    roughness: 0.82,
    metalness: 0.02,
  });
}

function addWindowFrame(group, wx, wy, wz, side, frameMat) {
  const fw = 3.4;
  const fh = 2.6;
  const bar = 0.14;
  const inset = side * 0.06;

  const top = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(fw, bar, 0.08), frameMat));
  top.position.set(wx, wy + fh / 2 - bar / 2, wz - inset);
  top.rotation.y = side > 0 ? Math.PI : 0;
  group.add(top);

  const bottom = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(fw, bar, 0.08), frameMat));
  bottom.position.set(wx, wy - fh / 2 + bar / 2, wz - inset);
  bottom.rotation.y = side > 0 ? Math.PI : 0;
  group.add(bottom);

  const left = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(bar, fh, 0.08), frameMat));
  left.position.set(wx - fw / 2 + bar / 2, wy, wz - inset);
  left.rotation.y = side > 0 ? Math.PI : 0;
  group.add(left);

  const right = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(bar, fh, 0.08), frameMat));
  right.position.set(wx + fw / 2 - bar / 2, wy, wz - inset);
  right.rotation.y = side > 0 ? Math.PI : 0;
  group.add(right);

  const mullion = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(bar, fh - bar * 2, 0.06), frameMat));
  mullion.position.set(wx, wy, wz - inset);
  mullion.rotation.y = side > 0 ? Math.PI : 0;
  group.add(mullion);
}

function buildShell(room) {
  const group = new THREE.Group();
  const hw = room.width / 2;
  const hd = room.depth / 2;
  const h = room.height;
  const story = LIBRARY_STORY_HEIGHT;
  const windows = [];
  const wallThickness = 0.35;
  const frameMat = woodMat(0x8a7060);

  const floor = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(room.width, 0.2, room.depth),
      new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.88 }),
    ),
  );
  floor.position.y = 0.1;
  group.add(floor);

  const topCeiling = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(room.width, 0.24, room.depth),
      new THREE.MeshStandardMaterial({ color: 0xf0ebe2, roughness: 0.92 }),
    ),
  );
  topCeiling.position.y = h - 0.12;
  group.add(topCeiling);

  const doorW = 3.6;
  const doorH = 3.4;

  function addWallSegment(x, y, z, w, wh, d) {
    const wall = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, wh, d), wallMat()));
    wall.position.set(x, y, z);
    group.add(wall);
  }

  addWallSegment(0, h / 2, -hd, room.width, h - 0.2, wallThickness);

  const southSideW = (room.width - doorW) / 2;
  addWallSegment(-doorW / 2 - southSideW / 2, h / 2, hd, southSideW, h - 0.2, wallThickness);
  addWallSegment(doorW / 2 + southSideW / 2, h / 2, hd, southSideW, h - 0.2, wallThickness);
  addWallSegment(0, doorH + (h - doorH) / 2, hd, doorW, h - doorH - 0.2, wallThickness);

  addWallSegment(-hw, h / 2, 0, wallThickness, h - 0.2, room.depth);
  addWallSegment(hw, h / 2, 0, wallThickness, h - 0.2, room.depth);

  for (let floorIdx = 0; floorIdx < 2; floorIdx++) {
    const wy = 1.9 + floorIdx * story;
    const windowRows = [-8, 0, 8];
    const glassGeo = new THREE.PlaneGeometry(3.0, 2.2);

    for (const wx of windowRows) {
      for (const side of [-1, 1]) {
        const wz = side * (hd - 0.18);
        const glass = new THREE.Mesh(glassGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
        glass.position.set(wx, wy, wz);
        glass.rotation.y = side > 0 ? Math.PI : 0;
        group.add(glass);

        addWindowFrame(group, wx, wy, wz, side, frameMat);

        windows.push({
          mesh: glass,
          localPosition: new THREE.Vector3(wx, wy, wz - side * 0.2),
          outwardNormal: new THREE.Vector3(0, 0, side),
        });
      }
    }
  }

  for (const side of [-1, 1]) {
    const wz = side * (hd - 0.5);
    const ledge = addShadowed(
      new THREE.Mesh(new THREE.BoxGeometry(room.width - 2, 0.12, 0.35), woodMat(0x9a8068)),
    );
    ledge.position.set(0, story - 0.06, wz);
    group.add(ledge);
  }

  return { group, windows };
}

function buildWainscoting(room) {
  const group = new THREE.Group();
  const hw = room.width / 2 - 0.5;
  const hd = room.depth / 2 - 0.5;
  const h = 1.35;

  const segments = [
    [0, -hd + 0.2, room.width - 2, 0.35],
    [0, hd - 0.2, room.width - 2, 0.35],
    [-hw + 0.2, 0, 0.35, room.depth - 2],
    [hw - 0.2, 0, 0.35, room.depth - 2],
  ];

  for (const [x, z, w, d] of segments) {
    const panel = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), panelMat()));
    panel.position.set(x, h / 2, z);
    group.add(panel);
  }

  return group;
}

function addDeckSlab(group, w, d, cx, cz, y, deckMat, undersideMat) {
  const slab = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), deckMat));
  slab.position.set(cx, y + 0.1, cz);
  group.add(slab);

  const under = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), undersideMat));
  under.position.set(cx, y - 0.03, cz);
  group.add(under);
}

function buildFloorDeck(room) {
  const group = new THREE.Group();
  const hw = room.width / 2;
  const hd = room.depth / 2;
  const y = LIBRARY_STORY_HEIGHT;
  const deckMat = new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.88 });
  const undersideMat = new THREE.MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.94 });
  const westW = hw - DECK_EDGE_X;
  const westCx = (-hw + DECK_EDGE_X) / 2;
  const eastW = hw - DECK_EDGE_X;
  const eastCx = (DECK_EDGE_X + hw) / 2;

  addDeckSlab(group, eastW, hd * 2, eastCx, 0, y, deckMat, undersideMat);

  const westNorthD = hd + STAIR_HOLE.minZ;
  addDeckSlab(group, westW, westNorthD, westCx, (STAIR_HOLE.minZ - hd) / 2, y, deckMat, undersideMat);

  const westSouthD = hd - STAIR_HOLE.maxZ;
  addDeckSlab(group, westW, westSouthD, westCx, (hd + STAIR_HOLE.maxZ) / 2, y, deckMat, undersideMat);

  buildStairwellTrim(group, y);

  return group;
}

function buildStairwellTrim(group, deckY) {
  const trimMat = woodMat(0x9a8068);
  const holeW = STAIR_HOLE.maxX - STAIR_HOLE.minX;
  const holeD = STAIR_HOLE.maxZ - STAIR_HOLE.minZ;
  const cx = (STAIR_HOLE.minX + STAIR_HOLE.maxX) / 2;
  const cz = (STAIR_HOLE.minZ + STAIR_HOLE.maxZ) / 2;
  const barH = 0.14;

  const northBar = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(holeW, barH, 0.12), trimMat));
  northBar.position.set(cx, deckY + 0.18, STAIR_HOLE.minZ);
  group.add(northBar);

  const southBar = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(holeW, barH, 0.12), trimMat));
  southBar.position.set(cx, deckY + 0.18, STAIR_HOLE.maxZ);
  group.add(southBar);

  const westBar = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, barH, holeD), trimMat));
  westBar.position.set(STAIR_HOLE.minX, deckY + 0.18, cz);
  group.add(westBar);

  const eastBar = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, barH, holeD), trimMat));
  eastBar.position.set(STAIR_HOLE.maxX, deckY + 0.18, cz);
  group.add(eastBar);
}

function buildColumns(room) {
  const group = new THREE.Group();
  const hd = room.depth / 2;
  const colGeo = new THREE.CylinderGeometry(0.28, 0.32, LIBRARY_STORY_HEIGHT - 0.3, 12);
  const capGeo = new THREE.BoxGeometry(0.72, 0.18, 0.72);

  for (const x of [-5, 5]) {
    for (const z of [-hd + 4, hd - 6]) {
      const col = addShadowed(new THREE.Mesh(colGeo, panelMat()));
      col.position.set(x, (LIBRARY_STORY_HEIGHT - 0.3) / 2, z);
      group.add(col);

      const cap = addShadowed(new THREE.Mesh(capGeo, woodMat(0x9a8068)));
      cap.position.set(x, LIBRARY_STORY_HEIGHT - 0.2, z);
      group.add(cap);
    }
  }

  return group;
}

function buildExitDoorway(room) {
  const group = new THREE.Group();
  const hd = room.depth / 2;

  const mat = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 0.06, 2.4),
      new THREE.MeshStandardMaterial({
        color: 0x4a8a58,
        emissive: 0x2a5a38,
        emissiveIntensity: 0.4,
        roughness: 0.9,
      }),
    ),
  );
  mat.position.set(0, 0.23, hd - 1.8);
  group.add(mat);

  const arrow = addShadowed(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 0.8, 3),
      new THREE.MeshStandardMaterial({
        color: 0xe8f0e8,
        emissive: 0xa8d8b0,
        emissiveIntensity: 0.55,
        roughness: 0.7,
      }),
    ),
  );
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0, 0.44, hd - 1.5);
  group.add(arrow);

  const frame = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 3.8, 0.22),
      woodMat(0x9a8068),
    ),
  );
  frame.position.set(0, 1.9, hd - 0.1);
  group.add(frame);

  const signBacking = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.6, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x2a5a38,
        emissive: 0x1a4028,
        emissiveIntensity: 0.45,
        roughness: 0.85,
      }),
    ),
  );
  signBacking.position.set(0, 3.35, hd - 0.22);
  group.add(signBacking);

  const signText = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.3, 0.06),
      new THREE.MeshStandardMaterial({
        color: 0xf0fff0,
        emissive: 0xc8f0c8,
        emissiveIntensity: 0.9,
        roughness: 0.5,
      }),
    ),
  );
  signText.position.set(0, 3.35, hd - 0.14);
  group.add(signText);

  const portalGlow = new THREE.PointLight(0xa8e8b0, 0.6, 10);
  portalGlow.position.set(0, 2.2, hd - 0.6);
  group.add(portalGlow);

  return group;
}

function buildStairLandingMarker(y, labelColor, arrowDir) {
  const group = new THREE.Group();
  const mat = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.05, 1.8),
      new THREE.MeshStandardMaterial({
        color: labelColor,
        emissive: labelColor,
        emissiveIntensity: 0.25,
        roughness: 0.9,
      }),
    ),
  );
  mat.position.y = 0.12;
  group.add(mat);

  const arrow = addShadowed(
    new THREE.Mesh(
      new THREE.ConeGeometry(0.3, 0.65, 3),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.35,
        roughness: 0.6,
      }),
    ),
  );
  arrow.rotation.x = arrowDir === 'up' ? Math.PI : -Math.PI / 2;
  if (arrowDir === 'down') arrow.rotation.x = Math.PI / 2;
  arrow.position.set(0, 0.38, arrowDir === 'up' ? 0.35 : -0.35);
  group.add(arrow);

  group.position.y = y;
  return group;
}

function buildStaircase(room) {
  const stairs = new THREE.Group();
  const stepCount = 18;
  const stepW = 2.6;
  const stepD = 0.38;
  const stepH = LIBRARY_STORY_HEIGHT / stepCount;
  const startZ = 5.5;
  const startX = -11.5;

  for (let i = 0; i < stepCount; i++) {
    const step = addShadowed(
      new THREE.Mesh(new THREE.BoxGeometry(stepW, stepH, stepD), woodMat()),
    );
    step.position.set(startX, stepH / 2 + i * stepH, startZ - i * stepD);
    stairs.add(step);
  }

  const topY = stepCount * stepH;
  const topZ = startZ - stepCount * stepD;

  const landing = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(stepW + 1.2, 0.18, 2.6), woodMat()),
  );
  landing.position.set(startX + 0.4, topY + 0.09, topZ - 0.9);
  stairs.add(landing);

  const railMat = woodMat(0x9a8068);
  const railLen = stepCount * stepD + 2.2;
  const railMidZ = startZ - (stepCount * stepD) / 2;

  const eastRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, railLen), railMat),
  );
  eastRail.position.set(startX + stepW / 2 + 0.05, topY * 0.52, railMidZ);
  stairs.add(eastRail);

  const westRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, railLen), railMat),
  );
  westRail.position.set(startX - stepW / 2 - 0.05, topY * 0.52, railMidZ);
  stairs.add(westRail);

  const upperRail = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(stepW + 1.4, 0.9, 0.1), railMat),
  );
  upperRail.position.set(startX + 0.4, topY + 0.55, topZ - 0.4);
  stairs.add(upperRail);

  const downMarker = buildStairLandingMarker(topY, 0x4a68a8, 'down');
  downMarker.position.set(startX + 0.4, topY, topZ - 0.2);
  stairs.add(downMarker);

  const upMarker = buildStairLandingMarker(0, 0x6a8a58, 'up');
  upMarker.position.set(startX, 0, startZ + 1.2);
  stairs.add(upMarker);

  return {
    group: stairs,
    colliders: [
      { minX: -12.95, maxX: -12.55, minZ: -4.2, maxZ: 6.4, level: 'all' },
      { minX: -10.45, maxX: -10.05, minZ: -4.2, maxZ: 6.4, level: 'all' },
    ],
  };
}

function buildReceptionDesk() {
  const desk = new THREE.Group();
  const top = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 1.5), woodMat()));
  top.position.y = 1.08;
  desk.add(top);

  const front = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.05, 0.58), woodMat()));
  front.position.set(0, 0.52, 0.44);
  desk.add(front);

  desk.position.set(0, 0, 8);
  return {
    group: desk,
    collider: { minX: -2.4, maxX: 2.4, minZ: 7.1, maxZ: 8.9, level: 'ground' },
  };
}

function buildReadingStation(x, z, rotY, level = 'ground') {
  const station = new THREE.Group();
  const table = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.95), woodMat()));
  table.position.y = 0.78;
  station.add(table);

  const legGeo = new THREE.BoxGeometry(0.1, 0.78, 0.1);
  for (const [lx, lz] of [[-0.7, -0.34], [0.7, -0.34], [-0.7, 0.34], [0.7, 0.34]]) {
    const leg = addShadowed(new THREE.Mesh(legGeo, woodMat()));
    leg.position.set(lx, 0.39, lz);
    station.add(leg);
  }

  station.position.set(x, 0, z);
  station.rotation.y = rotY;
  return {
    group: station,
    collider: { minX: x - 1.05, maxX: x + 1.05, minZ: z - 1.15, maxZ: z + 1.15, level },
  };
}

function buildTallBookshelves(room, count, yBase = 0, shelfH = 3.2, level = 'ground') {
  const group = new THREE.Group();
  const unitGeo = new THREE.BoxGeometry(2.6, shelfH, 0.42);
  const shelfGeo = new THREE.BoxGeometry(2.4, 0.07, 0.36);
  const bookGeometries = [];
  const hw = room.width / 2 - 0.9;
  const hd = room.depth / 2 - 0.9;
  const rand = seededRandom(1209 + yBase * 50);
  const shelves = Math.max(4, Math.floor(shelfH / 0.72));

  for (let i = 0; i < count; i++) {
    const wall = i % 4;
    let x;
    let z;
    let rotY = 0;

    if (wall === 0) {
      x = -hw;
      z = -hd + 4 + (i % 3) * 5;
      rotY = Math.PI / 2;
    } else if (wall === 1) {
      x = hw;
      z = -hd + 4 + (i % 3) * 5;
      rotY = -Math.PI / 2;
    } else if (wall === 2) {
      x = -8 + (i % 4) * 5.5;
      z = -hd;
      rotY = 0;
    } else {
      x = -8 + (i % 4) * 5.5;
      z = hd - 5;
      rotY = Math.PI;
    }

    const unit = addShadowed(new THREE.Mesh(unitGeo, woodMat()));
    unit.position.set(x, yBase + shelfH / 2, z);
    unit.rotation.y = rotY;
    group.add(unit);

    for (let s = 0; s < shelves; s++) {
      const shelf = addShadowed(new THREE.Mesh(shelfGeo, woodMat()));
      shelf.position.set(x, yBase + 0.45 + s * 0.72, z);
      shelf.rotation.y = rotY;
      group.add(shelf);

      for (let b = 0; b < 5 + Math.floor(rand() * 4); b++) {
        const bh = 0.24 + rand() * 0.2;
        const book = new THREE.BoxGeometry(0.15, bh, 0.24);
        const matrix = new THREE.Matrix4();
        const localX = -0.95 + b * 0.34;
        const localY = yBase + 0.52 + s * 0.72;
        matrix.makeRotationY(rotY);
        const offset = new THREE.Vector3(localX, localY, 0.06);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY);
        matrix.setPosition(x + offset.x, offset.y, z + offset.z);
        book.applyMatrix4(matrix);
        bookGeometries.push(book);
      }
    }
  }

  if (bookGeometries.length > 0) {
    group.add(
      addShadowed(
        new THREE.Mesh(
          mergeGeometries(bookGeometries, false),
          new THREE.MeshStandardMaterial({ color: BOOK_COLOR, roughness: 0.92, flatShading: true }),
        ),
      ),
    );
  }

  return group;
}

function buildUpperGallery(room) {
  const group = new THREE.Group();
  const y = LIBRARY_STORY_HEIGHT;
  const hw = room.width / 2 - 0.6;
  const hd = room.depth / 2 - 0.6;
  const railMat = woodMat(0x9a8068);
  const railH = 1.0;
  const railY = y + railH / 2 + 0.2;

  const rails = [
    [0, -hd + 0.3, hw * 2 - 1.2, 0.1],
    [0, hd - 1.2, hw * 2 - 1.2, 0.1],
    [-hw + 0.3, 0, 0.1, hd * 2 - 2.4],
    [hw - 0.3, 0, 0.1, hd * 2 - 2.4],
  ];

  for (const [x, z, w, d] of rails) {
    const rail = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, railH, d), railMat));
    rail.position.set(x, railY, z);
    group.add(rail);
  }

  group.add(buildTallBookshelves(room, 6, y, 2.8, 'upper'));

  const upperDesk = buildReadingStation(-6, 4, Math.PI, 'upper');
  upperDesk.group.position.y = y;
  group.add(upperDesk.group);

  const chandelier = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.7, 0.4, 10, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xf0e8d8,
        emissive: INTERIOR_POINT_WARMTH,
        emissiveIntensity: 0.3,
        roughness: 0.75,
        side: THREE.DoubleSide,
      }),
    ),
  );
  chandelier.position.set(0, room.height - 1.2, 0);
  group.add(chandelier);

  return { group, colliders: [upperDesk.collider] };
}

function buildRug() {
  const rug = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.04, 3.6),
      new THREE.MeshStandardMaterial({ color: 0x9a8878, roughness: 0.95 }),
    ),
  );
  rug.position.set(2, 0.22, -1);
  return rug;
}

function buildHangingLights(room, yBase, count = 4) {
  const group = new THREE.Group();
  const positions = [
    [-6, -4], [6, -4], [-6, 4], [6, 4],
  ].slice(0, count);

  for (const [x, z] of positions) {
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.9 }),
    );
    cord.position.set(x, yBase + 3.2, z);
    group.add(cord);

    const shade = addShadowed(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.44, 0.38, 12, 1, true),
        new THREE.MeshStandardMaterial({
          color: 0xf0e8d8,
          emissive: INTERIOR_POINT_WARMTH,
          emissiveIntensity: 0.28,
          roughness: 0.75,
          side: THREE.DoubleSide,
        }),
      ),
    );
    shade.position.set(x, yBase + 2.45, z);
    group.add(shade);

    const light = new THREE.PointLight(INTERIOR_POINT_WARMTH, INTERIOR_POINT_INTENSITY, 18);
    light.position.set(x, yBase + 2.3, z);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    group.add(light);
  }

  return group;
}

function buildLighting(room) {
  const group = new THREE.Group();
  group.add(new THREE.AmbientLight(INTERIOR_AMBIENT, INTERIOR_AMBIENT_INTENSITY));
  group.add(new THREE.HemisphereLight(0xfff0e0, 0xc8b8a0, 0.4));

  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY * 0.5);
  sun.position.set(42, 26, 38);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 100;
  sun.shadow.camera.left = -35;
  sun.shadow.camera.right = 35;
  sun.shadow.camera.top = 35;
  sun.shadow.camera.bottom = -35;
  group.add(sun);

  return group;
}

export function buildLibraryInterior(definition) {
  const root = new THREE.Group();
  const room = definition.room;
  const furniture = definition.furniture ?? {};
  const colliderBoxes = [];
  const hw = room.width / 2 - 0.45;
  const hd = room.depth / 2 - 0.45;

  const shell = buildShell(room);
  root.add(shell.group);
  root.add(buildWainscoting(room));
  root.add(buildColumns(room));
  root.add(buildFloorDeck(room));
  root.add(buildExitDoorway(room));
  root.add(buildLighting(room));
  root.add(buildHangingLights(room, 0, 4));
  root.add(buildHangingLights(room, LIBRARY_STORY_HEIGHT, 3));

  const reception = buildReceptionDesk();
  root.add(reception.group);
  colliderBoxes.push(reception.collider);

  const deskSpots = [
    [-5, 1, 0], [5, 1, Math.PI], [-5, -3, 0], [5, -3, Math.PI],
    [-2, -6, Math.PI / 2], [2, -6, -Math.PI / 2],
  ];
  const deskCount = furniture.readingDesks ?? 6;
  for (let i = 0; i < Math.min(deskCount, deskSpots.length); i++) {
    const [x, z, rot] = deskSpots[i];
    const station = buildReadingStation(x, z, rot);
    root.add(station.group);
    colliderBoxes.push(station.collider);
  }

  root.add(buildTallBookshelves(room, furniture.bookshelfRuns ?? 10));

  const stairs = buildStaircase(room);
  root.add(stairs.group);
  colliderBoxes.push(...stairs.colliders);

  const gallery = buildUpperGallery(room);
  root.add(gallery.group);
  colliderBoxes.push(...gallery.colliders);

  root.add(buildRug());

  return {
    group: root,
    colliders: createInteriorColliders(room, colliderBoxes, {
      upperBounds: { minX: -hw, maxX: hw, minZ: -hd, maxZ: hd },
    }),
    windows: shell.windows,
    getFloorY: getLibraryFloorY,
  };
}