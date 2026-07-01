import * as THREE from 'three';

// ── Mood knobs ──
export const SKY_TOP = '#7ab8d8';
export const SKY_MID = '#b8d4ec';
export const SKY_HORIZON = '#f5e4cc';
export const SKY_GROUND = '#dcc8a8';
export const FOG_COLOR = 0xe4d8c8;
export const FOG_NEAR = 26;
export const FOG_FAR = 104;

// Low mist pooling in the valley lows (near the pool & creek).
export const MIST_COLOR = '#eef0ea';
export const MIST_PATCHES = [
  { x: -2, z: -18, size: 34, y: 0.5, opacity: 0.1 }, // reflecting pool hollow
  { x: -43, z: -18, size: 20, y: 0.9, opacity: 0.14 }, // waterfall base on the hillside
  { x: -26, z: -18.5, size: 28, y: 0.5, opacity: 0.08 }, // creek across the valley floor
  { x: 4, z: -2, size: 40, y: 0.5, opacity: 0.07 }, // central quad
];

function createSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, SKY_TOP);
  gradient.addColorStop(0.32, SKY_MID);
  gradient.addColorStop(0.68, SKY_HORIZON);
  gradient.addColorStop(1, SKY_GROUND);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function applyAtmosphere(scene) {
  scene.background = createSkyTexture();
  scene.fog = new THREE.Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
}

function createSoftDiscTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Soft ground-hugging mist that pools in the valley lows. Cheap: a few large
 * translucent horizontal discs that drift and breathe. Drive `update(delta)`.
 */
export function createGroundMist() {
  const group = new THREE.Group();
  const texture = createSoftDiscTexture();
  const color = new THREE.Color(MIST_COLOR);
  const planes = [];

  MIST_PATCHES.forEach((patch, i) => {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color,
      transparent: true,
      opacity: patch.opacity,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(patch.size, patch.size), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(patch.x, patch.y, patch.z);
    mesh.renderOrder = 3;
    mesh.userData = {
      baseX: patch.x,
      baseZ: patch.z,
      baseOpacity: patch.opacity,
      phase: i * 1.7,
    };
    group.add(mesh);
    planes.push(mesh);
  });

  function update(elapsed) {
    for (const mesh of planes) {
      const u = mesh.userData;
      mesh.position.x = u.baseX + Math.sin(elapsed * 0.05 + u.phase) * 1.6;
      mesh.position.z = u.baseZ + Math.cos(elapsed * 0.04 + u.phase) * 1.4;
      mesh.material.opacity =
        u.baseOpacity * (0.7 + 0.3 * Math.sin(elapsed * 0.12 + u.phase));
      mesh.rotation.z = Math.sin(elapsed * 0.03 + u.phase) * 0.1;
    }
  }

  return { group, update };
}