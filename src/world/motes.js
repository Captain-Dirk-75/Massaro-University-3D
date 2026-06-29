import * as THREE from 'three';

// ── Mood knobs ──
export const MOTE_COUNT = 48;
export const MOTE_ORBIT_SPEED = 0.55;
export const MOTE_ORBIT_RADIUS = 1.4;
export const MOTE_GLOW = 0xffe8b8;

export function createMotes() {
  const positions = new Float32Array(MOTE_COUNT * 3);
  const seeds = [];

  for (let i = 0; i < MOTE_COUNT; i++) {
    const ox = (Math.random() - 0.5) * 40;
    const oy = 0.5 + Math.random() * 4;
    const oz = -8 + (Math.random() - 0.5) * 36;

    positions[i * 3] = ox;
    positions[i * 3 + 1] = oy;
    positions[i * 3 + 2] = oz;

    seeds.push({
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.6,
      radius: (0.5 + Math.random() * 0.8) * MOTE_ORBIT_RADIUS,
      ox,
      oy,
      oz,
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