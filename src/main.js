import { createScene } from './core/scene.js';
import { createRenderer, handleResize } from './core/renderer.js';
import { createCamera } from './core/camera.js';
import { createRenderLoop } from './core/loop.js';
import { createFirstPersonControls } from './controls/firstPerson.js';
import { createInteractionSystem } from './controls/interaction.js';
import { applyAtmosphere } from './world/atmosphere.js';
import { createGround } from './world/ground.js';
import { createLighting } from './world/lighting.js';
import { createCampus } from './world/campusBuilder.js';
import { createAreaGates } from './world/areaGates.js';
import { createNature } from './world/nature.js';
import { createRocks } from './world/rocks.js';
import { createMotes } from './world/motes.js';
import { createWorldAnimations } from './world/animations.js';
import { createKiosk } from './world/kiosk.js';
import { createGuideFigure } from './world/guideFigure.js';
import { createPostProcessing } from './post/postProcessing.js';
import { createHud } from './ui/hud.js';
import { createCustomizePanel } from './ui/customizePanel.js';
import { createStorePanel } from './ui/storePanel.js';
import { createGuidePanel } from './ui/guidePanel.js';
import { createPlayerAvatar } from './avatar/playerAvatar.js';
import { bootstrapPlatform, getCurrentUser } from './platform/index.js';
import {
  playerState,
  applyPlayerState,
  addCampusTime,
  persist,
} from './state/playerState.js';
import { appState } from './state/appState.js';

function isUiBlocking() {
  return (
    appState.customizePanelOpen ||
    appState.storePanelOpen ||
    appState.guidePanelOpen
  );
}

async function bootstrap() {
  const canvas = document.getElementById('canvas');

  await bootstrapPlatform();
  const user = await getCurrentUser();
  applyPlayerState(user);

  const scene = createScene();
  applyAtmosphere(scene);

  const renderer = createRenderer(canvas);
  const camera = createCamera();

  scene.add(createLighting());
  scene.add(createGround());

  const campus = createCampus();
  scene.add(campus.root);

  const { group: nature, swayTargets } = createNature();
  scene.add(nature);

  scene.add(createRocks());

  const motes = createMotes();
  scene.add(motes.points);

  const kiosk = createKiosk();
  scene.add(kiosk.group);

  const guide = createGuideFigure();
  scene.add(guide.group);

  const playerAvatar = createPlayerAvatar(scene);
  playerAvatar.updateFromProfile(playerState.profile);

  const animations = createWorldAnimations({
    swayTargets,
    waterMaterial: campus.waterMaterial,
    motes,
  });

  const { composer, setSize: setComposerSize } = createPostProcessing(
    renderer,
    scene,
    camera,
  );

  let customizePanel;
  let storePanel;
  let guidePanel;

  const hud = createHud({
    onGuideClick: () => guidePanel.open(),
    onCustomizeClick: () => customizePanel.toggle(),
    onSanctuaryClick: () => storePanel.open(),
  });

  const areaGates = createAreaGates({
    gatedAreas: campus.gatedAreas,
    getState: () => playerState,
    onGateMessage: (message) => hud.setGateMessage(message),
  });
  scene.add(areaGates.root);

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

  storePanel = createStorePanel({
    onOpenChange(open) {
      appState.storePanelOpen = open;
    },
    onCommerceChange() {
      areaGates.refresh();
      if (storePanel.isOpen()) {
        storePanel.refresh();
      }
    },
  });

  guidePanel = createGuidePanel({
    onOpenChange(open) {
      appState.guidePanelOpen = open;
    },
  });

  applyProfileToUi(playerState.profile);

  const interaction = createInteractionSystem({
    camera,
    getTargets: () => [kiosk, guide],
    onInteract(target) {
      if (target.id === 'sage-grove') {
        guidePanel.open();
      } else if (target.id === 'course-sanctuary') {
        storePanel.open();
      }
    },
    isBlocked: isUiBlocking,
  });

  const controls = createFirstPersonControls(camera, canvas, {
    onLockChange(locked) {
      appState.pointerLocked = locked;
      canvas.classList.toggle('is-locked', locked);
      hud.setPointerLocked(locked);
    },
  });

  canvas.addEventListener(
    'click',
    (event) => {
      if (isUiBlocking()) {
        event.stopImmediatePropagation();
      }
    },
    true,
  );

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
      if (!isUiBlocking()) {
        controls.update(delta);
      }

      playerAvatar.syncToCamera(camera);
      addCampusTime(delta);

      const nearTarget = interaction.update();
      hud.setInteractPrompt(nearTarget);
      areaGates.update(camera);

      sessionSaveTimer += delta;
      if (sessionSaveTimer >= 30) {
        sessionSaveTimer = 0;
        void persist();
        if (customizePanel.isOpen()) {
          customizePanel.updateSessionDisplay();
        }
      }
    },
  });

  appState.isReady = true;
}

bootstrap();