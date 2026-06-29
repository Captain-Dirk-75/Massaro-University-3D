import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, hashSeed } from './procedural/random.js';
import { foliageColor, applyVertexColor } from './procedural/colors.js';
import { sampleGroundHeight, isStonePath } from './ground.js';

// ── Mood knobs ──
export const FOLIAGE_SWAY_AMOUNT = 0.045;
export const FOLIAGE_SWAY_SPEED = 0.65;
export const TREE_COUNT_TARGET = 42;
export const TRUNK_COLOR = 0x6b4f3e;
export const LEAVES_PER_TREE = 18;
export const BRANCHES_PER_TREE_MIN = 3;

const TRUNK_MATERIAL = new THREE.MeshStandardMaterial({
  color: TRUNK_COLOR,
  roughness: 0.94,
  metalness: 0.0,
  flatShading: true,
});

const FOLIAGE_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.92,
  metalness: 0.0,
  flatShading: true,
});

const LEAF_MATERIAL = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 0.9,
  metalness: 0.0,
  flatShading: true,
  side: THREE.DoubleSide,
});

function isExcluded(wx, wz) {
  if (isStonePath(wx, wz)) return true;
  if (wz < -10 && Math.abs(wx) < 18) return true;
  if (Math.hypot(wx, wz + 18) < 7) return true;
  return false;
}

function fallbackFoliageGeometry(radius, seed) {
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  applyVertexColor(geo, foliageColor(seededRandom(seed), 0.08));
  return geo;
}

function safeMerge(geometries, fallbackRadius, scale, seed = 1) {
  const valid = geometries.filter(Boolean);
  if (valid.length === 0) {
    return fallbackFoliageGeometry(fallbackRadius, seed);
  }
  const merged = mergeGeometries(valid, true);
  if (!merged) {
    return fallbackFoliageGeometry(fallbackRadius, seed);
  }
  merged.computeBoundingSphere();
  return merged;
}

function buildCanopyGeometry(scale, seed) {
  const rand = seededRandom(seed);
  const pieces = [];
  const layers = 3 + Math.floor(rand() * 2);

  for (let i = 0; i < layers; i++) {
    const radius = Math.max(
      scale * 0.35,
      scale * (1.35 - i * 0.22) * (0.88 + rand() * 0.28),
    );
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    applyVertexColor(geo, foliageColor(rand, 0.1));

    const layerY = i === 0 ? radius : i * scale * 0.36 + radius;
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(
      (rand() - 0.5) * scale * 0.35,
      layerY,
      (rand() - 0.5) * scale * 0.35,
    );
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  return safeMerge(pieces, scale * 1.1, scale);
}

function buildBranchGeometry(scale, trunkH, seed) {
  const rand = seededRandom(seed + 31);
  const count = BRANCHES_PER_TREE_MIN + Math.floor(rand() * 3);
  const pieces = [];

  for (let b = 0; b < count; b++) {
    const heightT = 0.3 + rand() * 0.5;
    const len = scale * (0.45 + rand() * 0.55);
    const geo = new THREE.CylinderGeometry(
      0.018 * scale,
      0.055 * scale,
      len,
      5,
    );
    geo.translate(0, len / 2, 0);
    geo.rotateZ(Math.PI / 2 + (rand() - 0.5) * 0.45);
    geo.rotateY(rand() * Math.PI * 2);

    const matrix = new THREE.Matrix4();
    matrix.setPosition(0, trunkH * heightT, 0);
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  return safeMerge(pieces, scale * 0.2, scale);
}

function buildLeafGeometry(scale, seed) {
  const rand = seededRandom(seed + 99);
  const pieces = [];

  for (let i = 0; i < LEAVES_PER_TREE; i++) {
    const leafScale = scale * (0.12 + rand() * 0.1);
    const geo = new THREE.ConeGeometry(leafScale * 0.5, leafScale * 1.4, 3);
    geo.rotateX(Math.PI / 2);
    applyVertexColor(geo, foliageColor(rand, 0.12));

    const theta = rand() * Math.PI * 2;
    const phi = rand() * Math.PI * 0.55;
    const dist = scale * (0.55 + rand() * 0.75);
    const y = scale * (0.7 + rand() * 1.1);

    const matrix = new THREE.Matrix4();
    matrix.makeRotationY(theta);
    matrix.setPosition(
      Math.sin(phi) * Math.cos(theta) * dist,
      y,
      Math.sin(phi) * Math.sin(theta) * dist,
    );
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  return safeMerge(pieces, scale * 0.15, scale);
}

function createTree(treeDef) {
  const { x, z, scale, seed, lean } = treeDef;
  const rand = seededRandom(seed);
  const trunkH = (2.4 + rand() * 2.2) * scale;
  const y = sampleGroundHeight(x, z);
  const rotY = rand() * Math.PI * 2;
  const canopySink = scale * 0.12;

  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.rotation.set(lean.x, rotY, lean.z);

  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.2, 1, 8, 1);
  trunkGeo.translate(0, 0.5, 0);
  const trunk = new THREE.Mesh(trunkGeo, TRUNK_MATERIAL);
  trunk.scale.set(scale, trunkH, scale);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const branches = new THREE.Mesh(
    buildBranchGeometry(scale, trunkH, seed),
    TRUNK_MATERIAL,
  );
  branches.castShadow = true;
  tree.add(branches);

  const crown = new THREE.Group();
  crown.position.y = trunkH - canopySink;
  crown.frustumCulled = false;

  const canopy = new THREE.Mesh(
    buildCanopyGeometry(scale, seed + 17),
    FOLIAGE_MATERIAL,
  );
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  canopy.frustumCulled = false;
  crown.add(canopy);

  const leaves = new THREE.Mesh(
    buildLeafGeometry(scale, seed + 53),
    LEAF_MATERIAL,
  );
  leaves.castShadow = true;
  leaves.frustumCulled = false;
  crown.add(leaves);

  crown.userData.swayPhase = rand() * Math.PI * 2;
  crown.userData.swayAmount = FOLIAGE_SWAY_AMOUNT * (0.65 + rand() * 0.7);
  tree.add(crown);

  const perch = {
    x,
    y: y + trunkH + scale * 0.9,
    z,
    label: 'tree',
  };

  return { tree, crown, perch };
}

function createBushInstances(bushDefs) {
  const group = new THREE.Group();
  const swayTargets = [];

  for (const def of bushDefs) {
    const { x, z, scale, seed } = def;
    const rand = seededRandom(seed);
    const clusters = 2 + Math.floor(rand() * 2);
    const y = sampleGroundHeight(x, z);
    const pieces = [];

    for (let c = 0; c < clusters; c++) {
      const r = scale * (0.32 + rand() * 0.28);
      const geo = new THREE.IcosahedronGeometry(r, 0);
      applyVertexColor(geo, foliageColor(rand, 0.06));

      const matrix = new THREE.Matrix4();
      matrix.setPosition(
        (rand() - 0.5) * scale * 0.7,
        r * 0.55,
        (rand() - 0.5) * scale * 0.7,
      );
      geo.applyMatrix4(matrix);
      pieces.push(geo);
    }

    const bush = new THREE.Mesh(
      safeMerge(pieces, scale * 0.4, scale),
      FOLIAGE_MATERIAL,
    );
    bush.position.set(x, y, z);
    bush.castShadow = true;
    bush.receiveShadow = true;
    bush.userData.swayPhase = rand() * Math.PI * 2;
    bush.userData.swayAmount = FOLIAGE_SWAY_AMOUNT * 0.45;
    group.add(bush);
    swayTargets.push(bush);
  }

  return { group, swayTargets };
}

function scatterTrees() {
  const rand = seededRandom(42);
  const trees = [];
  const anchorSpots = [
    [-24, 10], [-20, 20], [-16, -2], [-28, -4], [-22, -16],
    [24, 10], [20, 18], [16, -4], [28, 2], [22, -14],
    [-12, 24], [12, 24], [-10, -18], [10, -18], [0, 26],
    [-32, 12], [32, 12], [-30, -12], [30, -10],
    [-36, 0], [36, 0], [-8, 14], [8, 14],
  ];

  for (const [ax, az] of anchorSpots) {
    const x = ax + (rand() - 0.5) * 3.5;
    const z = az + (rand() - 0.5) * 3.5;
    if (isExcluded(x, z)) continue;

    trees.push({
      x,
      z,
      scale: 0.9 + rand() * 0.75,
      seed: hashSeed(x, z),
      lean: {
        x: (rand() - 0.5) * 0.06,
        z: (rand() - 0.5) * 0.06,
      },
    });
  }

  while (trees.length < TREE_COUNT_TARGET) {
    const x = (rand() - 0.5) * 58;
    const z = (rand() - 0.5) * 52;
    if (isExcluded(x, z)) continue;

    const tooClose = trees.some(
      (t) => Math.hypot(t.x - x, t.z - z) < 3.2,
    );
    if (tooClose) continue;

    trees.push({
      x,
      z,
      scale: 0.75 + rand() * 0.65,
      seed: hashSeed(x, z) + trees.length,
      lean: {
        x: (rand() - 0.5) * 0.08,
        z: (rand() - 0.5) * 0.08,
      },
    });
  }

  return trees;
}

function scatterBushes() {
  const rand = seededRandom(200);
  const bushes = [];

  for (let i = 0; i < 32; i++) {
    const x = (rand() - 0.5) * 54;
    const z = (rand() - 0.5) * 48;
    if (isExcluded(x, z)) continue;

    bushes.push({
      x,
      z,
      scale: 0.55 + rand() * 0.55,
      seed: 300 + i,
    });
  }

  return bushes;
}

export function createNature() {
  const treeDefs = scatterTrees();
  const bushes = scatterBushes();

  const group = new THREE.Group();
  const swayTargets = [];
  const perches = [];

  for (const def of treeDefs) {
    const { tree, crown, perch } = createTree(def);
    group.add(tree);
    swayTargets.push(crown);
    perches.push(perch);
  }

  const bushResult = createBushInstances(bushes);
  group.add(bushResult.group);
  swayTargets.push(...bushResult.swayTargets);

  return { group, swayTargets, perches };
}