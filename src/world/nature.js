import * as THREE from 'three';

// ── Mood knobs ──
export const FOLIAGE_SWAY_AMOUNT = 0.04;
export const FOLIAGE_SWAY_SPEED = 0.7;

const TRUNK_COLOR = 0x6a5040;
const FOLIAGE_COLORS = [0x4a7a48, 0x5a8a52, 0x3d6a3c, 0x6a9a58];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function isExcluded(wx, wz) {
  if (wz < -10 && Math.abs(wx) < 18) return true;
  if (Math.hypot(wx, wz + 18) < 7) return true;
  if (Math.abs(wx) < 4 && wz > -20 && wz < 20) return true;
  if (Math.abs(wz) < 3.5 && Math.abs(wx) < 16) return true;
  return false;
}

function createTree(scale, seed) {
  const tree = new THREE.Group();
  const rand = seededRandom(seed);

  const trunkH = (2.2 + rand() * 1.8) * scale;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.2 * scale, trunkH, 8),
    new THREE.MeshStandardMaterial({ color: TRUNK_COLOR, roughness: 0.95 }),
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliageGroup = new THREE.Group();
  foliageGroup.position.y = trunkH * 0.85;
  foliageGroup.userData.swayPhase = rand() * Math.PI * 2;
  foliageGroup.userData.swayAmount = FOLIAGE_SWAY_AMOUNT * (0.7 + rand() * 0.6);

  const layers = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < layers; i++) {
    const radius = (1.4 - i * 0.25) * scale * (0.9 + rand() * 0.3);
    const fol = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 1),
      new THREE.MeshStandardMaterial({
        color: FOLIAGE_COLORS[Math.floor(rand() * FOLIAGE_COLORS.length)],
        roughness: 0.92,
        flatShading: true,
      }),
    );
    fol.position.y = i * 0.55 * scale;
    fol.castShadow = true;
    fol.receiveShadow = true;
    foliageGroup.add(fol);
  }

  tree.add(foliageGroup);
  tree.userData.foliage = foliageGroup;

  return tree;
}

function createBush(scale, seed) {
  const bush = new THREE.Group();
  const rand = seededRandom(seed);
  const clusters = 2 + Math.floor(rand() * 2);

  for (let i = 0; i < clusters; i++) {
    const r = 0.35 * scale * (0.7 + rand() * 0.5);
    const blob = new THREE.Mesh(
      new THREE.IcosahedronGeometry(r, 0),
      new THREE.MeshStandardMaterial({
        color: FOLIAGE_COLORS[Math.floor(rand() * FOLIAGE_COLORS.length)],
        roughness: 0.95,
        flatShading: true,
      }),
    );
    blob.position.set(
      (rand() - 0.5) * 0.6 * scale,
      r * 0.6,
      (rand() - 0.5) * 0.6 * scale,
    );
    blob.castShadow = true;
    bush.add(blob);
  }

  bush.userData.swayPhase = rand() * Math.PI * 2;
  bush.userData.swayAmount = FOLIAGE_SWAY_AMOUNT * 0.5;
  return bush;
}

export function createNature() {
  const nature = new THREE.Group();
  const swayTargets = [];
  const rand = seededRandom(42);

  const treeSpots = [
    [-22, 8], [-18, 18], [-14, -4], [-26, -2], [-20, -14],
    [22, 8], [18, 16], [14, -6], [26, 0], [20, -12],
    [-10, 22], [10, 22], [-8, -16], [8, -16], [0, 24],
    [-30, 10], [30, 10], [-28, -10], [28, -8],
  ];

  for (let i = 0; i < treeSpots.length; i++) {
    const [x, z] = treeSpots[i];
    if (isExcluded(x, z)) continue;

    const scale = 0.85 + rand() * 0.7;
    const tree = createTree(scale, 100 + i);
    tree.position.set(
      x + (rand() - 0.5) * 2,
      0,
      z + (rand() - 0.5) * 2,
    );
    tree.rotation.y = rand() * Math.PI * 2;
    nature.add(tree);
    swayTargets.push(tree.userData.foliage);
  }

  for (let i = 0; i < 28; i++) {
    const x = (rand() - 0.5) * 50;
    const z = (rand() - 0.5) * 44;
    if (isExcluded(x, z)) continue;

    const bush = createBush(0.6 + rand() * 0.5, 200 + i);
    bush.position.set(x, 0, z);
    nature.add(bush);
    swayTargets.push(bush);
  }

  return { group: nature, swayTargets };
}