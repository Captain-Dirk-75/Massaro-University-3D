import { createScene } from './core/scene.js';
import { createRenderer, handleResize } from './core/renderer.js';
import { createCamera } from './core/camera.js';
import { createRenderLoop } from './core/loop.js';
import { createFirstPersonControls } from './controls/firstPerson.js';
import { applyAtmosphere } from './world/atmosphere.js';
import { createGround } from './world/ground.js';
import { createLighting } from './world/lighting.js';
import { createLibrary } from './world/library.js';
import { createNature } from './world/nature.js';
import { createWaterFeature } from './world/waterFeature.js';
import { createMotes } from './world/motes.js';
import { createWorldAnimations } from './world/animations.js';
import { createPostProcessing } from './post/postProcessing.js';
import { createHud } from './ui/hud.js';
import { createCustomizePanel } from './ui/customizePanel.js';
import { createPlayerAvatar } from './avatar/playerAvatar.js';
import { load } from './state/persistence.js';
import {
  playerState,
  applyPlayerState,
  addCampusTime,
  persist,
} from './state/playerState.js';
import { appState } from './state/appState.js';

async function bootstrap() {
const canvas = document.getElementById('canvas');

const saved = await load();
if (saved) {
  applyPlayerState(saved);
}

const scene = createScene();
applyAtmosphere(scene);

const renderer = createRenderer(canvas);
const camera = createCamera();

scene.add(createLighting());
scene.add(createGround());
scene.add(createLibrary());

const { group: nature, swayTargets } = createNature();
scene.add(nature);

const { group: waterFeature, waterMaterial } = createWaterFeature();
scene.add(waterFeature);

const motes = createMotes();
scene.add(motes.points);

const playerAvatar = createPlayerAvatar(scene);
playerAvatar.updateFromProfile(playerState.profile);

const animations = createWorldAnimations({
  swayTargets,
  waterMaterial,
  motes,
});

const { composer, setSize: setComposerSize } = createPostProcessing(
  renderer,
  scene,
  camera,
);

let customizePanel;

const hud = createHud({
  onCustomizeClick: () => customizePanel.toggle(),
});

function applyProfileToUi(profile) {
  hud.setPlayerProfile(profile);
  playerAvatar.updateFromProfile(profile);
}

customizePanel = createCustomizePanel({
  onChange: applyProfileToUi,
  onOpenChange(open) {
    appState.customizePanelOpen = open;
  },
});

applyProfileToUi(playerState.profile);

const controls = createFirstPersonControls(camera, canvas, {
  onLockChange(locked) {
    appState.pointerLocked = locked;
    canvas.classList.toggle('is-locked', locked);
    hud.setPointerLocked(locked);
  },
});

canvas.addEventListener('click', (event) => {
  if (appState.customizePanelOpen) {
    event.stopImmediatePropagation();
  }
}, true);

window.addEventListener('resize', () => {
  handleResize(renderer, camera);
  setComposerSize(window.innerWidth, window.innerHeight);
});

let sessionSaveTimer = 0;

window.addEventListener('beforeunload', () => {
  persist();
});

createRenderLoop({
  renderer,
  scene,
  camera,
  render: () => composer.render(),
  onUpdate(delta) {
    if (!appState.customizePanelOpen) {
      controls.update(delta);
    }

    playerAvatar.syncToCamera(camera);
    addCampusTime(delta);

    sessionSaveTimer += delta;
    if (sessionSaveTimer >= 30) {
      sessionSaveTimer = 0;
      persist();
      if (customizePanel.isOpen()) {
        customizePanel.updateSessionDisplay();
      }
    }
  },
});

appState.isReady = true;
}

bootstrap();