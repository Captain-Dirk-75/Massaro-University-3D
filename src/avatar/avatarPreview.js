import * as THREE from 'three';
import { replaceAvatarFigure } from './avatarFigure.js';

export function createAvatarPreview(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2a3238);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 1.35, 3.2);
  camera.lookAt(0, 1.0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0xfff4e6, 0.55);
  const key = new THREE.DirectionalLight(0xffe0c0, 1.1);
  key.position.set(2, 4, 3);
  const fill = new THREE.DirectionalLight(0xc8d8f0, 0.35);
  fill.position.set(-2, 2, -1);
  scene.add(ambient, key, fill);

  const avatarRoot = new THREE.Group();
  scene.add(avatarRoot);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function update(options) {
    replaceAvatarFigure(avatarRoot, options);
    resize();
    renderer.render(scene, camera);
  }

  resize();
  return { update, resize };
}