import * as THREE from 'three';

const GROUND_SIZE = 200;
const GROUND_COLOR = 0x6b8f5e;

export function createGround() {
  const geometry = new THREE.PlaneGeometry(GROUND_SIZE, GROUND_SIZE);
  const material = new THREE.MeshStandardMaterial({
    color: GROUND_COLOR,
    roughness: 0.92,
    metalness: 0.0,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  return ground;
}