import * as THREE from 'three';

// ── Mood knobs ──
export const SKY_TOP = '#6aafd4';
export const SKY_MID = '#a8cce8';
export const SKY_HORIZON = '#f2dcc4';
export const SKY_GROUND = '#d4b896';
export const FOG_COLOR = 0xd4c8b8;
export const FOG_NEAR = 22;
export const FOG_FAR = 85;

function createSkyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, SKY_TOP);
  gradient.addColorStop(0.35, SKY_MID);
  gradient.addColorStop(0.72, SKY_HORIZON);
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