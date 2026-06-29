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
export const BRANCH_FOLIAGE_CLUSTERS = 3;

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

const UP = new THREE.Vector3(0, 1, 0);
const _tip = new THREE.Vector3();
const _quat = new THREE.Quaternion();

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

function normalizeGeometryBase(geometry, overlap = 0) {
  geometry.computeBoundingBox();
  const minY = geometry.boundingBox.min.y;
  if (Number.isFinite(minY) && minY !== 0) {
    geometry.translate(0, -minY - overlap, 0);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function safeMergeFoliage(geometries, fallbackRadius, seed, profile) {
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

function safeMergeWood(geometries) {
  const valid = geometries.filter(Boolean);
  if (valid.length === 0) return null;
  return mergeGeometries(valid, false);
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

    let scaleY = 1;
    let scaleXZ = 1;
    if (profile.id === 'wide' && rand() > 0.4) {
      scaleY = 0.72;
      scaleXZ = 1.12;
    } else if (profile.id === 'tall' && rand() > 0.35) {
      scaleY = 1.12;
      scaleXZ = 0.88;
    }

    const layerY = i === 0 ? radius * scaleY : i * scale * spread + radius * scaleY;
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(
        asymX + (rand() - 0.5) * scale * jitter,
        layerY,
        asymZ + (rand() - 0.5) * scale * jitter,
      ),
      new THREE.Quaternion(),
      new THREE.Vector3(scaleXZ, scaleY, scaleXZ),
    );
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  const merged = safeMergeFoliage(pieces, scale * 1.1, seed, profile);
  return normalizeGeometryBase(merged, scale * 0.2);
}

function addFoliageCluster(pieces, center, scale, rand, profile, radiusMul = 1) {
  const clusters = BRANCH_FOLIAGE_CLUSTERS + Math.floor(rand() * 2);
  for (let c = 0; c < clusters; c++) {
    const r = scale * (0.1 + rand() * 0.12) * radiusMul;
    const geo = new THREE.IcosahedronGeometry(r, 1);
    applyVertexColor(geo, foliageColor(rand, 0.1, profileShift(profile)));

    const matrix = new THREE.Matrix4();
    matrix.setPosition(
      center.x + (rand() - 0.5) * r * 1.8,
      center.y + (rand() - 0.5) * r * 1.4,
      center.z + (rand() - 0.5) * r * 1.8,
    );
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }
}

function buildBranches(scale, trunkH, seed, profile) {
  const rand = seededRandom(seed + 31);
  const woodPieces = [];
  const foliagePieces = [];
  const count =
    profile.branchCount[0] +
    Math.floor(rand() * (profile.branchCount[1] - profile.branchCount[0] + 1));
  const lenMin = profile.branchLength[0];
  const lenMax = profile.branchLength[1];
  const angleSpread = sampleRange(profile.branchAngle, rand());

  for (let b = 0; b < count; b++) {
    const attachY = trunkH * (0.22 + rand() * 0.62);
    const len = scale * (lenMin + rand() * (lenMax - lenMin));
    const azimuth = rand() * Math.PI * 2;
    const elevation = (rand() - 0.5) * angleSpread * (profile.id === 'wide' ? 1.15 : 0.9);

    const branchDir = new THREE.Vector3(
      Math.cos(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.sin(azimuth) * Math.cos(elevation),
    ).normalize();

    const thickTop = (0.014 + rand() * 0.012) * scale;
    const thickBase = (0.04 + rand() * 0.028) * scale;
    const branchGeo = new THREE.CylinderGeometry(thickTop, thickBase, len, 5);
    branchGeo.translate(0, len / 2, 0);
    _quat.setFromUnitVectors(UP, branchDir);

    const mid = branchDir.clone().multiplyScalar(len / 2);
    mid.y += attachY;

    const woodMatrix = new THREE.Matrix4().compose(mid, _quat, new THREE.Vector3(1, 1, 1));
    branchGeo.applyMatrix4(woodMatrix);
    woodPieces.push(branchGeo);

    _tip.set(0, attachY, 0).add(branchDir.clone().multiplyScalar(len));
    addFoliageCluster(foliagePieces, _tip, scale, rand, profile, 1.05);

    if (len > scale * 0.55) {
      const midPoint = new THREE.Vector3(0, attachY, 0).add(
        branchDir.clone().multiplyScalar(len * 0.55),
      );
      addFoliageCluster(foliagePieces, midPoint, scale, rand, profile, 0.75);
    }

    if (profile.id === 'mature' && rand() > 0.4) {
      const twigLen = len * (0.3 + rand() * 0.2);
      const twigDir = branchDir
        .clone()
        .add(
          new THREE.Vector3((rand() - 0.5) * 0.4, rand() * 0.25, (rand() - 0.5) * 0.4),
        )
        .normalize();
      const twigGeo = new THREE.CylinderGeometry(
        thickTop * 0.5,
        thickTop * 1.2,
        twigLen,
        4,
      );
      twigGeo.translate(0, twigLen / 2, 0);
      _quat.setFromUnitVectors(UP, twigDir);
      const twigCenter = _tip.clone().add(twigDir.clone().multiplyScalar(twigLen * 0.42));
      twigGeo.applyMatrix4(
        new THREE.Matrix4().compose(twigCenter, _quat, new THREE.Vector3(1, 1, 1)),
      );
      woodPieces.push(twigGeo);

      const twigTip = _tip.clone().add(twigDir.clone().multiplyScalar(twigLen * 0.9));
      addFoliageCluster(foliagePieces, twigTip, scale, rand, profile, 0.6);
    }
  }

  return {
    wood: safeMergeWood(woodPieces),
    foliage: safeMergeFoliage(foliagePieces, scale * 0.25, seed + 31, profile),
  };
}

function buildLeafGeometry(scale, seed, profile, canopyBaseY) {
  const rand = seededRandom(seed + 99);
  const pieces = [];
  const leafCount = Math.floor(sampleRange(profile.leafCount, rand()));
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
    const y = canopyBaseY + scale * (0.55 + rand() * 1.25);

    const matrix = new THREE.Matrix4();
    matrix.setPosition(
      Math.sin(phi) * Math.cos(theta) * dist,
      y,
      Math.sin(phi) * Math.sin(theta) * dist,
    );
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  return safeMergeFoliage(pieces, scale * 0.15, seed + 99, profile);
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

  const trunkGeo = new THREE.CylinderGeometry(
    trunkTop,
    trunkBase,
    1,
    7 + Math.floor(rand() * 3),
    1,
  );
  trunkGeo.translate(0, 0.5, 0);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.scale.set(scale, trunkH, scale);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const branches = buildBranches(scale, trunkH, seed, profile);
  if (branches.wood) {
    const branchWood = new THREE.Mesh(branches.wood, trunkMat);
    branchWood.castShadow = true;
    tree.add(branchWood);
  }

  const crown = new THREE.Group();
  crown.frustumCulled = false;

  const canopyGeo = buildCanopyGeometry(scale, seed + 17, profile);
  const canopy = new THREE.Mesh(canopyGeo, FOLIAGE_MATERIAL);
  canopy.position.y = trunkH;
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  canopy.frustumCulled = false;
  crown.add(canopy);

  const leaves = new THREE.Mesh(
    buildLeafGeometry(scale, seed + 53, profile, trunkH),
    LEAF_MATERIAL,
  );
  leaves.castShadow = true;
  leaves.frustumCulled = false;
  crown.add(leaves);

  if (branches.foliage) {
    const branchFoliage = new THREE.Mesh(branches.foliage, FOLIAGE_MATERIAL);
    branchFoliage.castShadow = true;
    branchFoliage.receiveShadow = true;
    branchFoliage.frustumCulled = false;
    crown.add(branchFoliage);
  }

  crown.userData.swayPhase = rand() * Math.PI * 2;
  crown.userData.swayAmount =
    FOLIAGE_SWAY_AMOUNT * (0.55 + rand() * 0.85) * (profile.id === 'tall' ? 0.85 : 1);
  tree.add(crown);

  const perch = {
    x,
    y: y + trunkH + scale * (profile.id === 'wide' ? 0.85 : 1.05),
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
      safeMergeFoliage(pieces, scale * 0.4, seed, TREE_PROFILES[0]),
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