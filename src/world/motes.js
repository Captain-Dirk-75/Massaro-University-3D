import * as THREE from 'three';

// ── Mood knobs ──
export const MOTE_COUNT = 48;
export const MOTE_DRIFT_SPEED = 0.15;
export const MOTE_GLOW = 0xffe8b8;

export function createMotes() {
  const positions = new Float32Array(MOTE_COUNT * 3);
  const seeds = [];

  for (let i = 0; i < MOTE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = 0.5 + Math.random() * 4;
    positions[i * 3 + 2] = -8 + (Math.random() - 0.5) * 36;
    seeds.push({
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      radius: 0.3 + Math.random() * 0.6,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: MOTE_GLOW,
    size: 0.12,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);

  return { points, seeds, positions };
}