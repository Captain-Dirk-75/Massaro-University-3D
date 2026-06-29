import * as THREE from 'three';

/**
 * Warm morning sun + soft ambient fill.
 */
export function createLighting() {
  const group = new THREE.Group();

  const ambient = new THREE.AmbientLight(0xfff4e6, 0.25);
  group.add(ambient);

  const hemisphere = new THREE.HemisphereLight(0xd4e8ff, 0x8b7355, 0.35);
  group.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffe8cc, 1.15);
  sun.position.set(40, 28, 24);
  sun.castShadow = true;

  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 150;
  sun.shadow.camera.left = -60;
  sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60;
  sun.shadow.camera.bottom = -60;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;

  group.add(sun);

  return group;
}