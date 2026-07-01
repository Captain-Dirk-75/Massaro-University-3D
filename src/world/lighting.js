import * as THREE from 'three';

// ── Mood knobs ──
export const SUN_COLOR = 0xffd088;
export const SUN_INTENSITY = 1.42;
export const AMBIENT_COLOR = 0xfff4e8;
export const AMBIENT_INTENSITY = 0.2;
export const HEMI_SKY = 0xd8e8f8;
export const HEMI_GROUND = 0xb09878;
export const HEMI_INTENSITY = 0.52;

/**
 * Warm morning key light with soft hemisphere fill.
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
  sun.position.set(42, 26, 38);
  sun.castShadow = true;

  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 140;
  sun.shadow.camera.left = -55;
  sun.shadow.camera.right = 55;
  sun.shadow.camera.top = 55;
  sun.shadow.camera.bottom = -55;
  sun.shadow.bias = -0.00025;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 6;

  group.add(sun);

  return group;
}