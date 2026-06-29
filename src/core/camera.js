import * as THREE from 'three';

const FOV = 70;
const NEAR = 0.1;
const FAR = 200;
const SPAWN = { x: 0, y: 1.7, z: 16 };

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    NEAR,
    FAR,
  );

  camera.position.set(SPAWN.x, SPAWN.y, SPAWN.z);

  return camera;
}