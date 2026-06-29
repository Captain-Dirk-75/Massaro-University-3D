import * as THREE from 'three';

const SKY_COLOR = 0xb8d4e8;
const FOG_NEAR = 30;
const FOG_FAR = 120;

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY_COLOR);
  scene.fog = new THREE.Fog(SKY_COLOR, FOG_NEAR, FOG_FAR);
  return scene;
}