import { createScene } from './core/scene.js';
import { createRenderer, handleResize } from './core/renderer.js';
import { createCamera } from './core/camera.js';
import { createRenderLoop } from './core/loop.js';
import { createFirstPersonControls } from './controls/firstPerson.js';
import { createGround } from './world/ground.js';
import { createLighting } from './world/lighting.js';
import { createBuildings } from './world/buildings.js';
import { createHud } from './ui/hud.js';
import { appState } from './state/appState.js';

const canvas = document.getElementById('canvas');

const scene = createScene();
const renderer = createRenderer(canvas);
const camera = createCamera();

scene.add(createLighting());
scene.add(createGround());
scene.add(createBuildings());

const hud = createHud();

const controls = createFirstPersonControls(camera, canvas, {
  onLockChange(locked) {
    appState.pointerLocked = locked;
    canvas.classList.toggle('is-locked', locked);
    hud.setPointerLocked(locked);
  },
});

window.addEventListener('resize', () => handleResize(renderer, camera));

createRenderLoop({
  renderer,
  scene,
  camera,
  onUpdate(delta) {
    controls.update(delta);
  },
});

appState.isReady = true;