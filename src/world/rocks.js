import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, hashSeed } from './procedural/random.js';
import { sampleGroundHeight, isStonePath } from './ground.js';

// ── Mood knobs ──
export const ROCK_COUNT = 22;
export const ROCK_BASE_COLOR = 0x9a9088;
export const ROCK_COLOR_VARIATION = 0.08;

function displaceRockGeometry(geometry, seed, strength) {
  const rand = seededRandom(seed);
  const pos = geometry.attributes.position;
  const normals = geometry.attributes.normal;

  for (let i = 0; i < pos.count; i++) {
    const nx = normals.getX(i);
    const ny = normals.getY(i);
    const nz = normals.getZ(i);
    const jitter = (rand() - 0.5) * strength;
    pos.setXYZ(
      i,
      pos.getX(i) + nx * jitter,
      pos.getY(i) + ny * jitter,
      pos.getZ(i) + nz * jitter,
    );
  }

  geometry.computeVertexNormals();
  return geometry;
}

function isRockExcluded(wx, wz) {
  if (isStonePath(wx, wz)) return true;
  if (Math.hypot(wx, wz + 18) < 6.5) return true;
  if (wz < -10 && Math.abs(wx) < 17) return true;
  return false;
}

export function createRocks() {
  const group = new THREE.Group();
  const rand = seededRandom(7711);
  const geometries = [];

  for (let i = 0; i < ROCK_COUNT; i++) {
    let wx;
    let wz;
    let attempts = 0;

    do {
      wx = (rand() - 0.5) * 52;
      wz = (rand() - 0.5) * 48;
      attempts++;
    } while (isRockExcluded(wx, wz) && attempts < 40);

    if (attempts >= 40) continue;

    const nearWater = Math.hypot(wx, wz + 18) < 12;
    const nearPath =
      (Math.abs(wx) < 6 && wz > -20 && wz < 20) ||
      (Math.abs(wz) < 5 && Math.abs(wx) < 20);
    if (!nearWater && !nearPath && rand() > 0.35) continue;

    const scale = 0.25 + rand() * 0.55;
    const geo = displaceRockGeometry(
      new THREE.IcosahedronGeometry(scale, 1),
      hashSeed(wx, wz),
      scale * 0.35,
    );

    const matrix = new THREE.Matrix4();
    const y = sampleGroundHeight(wx, wz);
    matrix.makeRotationY(rand() * Math.PI * 2);
    matrix.setPosition(wx, y + scale * 0.35, wz);
    geo.applyMatrix4(matrix);
    geometries.push(geo);
  }

  if (geometries.length === 0) {
    return group;
  }

  const merged = mergeGeometries(geometries, false);
  merged.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: ROCK_BASE_COLOR,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: true,
  });

  const rocks = new THREE.Mesh(merged, material);
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  group.add(rocks);

  return group;
}