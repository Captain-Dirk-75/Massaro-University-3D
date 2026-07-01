import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { seededRandom } from './procedural/random.js';
import { isInsideBuildingFootprint } from './buildingFootprints.js';
import { isStonePath, isInsidePond, distanceToNearestPath } from './campusPaths.js';

export { isStonePath } from './campusPaths.js';

const GROUND_SIZE = 120;
const SEGMENTS = 96;

// ── Mood knobs ──
export const HEIGHT_AMPLITUDE = 0.38;
export const HEIGHT_SCALE = 0.028;
export const GRASS_BASE = new THREE.Color(0x5a8a52);
export const GRASS_VARIATION = 0.12;
export const MEADOW_LIGHT = new THREE.Color(0x6a9a5a);
export const MEADOW_STRENGTH = 0.22;
export const STONE_LIGHT = new THREE.Color(0xc4b8a8);
export const STONE_DARK = new THREE.Color(0xa89880);
export const PATH_EDGE_BLEND = 0.55;

const noise2D = createNoise2D(() => seededRandom(90210)());

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise2(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, ux),
    THREE.MathUtils.lerp(c, d, ux),
    uy,
  );
}

export function sampleGroundHeight(wx, wz) {
  const n = noise2D(wx * HEIGHT_SCALE, wz * HEIGHT_SCALE);
  const n2 = noise2D(wx * HEIGHT_SCALE * 2.2 + 40, wz * HEIGHT_SCALE * 2.2 + 40);
  const n3 = noise2D(wx * HEIGHT_SCALE * 0.45 - 20, wz * HEIGHT_SCALE * 0.45 + 80);
  const blend = n * 0.55 + n2 * 0.3 + n3 * 0.15;
  let height = blend * HEIGHT_AMPLITUDE;

  if (isStonePath(wx, wz)) {
    height *= 0.35;
  }

  if (isInsidePond(wx, wz)) {
    height *= 0.15;
  }

  return height;
}

function vertexColorAt(wx, wz) {
  const n = noise2(wx * 0.12, wz * 0.12);
  const n2 = noise2(wx * 0.35 + 40, wz * 0.35 + 40);
  const meadow = noise2(wx * 0.08 - 30, wz * 0.08 + 20);

  if (isStonePath(wx, wz)) {
    const blend = n * 0.5 + n2 * 0.3;
    return STONE_DARK.clone().lerp(STONE_LIGHT, blend);
  }

  const pathDist = distanceToNearestPath(wx, wz);
  const nearPath = pathDist < 2.2;
  const pathBlend = nearPath ? (1 - pathDist / 2.2) * PATH_EDGE_BLEND : 0;

  const color = GRASS_BASE.clone();
  const variation = (n - 0.5) * GRASS_VARIATION + (n2 - 0.5) * 0.06;
  color.offsetHSL(variation * 0.15, variation * 0.2, variation * 0.35);

  if (meadow > 0.58 && !nearPath) {
    color.lerp(MEADOW_LIGHT, MEADOW_STRENGTH * (meadow - 0.58) * 2.2);
  }

  if (pathBlend > 0) {
    const edgeStone = STONE_DARK.clone().lerp(STONE_LIGHT, 0.35);
    color.lerp(edgeStone, pathBlend * 0.35);
  }

  return color;
}

export function createGround({ interiorZones = [] } = {}) {
  const geometry = new THREE.PlaneGeometry(
    GROUND_SIZE,
    GROUND_SIZE,
    SEGMENTS,
    SEGMENTS,
  );
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const interiorStone = STONE_DARK.clone().lerp(STONE_LIGHT, 0.42);

  for (let i = 0; i < positions.count; i++) {
    const wx = positions.getX(i);
    const wz = positions.getZ(i);
    const insideBuilding = isInsideBuildingFootprint(wx, wz, interiorZones);

    if (insideBuilding) {
      positions.setY(i, 0.02);
      colors[i * 3] = interiorStone.r;
      colors[i * 3 + 1] = interiorStone.g;
      colors[i * 3 + 2] = interiorStone.b;
      continue;
    }

    const height = sampleGroundHeight(wx, wz);
    positions.setY(i, height);

    const color = vertexColorAt(wx, wz);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;

  return ground;
}