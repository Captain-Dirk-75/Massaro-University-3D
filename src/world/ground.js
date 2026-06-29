import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { seededRandom } from './procedural/random.js';

const GROUND_SIZE = 120;
const SEGMENTS = 96;

// ── Mood knobs ──
export const HEIGHT_AMPLITUDE = 0.38;
export const HEIGHT_SCALE = 0.028;
export const GRASS_BASE = new THREE.Color(0x5a8a52);
export const GRASS_VARIATION = 0.12;
export const STONE_LIGHT = new THREE.Color(0xc4b8a8);
export const STONE_DARK = new THREE.Color(0xa89880);

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

export function isStonePath(wx, wz) {
  const mainPath = Math.abs(wx) < 3.2 && wz > -22 && wz < 22;
  const crossPath = Math.abs(wz) < 2.8 && Math.abs(wx) < 18;
  const poolRing =
    Math.hypot(wx, wz + 18) > 5.5 && Math.hypot(wx, wz + 18) < 8.5;
  const libraryPlaza = wz < -12 && wz > -28 && Math.abs(wx) < 16;

  if (mainPath || crossPath || poolRing || libraryPlaza) return true;

  const half = GROUND_SIZE / 2;
  const u = (wx + half) / GROUND_SIZE;
  const v = (wz + half) / GROUND_SIZE;
  const tileU = Math.floor(u * 8);
  const tileV = Math.floor(v * 8);
  if (tileU >= 3 && tileU <= 4 && tileV >= 3 && tileV <= 4) {
    const cx = u * 8 - (tileU + 0.5);
    const cv = v * 8 - (tileV + 0.5);
    if (Math.hypot(cx, cv) < 0.42) return true;
  }

  return false;
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

  return height;
}

function vertexColorAt(wx, wz) {
  const n = noise2(wx * 0.12, wz * 0.12);
  const n2 = noise2(wx * 0.35 + 40, wz * 0.35 + 40);

  if (isStonePath(wx, wz)) {
    const blend = n * 0.5 + n2 * 0.3;
    return STONE_DARK.clone().lerp(STONE_LIGHT, blend);
  }

  const color = GRASS_BASE.clone();
  const variation = (n - 0.5) * GRASS_VARIATION + (n2 - 0.5) * 0.06;
  color.offsetHSL(variation * 0.15, variation * 0.2, variation * 0.35);
  return color;
}

export function createGround() {
  const geometry = new THREE.PlaneGeometry(
    GROUND_SIZE,
    GROUND_SIZE,
    SEGMENTS,
    SEGMENTS,
  );
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const half = GROUND_SIZE / 2;

  for (let i = 0; i < positions.count; i++) {
    const wx = positions.getX(i);
    const wz = positions.getZ(i);
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