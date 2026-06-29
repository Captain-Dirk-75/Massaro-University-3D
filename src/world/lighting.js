import * as THREE from 'three';

// ── Mood knobs ──
export const SUN_COLOR = 0xffd090;
export const SUN_INTENSITY = 1.38;
export const AMBIENT_COLOR = 0xfff0dc;
export const AMBIENT_INTENSITY = 0.22;
export const HEMI_SKY = 0xc8dff0;
export const HEMI_GROUND = 0x9a8060;
export const HEMI_INTENSITY = 0.42;

/**
 * Golden-morning sun with soft fill — nothing harsh or flat.
 */
export function createLighting() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(AMBIENT_COLOR, AMBIENT_INTENSITY);
  group.add(ambient);

  const hemisphere = new THREE.HemisphereLight(
    HEMI_SKY,
    HEMI_GROUND,
    HEMI_INTENSITY,
  );
  group.add(hemisphere);

  const sun = new THREE.DirectionalLight(SUN_COLOR, SUN_INTENSITY);
  sun.position.set(48, 22, 36);
  sun.castShadow = true;

  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.018;
  sun.shadow.radius = 4;

  group.add(sun);

  return group;
}