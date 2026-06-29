import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, hashSeed } from './procedural/random.js';
import { foliageColor, trunkColor, applyVertexColor } from './procedural/colors.js';
import { pickTreeProfile, sampleRange, TREE_PROFILES } from './procedural/treeProfiles.js';
import { sampleGroundHeight, isStonePath } from './ground.js';

// ── Mood knobs ──
export const FOLIAGE_SWAY_AMOUNT = 0.045;
export const FOLIAGE_SWAY_SPEED = 0.65;
export const TREE_COUNT_TARGET = 42;
export const LEAVES_PER_TREE = 18;
export const BRANCHES_PER_TREE_MIN = 3;

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

function profileShift(profile) {
  return {
    hueShift: profile.hueShift,
    satShift: profile.satShift,
    lightShift: profile.lightShift,
  };
}

function fallbackFoliageGeometry(radius, seed, profile) {
  const geo = new THREE.IcosahedronGeometry(radius, 1);
  applyVertexColor(
    geo,
    foliageColor(seededRandom(seed), 0.1, profileShift(profile)),
  );
  return geo;
}

function safeMerge(geometries, fallbackRadius, scale, seed = 1, profile) {
  const valid = geometries.filter(Boolean);
  if (valid.length === 0) {
    return fallbackFoliageGeometry(fallbackRadius, seed, profile);
  }
  const merged = mergeGeometries(valid, true);
  if (!merged) {
    return fallbackFoliageGeometry(fallbackRadius, seed, profile);
  }
  merged.computeBoundingSphere();
  return merged;
}

function buildCanopyGeometry(scale, seed, profile) {
  const rand = seededRandom(seed);
  const pieces = [];
  const canopyMul = sampleRange(profile.canopyScale, rand());
  const layers =
    profile.layerCount[0] +
    Math.floor(rand() * (profile.layerCount[1] - profile.layerCount[0] + 1));
  const spread = sampleRange(profile.layerSpread, rand());
  const jitter = sampleRange(profile.layerJitter, rand());
  const asymX = (rand() - 0.5) * scale * 0.25;
  const asymZ = (rand() - 0.5) * scale * 0.25;

  for (let i = 0; i < layers; i++) {
    const radius = Math.max(
      scale * 0.3,
      scale * canopyMul * (1.38 - i * 0.2) * (0.82 + rand() * 0.34),
    );
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    applyVertexColor(geo, foliageColor(rand, 0.12, profileShift(profile)));

    if (profile.id === 'wide' && rand() > 0.4) {
      geo.applyMatrix4(new THREE.Matrix4().makeScale(1.15, 0.72, 1.1));
    } else if (profile.id === 'tall' && rand() > 0.35) {
      geo.applyMatrix4(new THREE.Matrix4().makeScale(0.85, 1.12, 0.88));
    }

    const layerY = i === 0 ? radius : i * scale * spread + radius;
    const matrix = new THREE.Matrix4();
    matrix.makeTranslation(
      asymX + (rand() - 0.5) * scale * jitter,
      layerY,
      asymZ + (rand() - 0.5) * scale * jitter,
    );
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  return safeMerge(pieces, scale * 1.1, scale, seed, profile);
}

function buildBranchGeometry(scale, trunkH, seed, profile) {
  const rand = seededRandom(seed + 31);
  const count =
    profile.branchCount[0] +
    Math.floor(rand() * (profile.branchCount[1] - profile.branchCount[0] + 1));
  const pieces = [];
  const lenMin = profile.branchLength[0];
  const lenMax = profile.branchLength[1];
  const angleSpread = sampleRange(profile.branchAngle, rand());

  for (let b = 0; b < count; b++) {
    const heightT = 0.22 + rand() * 0.62;
    const len = scale * (lenMin + rand() * (lenMax - lenMin));
    const thickTop = 0.014 + rand() * 0.012;
    const thickBase = 0.04 + rand() * 0.028;

    const geo = new THREE.CylinderGeometry(
      thickTop * scale,
      thickBase * scale,
      len,
      5,
    );
    geo.translate(0, len / 2, 0);
    geo.rotateZ(
      Math.PI / 2 + (rand() - 0.5) * angleSpread * (profile.id === 'wide' ? 1.2 : 1),
    );
    geo.rotateY(rand() * Math.PI * 2);
    if (profile.id === 'mature' && rand() > 0.55) {
      geo.rotateX((rand() - 0.5) * 0.35);
    }

    const matrix = new THREE.Matrix4();
    matrix.setPosition(0, trunkH * heightT, 0);
    geo.applyMatrix4(matrix);
    pieces.push(geo);

    if (profile.id === 'mature' && rand() > 0.45) {
      const twigLen = len * (0.28 + rand() * 0.22);
      const twig = new THREE.CylinderGeometry(
        thickTop * scale * 0.55,
        thickTop * scale * 1.4,
        twigLen,
        4,
      );
      twig.translate(0, twigLen / 2, 0);
      twig.rotateZ(Math.PI / 2 + (rand() - 0.5) * 0.8);
      twig.rotateY(rand() * Math.PI * 2);
      const twigMatrix = new THREE.Matrix4();
      twigMatrix.setPosition(
        Math.cos(rand() * Math.PI * 2) * len * 0.85,
        trunkH * heightT + len * 0.15,
        Math.sin(rand() * Math.PI * 2) * len * 0.85,
      );
      twig.applyMatrix4(twigMatrix);
      pieces.push(twig);
    }
  }

  if (pieces.length === 0) return null;
  return safeMerge(pieces, scale * 0.2, scale, seed + 31, profile);
}

function buildLeafGeometry(scale, seed, profile) {
  const rand = seededRandom(seed + 99);
  const pieces = [];
  const leafCount = Math.floor(
    sampleRange(profile.leafCount, rand()),
  );
  const spreadMin = profile.leafSpread[0];
  const spreadMax = profile.leafSpread[1];

  for (let i = 0; i < leafCount; i++) {
    const leafScale = scale * (0.1 + rand() * 0.13);
    const geo = new THREE.ConeGeometry(
      leafScale * (0.45 + rand() * 0.15),
      leafScale * (1.3 + rand() * 0.35),
      3,
    );
    geo.rotateX(Math.PI / 2);
    if (rand() > 0.5) geo.rotateZ((rand() - 0.5) * 0.6);
    applyVertexColor(geo, foliageColor(rand, 0.14, profileShift(profile)));

    const theta = rand() * Math.PI * 2;
    const phi = rand() * Math.PI * 0.58;
    const dist = scale * (spreadMin + rand() * (spreadMax - spreadMin));
    const y = scale * (0.55 + rand() * 1.25);

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

  return safeMerge(pieces, scale * 0.15, scale, seed + 99, profile);
}

function createTree(treeDef) {
  const { x, z, scale, seed, lean } = treeDef;
  const rand = seededRandom(seed);
  const profile = pickTreeProfile(rand);
  const trunkH = sampleRange(profile.trunkHeight, rand()) * scale;
  const trunkTop = sampleRange(profile.trunkTaper, rand());
  const trunkBase = trunkTop * (1.6 + rand() * 0.55);
  const y = sampleGroundHeight(x, z);
  const rotY = rand() * Math.PI * 2;
  const canopySink = scale * (0.1 + rand() * 0.06);
  const bark = trunkColor(rand);

  const tree = new THREE.Group();
  tree.position.set(x, y, z);
  tree.rotation.set(lean.x, rotY, lean.z);

  const trunkMat = new THREE.MeshStandardMaterial({
    color: bark,
    roughness: 0.92 + rand() * 0.06,
    metalness: 0.0,
    flatShading: true,
  });

  const trunkGeo = new THREE.CylinderGeometry(trunkTop, trunkBase, 1, 7 + Math.floor(rand() * 3), 1);
  trunkGeo.translate(0, 0.5, 0);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.scale.set(scale, trunkH, scale);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const branchGeo = buildBranchGeometry(scale, trunkH, seed, profile);
  if (branchGeo) {
    const branches = new THREE.Mesh(branchGeo, trunkMat);
    branches.castShadow = true;
    tree.add(branches);
  }

  const crown = new THREE.Group();
  crown.position.y = trunkH - canopySink;
  crown.frustumCulled = false;

  const canopy = new THREE.Mesh(
    buildCanopyGeometry(scale, seed + 17, profile),
    FOLIAGE_MATERIAL,
  );
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  canopy.frustumCulled = false;
  crown.add(canopy);

  const leaves = new THREE.Mesh(
    buildLeafGeometry(scale, seed + 53, profile),
    LEAF_MATERIAL,
  );
  leaves.castShadow = true;
  leaves.frustumCulled = false;
  crown.add(leaves);

  crown.userData.swayPhase = rand() * Math.PI * 2;
  crown.userData.swayAmount =
    FOLIAGE_SWAY_AMOUNT * (0.55 + rand() * 0.85) * (profile.id === 'tall' ? 0.85 : 1);
  tree.add(crown);

  const perch = {
    x,
    y: y + trunkH + scale * (profile.id === 'wide' ? 0.7 : 0.95),
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
    const clusters = 2 + Math.floor(rand() * 3);
    const y = sampleGroundHeight(x, z);
    const pieces = [];

    for (let c = 0; c < clusters; c++) {
      const r = scale * (0.28 + rand() * 0.34);
      const geo = new THREE.IcosahedronGeometry(r, 1);
      applyVertexColor(geo, foliageColor(rand, 0.1));

      const matrix = new THREE.Matrix4();
      matrix.setPosition(
        (rand() - 0.5) * scale * 0.85,
        r * 0.55,
        (rand() - 0.5) * scale * 0.85,
      );
      geo.applyMatrix4(matrix);
      pieces.push(geo);
    }

    const bush = new THREE.Mesh(
      safeMerge(pieces, scale * 0.4, scale, seed, TREE_PROFILES[0]),
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
    const x = ax + (rand() - 0.5) * 4.2;
    const z = az + (rand() - 0.5) * 4.2;
    if (isExcluded(x, z)) continue;

    trees.push({
      x,
      z,
      scale: 0.82 + rand() * 0.9,
      seed: hashSeed(x, z),
      lean: {
        x: (rand() - 0.5) * 0.08,
        z: (rand() - 0.5) * 0.08,
      },
    });
  }

  while (trees.length < TREE_COUNT_TARGET) {
    const x = (rand() - 0.5) * 58;
    const z = (rand() - 0.5) * 52;
    if (isExcluded(x, z)) continue;

    const tooClose = trees.some(
      (t) => Math.hypot(t.x - x, t.z - z) < 3.0,
    );
    if (tooClose) continue;

    trees.push({
      x,
      z,
      scale: 0.68 + rand() * 0.78,
      seed: hashSeed(x, z) + trees.length,
      lean: {
        x: (rand() - 0.5) * 0.1,
        z: (rand() - 0.5) * 0.1,
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
      scale: 0.5 + rand() * 0.62,
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