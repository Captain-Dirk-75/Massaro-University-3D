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

function isExcluded(wx, wz) {
  if (isStonePath(wx, wz)) return true;
  if (wz < -10 && Math.abs(wx) < 18) return true;
  if (Math.hypot(wx, wz + 18) < 7) return true;
  return false;
}

function buildCanopyGeometry(scale, seed) {
  const rand = seededRandom(seed);
  const pieces = [];
  const layers = 3 + Math.floor(rand() * 2);

  for (let i = 0; i < layers; i++) {
    const radius = scale * (1.35 - i * 0.22) * (0.88 + rand() * 0.28);
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    const color = foliageColor(rand, 0.1);
    applyVertexColor(geo, color);

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

  return mergeGeometries(pieces, true);
}

function createTreeInstances(treeDefs) {
  const nature = new THREE.Group();
  const swayTargets = [];
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.2, 1, 7, 1);
  trunkGeo.translate(0, 0.5, 0);
  const trunkMesh = new THREE.InstancedMesh(
    trunkGeo,
    TRUNK_MATERIAL,
    treeDefs.length,
  );
  trunkMesh.castShadow = true;
  trunkMesh.receiveShadow = true;

  const dummy = new THREE.Object3D();

  for (let i = 0; i < treeDefs.length; i++) {
    const { x, z, scale, seed, lean } = treeDefs[i];
    const rand = seededRandom(seed);
    const trunkH = (2.4 + rand() * 2.2) * scale;
    const y = sampleGroundHeight(x, z);

    dummy.position.set(x, y, z);
    dummy.rotation.set(lean.x, rand() * Math.PI * 2, lean.z);
    dummy.scale.set(scale, trunkH, scale);
    dummy.updateMatrix();
    trunkMesh.setMatrixAt(i, dummy.matrix);

    const foliageGeo = buildCanopyGeometry(scale, seed + 17);
    const foliage = new THREE.Mesh(foliageGeo, FOLIAGE_MATERIAL);
    const canopySink = scale * 0.12;
    foliage.position.set(x, y + trunkH - canopySink, z);
    foliage.rotation.copy(dummy.rotation);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    foliage.userData.swayPhase = rand() * Math.PI * 2;
    foliage.userData.swayAmount = FOLIAGE_SWAY_AMOUNT * (0.65 + rand() * 0.7);
    nature.add(foliage);
    swayTargets.push(foliage);
  }

  trunkMesh.instanceMatrix.needsUpdate = true;
  nature.add(trunkMesh);

  return { group: nature, swayTargets };
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

    const bush = new THREE.Mesh(mergeGeometries(pieces, true), FOLIAGE_MATERIAL);
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
  const trees = scatterTrees();
  const bushes = scatterBushes();

  const treeResult = createTreeInstances(trees);
  const bushResult = createBushInstances(bushes);

  const group = new THREE.Group();
  group.add(treeResult.group);
  group.add(bushResult.group);

  return {
    group,
    swayTargets: [...treeResult.swayTargets, ...bushResult.swayTargets],
  };
}