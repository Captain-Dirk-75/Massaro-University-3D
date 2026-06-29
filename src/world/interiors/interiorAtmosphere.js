import * as THREE from 'three';

// ── Mood knobs ──
export const INTERIOR_FOG_COLOR = 0xe8e0d4;
export const INTERIOR_FOG_NEAR = 8;
export const INTERIOR_FOG_FAR = 42;
export const INTERIOR_BG = 0xe8e2d8;

export function applyInteriorAtmosphere(scene) {
  scene.background = new THREE.Color(INTERIOR_BG);
  scene.fog = new THREE.Fog(INTERIOR_FOG_COLOR, INTERIOR_FOG_NEAR, INTERIOR_FOG_FAR);
}