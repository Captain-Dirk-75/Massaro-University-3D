import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, hashSeed } from './procedural/random.js';
import { foliageColor, trunkColor, applyVertexColor } from './procedural/colors.js';
import { pickTreeProfile, sampleRange, TREE_PROFILES } from './procedural/treeProfiles.js';
import { sampleGroundHeight, isStonePath } from './ground.js';
import { isInsideBuildingFootprint } from './buildingFootprints.js';
import { isInsidePond, sampleMainSpine, POND_CENTER } from './campusPaths.js';

// ── Mood knobs ──
export const FOLIAGE_SWAY_AMOUNT = 0.045;
export const FOLIAGE_SWAY_SPEED = 0.65;
export const TREE_COUNT_TARGET = 30;
export const LEAVES_PER_TREE = 18;
export const BRANCH_FOLIAGE_CLUSTERS = 3;
export const GROUND_PLANT_COUNT = 48;
export const FLOWER_ACCENT_RATIO = 0.18;

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

function isExcluded(wx, wz, buildingZones) {
  if (isStonePath(wx, wz)) return true;
  if (isInsideBuildingFootprint(wx, wz, buildingZones)) return true;
  if (isInsidePond(wx, wz)) return true;
  return false;
}

/** Intentional planting clusters — groves, avenues, entrance frames. */
const TREE_CLUSTERS = [
  { type: 'avenue', side: -1, offset: 5.4, samples: [0.12, 0.28, 0.42, 0.56, 0.68], scale: [0.9, 1.15] },
  { type: 'avenue', side: 1, offset: 5.4, samples: [0.14, 0.3, 0.44, 0.58, 0.7], scale: [0.88, 1.12] },
  { type: 'grove', cx: -14, cz: 18, radius: 5, count: 4, scale: [0.75, 1.0] },
  { type: 'grove', cx: 14, cz: 20, radius: 4.5, count: 3, scale: [0.8, 1.05] },
  { type: 'grove', cx: -32, cz: -2, radius: 5, count: 4, scale: [0.82, 1.08] },
  { type: 'grove', cx: 30, cz: -4, radius: 4, count: 3, scale: [0.78, 1.0] },
  { type: 'frame', spots: [[-7, -39], [7, -39], [-5.5, -41], [5.5, -41]], scale: [0.7, 0.95] },
  { type: 'frame', spots: [[16, 9.5], [23, 12], [17, 13], [24, 10]], scale: [0.65, 0.9] },
  { type: 'frame', spots: [[-6, -12], [6, -12], [-8, -14], [8, -14]], scale: [0.6, 0.85] },
];

const BUSH_CLUSTERS = [
  { cx: POND_CENTER.x - 7, cz: POND_CENTER.z + 1, count: 3, spread: 2.2 },
  { cx: POND_CENTER.x + 7, cz: POND_CENTER.z + 1, count: 3, spread: 2.2 },
  { cx: 0, cz: -40, count: 2, spread: 3.5 },
  { cx: 20, cz: 9, count: 2, spread: 2.5 },
  { cx: -4, cz: 6, count: 2, spread: 2.0 },
  { cx: 10, cz: -2, count: 2, spread: 2.5 },
];

const GROUND_PLANT_CLUSTERS = [
  { cx: POND_CENTER.x - 5, cz: POND_CENTER.z + 5, count: 8, spread: 3.5, flowers: true },
  { cx: POND_CENTER.x + 5, cz: POND_CENTER.z + 5, count: 8, spread: 3.5, flowers: true },
  { cx: 0, cz: 2, count: 6, spread: 4, flowers: false },
  { cx: -3, cz: -30, count: 5, spread: 3, flowers: false },
  { cx: 14, cz: 8, count: 4, spread: 2.5, flowers: true },
];

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

function pushTree(trees, x, z, scale, seed, lean) {
  trees.push({ x, z, scale, seed, lean });
}

function placeClusterTrees(buildingZones) {
  const rand = seededRandom(42);
  const trees = [];

  for (const cluster of TREE_CLUSTERS) {
    if (cluster.type === 'avenue') {
      for (const t of cluster.samples) {
        const spine = sampleMainSpine(t);
        const perpX = cluster.side * cluster.offset;
        const x = spine.x + perpX + (rand() - 0.5) * 1.2;
        const z = spine.z + (rand() - 0.5) * 1.4;
        if (isExcluded(x, z, buildingZones)) continue;
        pushTree(trees, x, z,
          cluster.scale[0] + rand() * (cluster.scale[1] - cluster.scale[0]),
          hashSeed(x, z),
          { x: (rand() - 0.5) * 0.06, z: (rand() - 0.5) * 0.06 },
        );
      }
    } else if (cluster.type === 'grove') {
      for (let i = 0; i < cluster.count; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * cluster.radius;
        const x = cluster.cx + Math.cos(angle) * dist;
        const z = cluster.cz + Math.sin(angle) * dist;
        if (isExcluded(x, z, buildingZones)) continue;
        pushTree(trees, x, z,
          cluster.scale[0] + rand() * (cluster.scale[1] - cluster.scale[0]),
          hashSeed(x, z) + i,
          { x: (rand() - 0.5) * 0.08, z: (rand() - 0.5) * 0.08 },
        );
      }
    } else if (cluster.type === 'frame') {
      for (const [fx, fz] of cluster.spots) {
        const x = fx + (rand() - 0.5) * 1.0;
        const z = fz + (rand() - 0.5) * 1.0;
        if (isExcluded(x, z, buildingZones)) continue;
        pushTree(trees, x, z,
          cluster.scale[0] + rand() * (cluster.scale[1] - cluster.scale[0]),
          hashSeed(x, z),
          { x: (rand() - 0.5) * 0.05, z: (rand() - 0.5) * 0.05 },
        );
      }
    }
  }

  while (trees.length < TREE_COUNT_TARGET) {
    const x = (rand() - 0.5) * 50;
    const z = (rand() - 0.5) * 46;
    if (isExcluded(x, z, buildingZones)) continue;
    const tooClose = trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3.5);
    if (tooClose) continue;
    pushTree(trees, x, z,
      0.65 + rand() * 0.7,
      hashSeed(x, z) + trees.length,
      { x: (rand() - 0.5) * 0.1, z: (rand() - 0.5) * 0.1 },
    );
  }

  return trees;
}

function placeClusterBushes(buildingZones) {
  const rand = seededRandom(200);
  const bushes = [];

  for (const cluster of BUSH_CLUSTERS) {
    for (let i = 0; i < cluster.count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = rand() * cluster.spread;
      const x = cluster.cx + Math.cos(angle) * dist;
      const z = cluster.cz + Math.sin(angle) * dist;
      if (isExcluded(x, z, buildingZones)) continue;
      bushes.push({
        x,
        z,
        scale: 0.45 + rand() * 0.5,
        seed: 300 + bushes.length,
      });
    }
  }

  return bushes;
}

function flowerColor(rand) {
  const hue = rand() > 0.5 ? 0.12 : 0.92;
  return new THREE.Color().setHSL(hue, 0.45 + rand() * 0.2, 0.55 + rand() * 0.12);
}

function createGroundPlants(buildingZones) {
  const rand = seededRandom(501);
  const group = new THREE.Group();
  const swayTargets = [];
  const shrubGeo = new THREE.IcosahedronGeometry(0.22, 1);
  const flowerGeo = new THREE.ConeGeometry(0.12, 0.28, 4);
  flowerGeo.rotateX(Math.PI);

  const shrubMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    flatShading: true,
  });
  const flowerMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.88,
    flatShading: true,
  });

  const placements = [];

  for (const cluster of GROUND_PLANT_CLUSTERS) {
    for (let i = 0; i < cluster.count; i++) {
      const angle = rand() * Math.PI * 2;
      const dist = rand() * cluster.spread;
      const x = cluster.cx + Math.cos(angle) * dist;
      const z = cluster.cz + Math.sin(angle) * dist;
      if (isExcluded(x, z, buildingZones)) continue;
      placements.push({
        x,
        z,
        isFlower: cluster.flowers && rand() < FLOWER_ACCENT_RATIO,
        scale: 0.55 + rand() * 0.55,
        seed: 600 + placements.length,
      });
    }
  }

  while (placements.length < GROUND_PLANT_COUNT) {
    const x = (rand() - 0.5) * 44;
    const z = (rand() - 0.5) * 40;
    if (isExcluded(x, z, buildingZones)) continue;
    const nearCluster = placements.some((p) => Math.hypot(p.x - x, p.z - z) < 1.8);
    if (nearCluster) continue;
    placements.push({
      x,
      z,
      isFlower: rand() < FLOWER_ACCENT_RATIO * 0.5,
      scale: 0.5 + rand() * 0.45,
      seed: 600 + placements.length,
    });
  }

  const shrubs = placements.filter((p) => !p.isFlower);
  const flowers = placements.filter((p) => p.isFlower);

  if (shrubs.length > 0) {
    const mesh = new THREE.InstancedMesh(shrubGeo, shrubMat, shrubs.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    shrubs.forEach((p, i) => {
      const y = sampleGroundHeight(p.x, p.z);
      dummy.position.set(p.x, y + 0.12 * p.scale, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.rotation.y = seededRandom(p.seed)() * Math.PI * 2;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      foliageColor(seededRandom(p.seed), 0.08).toArray(color);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.userData.swayPhase = 0.4;
    mesh.userData.swayAmount = FOLIAGE_SWAY_AMOUNT * 0.25;
    group.add(mesh);
    swayTargets.push(mesh);
  }

  if (flowers.length > 0) {
    const mesh = new THREE.InstancedMesh(flowerGeo, flowerMat, flowers.length);
    mesh.castShadow = true;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    flowers.forEach((p, i) => {
      const y = sampleGroundHeight(p.x, p.z);
      dummy.position.set(p.x, y + 0.08, p.z);
      dummy.scale.setScalar(p.scale * 0.9);
      dummy.rotation.y = seededRandom(p.seed)() * Math.PI * 2;
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      flowerColor(seededRandom(p.seed)).toArray(color);
      mesh.setColorAt(i, color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
  }

  return { group, swayTargets };
}

export function createNature({ buildingZones = [] } = {}) {
  const treeDefs = placeClusterTrees(buildingZones);
  const bushes = placeClusterBushes(buildingZones);

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

  const groundPlants = createGroundPlants(buildingZones);
  group.add(groundPlants.group);
  swayTargets.push(...groundPlants.swayTargets);

  const treeColliders = treeDefs.map((def) => ({
    x: def.x,
    z: def.z,
    r: def.scale * 0.5,
  }));

  return { group, swayTargets, perches, treeColliders };
}