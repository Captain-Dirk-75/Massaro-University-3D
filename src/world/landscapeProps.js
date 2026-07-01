import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sampleGroundHeight } from './ground.js';

// ── Mood knobs — focal point positions (world XZ) ──
export const FOCAL_POINTS = [
  { id: 'pool-bench-south', type: 'bench', x: 0, z: -11, rotY: Math.PI },
  { id: 'quad-bench', type: 'bench', x: -5, z: 7, rotY: Math.PI * 0.35 },
  { id: 'pool-lantern', type: 'lantern', x: 7, z: -16, rotY: -0.4 },
  // On the pond's east shore, the bench facing west out over the water.
  { id: 'contemplation-nook', type: 'nook', x: 10, z: -18.5, rotY: Math.PI / 2 },
];

const WOOD_COLOR = 0x8a7058;
const STONE_COLOR = 0xb8a890;
const STONE_DARK = 0x9a8878;

const woodMat = new THREE.MeshStandardMaterial({
  color: WOOD_COLOR,
  roughness: 0.88,
  metalness: 0,
  flatShading: true,
});

const stoneMat = new THREE.MeshStandardMaterial({
  color: STONE_COLOR,
  roughness: 0.92,
  metalness: 0,
  flatShading: true,
});

const stoneDarkMat = new THREE.MeshStandardMaterial({
  color: STONE_DARK,
  roughness: 0.94,
  metalness: 0,
  flatShading: true,
});

function buildBench() {
  const parts = [];
  const seat = new THREE.BoxGeometry(1.6, 0.1, 0.55);
  seat.translate(0, 0.48, 0);
  parts.push(seat);

  for (const sx of [-0.65, 0.65]) {
    const leg = new THREE.BoxGeometry(0.1, 0.48, 0.45);
    leg.translate(sx, 0.24, 0);
    parts.push(leg);
  }

  const back = new THREE.BoxGeometry(1.6, 0.55, 0.08);
  back.translate(0, 0.78, -0.24);
  parts.push(back);

  const geo = mergeGeometries(parts, false);
  const mesh = new THREE.Mesh(geo, woodMat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function buildLantern() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.35, 6),
    stoneDarkMat,
  );
  base.position.y = 0.175;
  base.castShadow = true;
  group.add(base);

  const pillar = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.9, 0.18),
    stoneMat,
  );
  pillar.position.y = 0.8;
  pillar.castShadow = true;
  group.add(pillar);

  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.5, 0.42),
    stoneMat,
  );
  housing.position.y = 1.45;
  housing.castShadow = true;
  group.add(housing);

  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.32, 0.28),
    new THREE.MeshStandardMaterial({
      color: 0xffd8a0,
      emissive: 0xffa860,
      emissiveIntensity: 0.35,
      roughness: 0.6,
      transparent: true,
      opacity: 0.85,
    }),
  );
  glow.position.y = 1.45;
  group.add(glow);

  const light = new THREE.PointLight(0xffc878, 0.35, 6);
  light.position.y = 1.5;
  group.add(light);

  return group;
}

function buildContemplationNook() {
  const group = new THREE.Group();

  const ringSegments = 8;
  const ringRadius = 1.8;
  for (let i = 0; i < ringSegments; i++) {
    const angle = (i / ringSegments) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.22, 0.35),
      stoneDarkMat,
    );
    stone.position.set(
      Math.cos(angle) * ringRadius,
      0.11,
      Math.sin(angle) * ringRadius,
    );
    stone.rotation.y = angle;
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  }

  const bench = buildBench();
  bench.scale.set(0.85, 0.85, 0.85);
  bench.position.set(0, 0, 0.6);
  bench.rotation.y = Math.PI;
  group.add(bench);

  const accent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.12, 0.5, 5),
    stoneMat,
  );
  accent.position.set(0, 0.25, -1.2);
  accent.castShadow = true;
  group.add(accent);

  return group;
}

/**
 * Quiet focal points — benches, lantern, contemplation nook.
 */
export function createLandscapeProps() {
  const group = new THREE.Group();

  for (const focal of FOCAL_POINTS) {
    let prop;
    if (focal.type === 'bench') prop = buildBench();
    else if (focal.type === 'lantern') prop = buildLantern();
    else if (focal.type === 'nook') prop = buildContemplationNook();
    else continue;

    const y = sampleGroundHeight(focal.x, focal.z);
    prop.position.set(focal.x, y, focal.z);
    prop.rotation.y = focal.rotY;
    group.add(prop);
  }

  return { group };
}