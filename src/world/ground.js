import * as THREE from 'three';

const GROUND_SIZE = 120;
const TEXTURE_SIZE = 512;

// ── Mood knobs ──
export const GRASS_BASE = { r: 82, g: 118, b: 72 };
export const GRASS_VARIATION = 28;
export const STONE_LIGHT = { r: 196, g: 186, b: 168 };
export const STONE_DARK = { r: 168, g: 156, b: 138 };

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

function isStoneQuad(wx, wz) {
  const half = GROUND_SIZE / 2;
  const u = (wx + half) / GROUND_SIZE;
  const v = (wz + half) / GROUND_SIZE;

  const mainPath = Math.abs(wx) < 3.2 && wz > -22 && wz < 22;
  const crossPath = Math.abs(wz) < 2.8 && Math.abs(wx) < 18;
  const poolRing =
    Math.hypot(wx, wz + 18) > 5.5 && Math.hypot(wx, wz + 18) < 8.5;
  const libraryPlaza = wz < -12 && wz > -28 && Math.abs(wx) < 16;

  if (mainPath || crossPath || poolRing || libraryPlaza) return true;

  const tileU = Math.floor(u * 8);
  const tileV = Math.floor(v * 8);
  if (tileU >= 3 && tileU <= 4 && tileV >= 3 && tileV <= 4) {
    const cx = u * 8 - (tileU + 0.5);
    const cv = v * 8 - (tileV + 0.5);
    if (Math.hypot(cx, cv) < 0.42) return true;
  }

  return false;
}

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE);
  const half = GROUND_SIZE / 2;

  for (let py = 0; py < TEXTURE_SIZE; py++) {
    for (let px = 0; px < TEXTURE_SIZE; px++) {
      const wx = (px / TEXTURE_SIZE) * GROUND_SIZE - half;
      const wz = (py / TEXTURE_SIZE) * GROUND_SIZE - half;
      const n = noise2(wx * 0.12, wz * 0.12);
      const n2 = noise2(wx * 0.35 + 40, wz * 0.35 + 40);

      let r;
      let g;
      let b;

      if (isStoneQuad(wx, wz)) {
        const blend = n * 0.5 + n2 * 0.3;
        r = THREE.MathUtils.lerp(STONE_DARK.r, STONE_LIGHT.r, blend);
        g = THREE.MathUtils.lerp(STONE_DARK.g, STONE_LIGHT.g, blend);
        b = THREE.MathUtils.lerp(STONE_DARK.b, STONE_LIGHT.b, blend);
      } else {
        const variation = (n - 0.5) * GRASS_VARIATION + (n2 - 0.5) * 12;
        r = GRASS_BASE.r + variation * 0.6;
        g = GRASS_BASE.g + variation;
        b = GRASS_BASE.b + variation * 0.4;
      }

      const i = (py * TEXTURE_SIZE + px) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createGround() {
  const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
  const material = new THREE.MeshStandardMaterial({
    map: createGroundTexture(),
    roughness: 0.88,
    metalness: 0.0,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  return ground;
}