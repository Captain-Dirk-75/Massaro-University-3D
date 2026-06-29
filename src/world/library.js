import * as THREE from 'three';
import { createBrickMaterial } from './procedural/brickMaterial.js';

// ── Mood knobs ──
export const STONE_COLOR = 0xe0d6c8;
export const STONE_DARK = 0xb8a898;
export const WINDOW_GLOW = 0xffe8c0;
export const WINDOW_GLOW_INTENSITY = 0.62;
export const ROOF_OVERHANG = 1.4;

const brickMat = () => createBrickMaterial(STONE_COLOR, STONE_DARK);

const stoneMat = () =>
  new THREE.MeshStandardMaterial({
    color: STONE_COLOR,
    roughness: 0.78,
    metalness: 0.03,
    flatShading: false,
  });

const stoneDarkMat = () =>
  new THREE.MeshStandardMaterial({
    color: STONE_DARK,
    roughness: 0.86,
    metalness: 0.0,
    flatShading: false,
  });

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createLatheColumn(height, radius) {
  const profile = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    let r = radius;
    if (t < 0.08) r = radius * (1.15 - t * 1.5);
    else if (t > 0.88) r = radius * (1.0 + (t - 0.88) * 2.8);
    else if (t > 0.12 && t < 0.2) r = radius * 0.92;
    profile.push(new THREE.Vector2(r, y));
  }

  const col = addShadowed(
    new THREE.Mesh(new THREE.LatheGeometry(profile, 16), stoneMat()),
  );

  const capital = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.45, radius * 1.05, 0.38, 14),
      stoneMat(),
    ),
  );
  capital.position.y = height + 0.19;
  col.add(capital);

  const base = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.15, radius * 1.4, 0.32, 14),
      stoneDarkMat(),
    ),
  );
  base.position.y = 0.16;
  col.add(base);

  return col;
}

function createExtrudedBlock(width, depth, height, bevel = 0.18, material = brickMat()) {
  const hw = width / 2;
  const hd = depth / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-hw + bevel, -hd);
  shape.lineTo(hw - bevel, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + bevel);
  shape.lineTo(hw, hd - bevel);
  shape.quadraticCurveTo(hw, hd, hw - bevel, hd);
  shape.lineTo(-hw + bevel, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - bevel);
  shape.lineTo(-hw, -hd + bevel);
  shape.quadraticCurveTo(-hw, -hd, -hw + bevel, -hd);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.12,
    bevelSize: 0.1,
    bevelSegments: 2,
    curveSegments: 8,
  });
  geo.rotateX(-Math.PI / 2);

  return addShadowed(new THREE.Mesh(geo, material));
}

function createArchedWindow(width, height) {
  const group = new THREE.Group();

  const frame = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.45, height + 0.45, 0.32),
      stoneDarkMat(),
    ),
  );
  frame.position.z = 0.1;
  group.add(frame);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 0.92, height * 0.78),
    new THREE.MeshStandardMaterial({
      color: 0x8ab0c8,
      emissive: WINDOW_GLOW,
      emissiveIntensity: WINDOW_GLOW_INTENSITY,
      roughness: 0.12,
      metalness: 0.12,
      transparent: true,
      opacity: 0.88,
    }),
  );
  glass.position.z = 0.3;
  group.add(glass);

  const arch = addShadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(width / 2, 0.16, 8, 20, Math.PI),
      stoneDarkMat(),
    ),
  );
  arch.position.y = height * 0.39;
  arch.position.z = 0.1;
  arch.rotation.x = Math.PI / 2;
  group.add(arch);

  const sill = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.7, 0.14, 0.45),
      stoneMat(),
    ),
  );
  sill.position.y = -height / 2 + 0.07;
  sill.position.z = 0.18;
  group.add(sill);

  return group;
}

function createWing(side) {
  const wing = new THREE.Group();
  const sign = side === 'left' ? -1 : 1;

  const body = createExtrudedBlock(7, 9, 8.5, 0.25);
  body.position.set(sign * 17.5, 0, -1.5);
  wing.add(body);

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-3.8, 0);
  roofShape.lineTo(3.8, 0);
  roofShape.lineTo(3.2, 2.2);
  roofShape.lineTo(-3.2, 2.2);
  roofShape.closePath();

  const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
    depth: 9.2,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 1,
  });
  roofGeo.rotateY(Math.PI / 2);
  roofGeo.translate(0, 8.6, 0);

  const roof = addShadowed(new THREE.Mesh(roofGeo, stoneDarkMat()));
  roof.position.set(sign * 17.5, 0, -1.5);
  wing.add(roof);

  for (let i = 0; i < 3; i++) {
    const col = createLatheColumn(6.8, 0.28);
    col.position.set(sign * (17.5 + sign * 2.4), 0, -3.5 + i * 3.2);
    wing.add(col);
  }

  return wing;
}

/**
 * Elegant library entrance — extruded forms, lathe columns, arched facade.
 */
export function buildLibrary(area) {
  const library = new THREE.Group();
  library.position.set(area.position.x, area.position.y, area.position.z);
  library.userData.campusAreaId = area.id;

  const facadeWidth = 30;
  const facadeHeight = 11;
  const porticoDepth = 5.2;

  const mainWall = createExtrudedBlock(facadeWidth, 1.4, facadeHeight, 0.2);
  mainWall.position.set(0, 0, -0.7);
  library.add(mainWall);

  const pedimentShape = new THREE.Shape();
  pedimentShape.moveTo(-facadeWidth / 2 - 0.5, 0);
  pedimentShape.lineTo(facadeWidth / 2 + 0.5, 0);
  pedimentShape.lineTo(0, 1.8);
  pedimentShape.closePath();

  const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, {
    depth: 1.6,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.08,
    bevelSegments: 2,
  });
  pedimentGeo.rotateX(-Math.PI / 2);
  pedimentGeo.translate(0, facadeHeight, 0.1);

  const pediment = addShadowed(new THREE.Mesh(pedimentGeo, stoneMat()));
  library.add(pediment);

  const roof = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth + ROOF_OVERHANG * 2, 0.45, 4.2),
      stoneDarkMat(),
    ),
  );
  roof.position.set(0, facadeHeight + 0.9, -0.4);
  library.add(roof);

  const porticoFloor = createExtrudedBlock(facadeWidth - 2.5, porticoDepth, 0.22, 0.12);
  porticoFloor.position.set(0, 0, porticoDepth / 2 - 0.6);
  library.add(porticoFloor);

  const entablature = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth - 0.8, 0.55, porticoDepth + 0.5),
      brickMat(),
    ),
  );
  entablature.position.set(0, 7.9, porticoDepth / 2 - 0.25);
  library.add(entablature);

  const columnCount = 6;
  const columnSpacing = (facadeWidth - 6) / (columnCount - 1);
  for (let i = 0; i < columnCount; i++) {
    const col = createLatheColumn(7.4, 0.34);
    col.position.set(-(facadeWidth - 6) / 2 + i * columnSpacing, 0, 2.9);
    library.add(col);
  }

  const doorArch = addShadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.2, 10, 24, Math.PI),
      stoneDarkMat(),
    ),
  );
  doorArch.position.set(0, 3.7, 2.7);
  doorArch.rotation.x = Math.PI / 2;
  library.add(doorArch);

  const doorFrame = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.6, 0.28),
      stoneDarkMat(),
    ),
  );
  doorFrame.position.set(0, 1.8, 2.55);
  library.add(doorFrame);

  const entranceGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, 3.1),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  entranceGlass.position.set(0, 1.75, 2.78);
  library.add(entranceGlass);

  const facadeGlasses = [];
  const windowPositions = [-9, -3, 3, 9];
  for (const x of windowPositions) {
    const win = createArchedWindow(3.5, 4.6);
    win.position.set(x, 6.1, 0.75);
    library.add(win);
    const glass = win.children.find((child) => child.isMesh && child.geometry.type === 'PlaneGeometry');
    if (glass) facadeGlasses.push(glass);
  }

  const steps = [6, 4.5, 3];
  const stepRun = 1.05;
  const stepBaseZ = 4.6;
  steps.forEach((width, i) => {
    const step = createExtrudedBlock(width, 1.1, 0.2, 0.08);
    const runIndex = steps.length - 1 - i;
    step.position.set(0, 0.22 * (i + 1), stepBaseZ + runIndex * stepRun);
    library.add(step);
  });

  library.add(createWing('left'));
  library.add(createWing('right'));

  return { group: library, entranceGlass, facadeGlasses };
}