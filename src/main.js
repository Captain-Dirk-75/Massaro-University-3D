import * as THREE from 'three';
import { createScene } from './core/scene.js';
import { createRenderer, handleResize } from './core/renderer.js';
import { createCamera } from './core/camera.js';
import { createRenderLoop } from './core/loop.js';
import { createFirstPersonControls } from './controls/firstPerson.js';
import { createWorldColliders } from './world/collisionVolumes.js';
import { createInteractionSystem } from './controls/interaction.js';
import { applyAtmosphere } from './world/atmosphere.js';
import { createGround } from './world/ground.js';
import { createLighting } from './world/lighting.js';
import { createCampus } from './world/campusBuilder.js';
import { getBuildingExclusionZones } from './world/buildingFootprints.js';
import { createSectionGates } from './world/buildings/sectionGates.js';
import { createAreaGates } from './world/areaGates.js';
import { createNature } from './world/nature.js';
import { createRocks } from './world/rocks.js';
import { createLandscapeProps } from './world/landscapeProps.js';
import { createMotes } from './world/motes.js';
import { createClouds } from './world/clouds.js';
import { createBirds } from './world/birds.js';
import { getCampusPerches } from './world/perches.js';
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

  const outdoorScene = createScene();
  applyAtmosphere(outdoorScene);

  const outdoorRoot = new THREE.Group();
  outdoorScene.add(outdoorRoot);

  const renderer = createRenderer(canvas);
  const camera = createCamera();

  outdoorRoot.add(createLighting());

  const campus = createCampus();

  const buildingZones = getBuildingExclusionZones({
    areas: campus.areas,
    unifiedBuildings: campus.unifiedBuildings,
  });

  outdoorRoot.add(createGround({ interiorZones: buildingZones }));
  outdoorRoot.add(campus.root);

  const { group: nature, swayTargets, perches: treePerches, treeColliders } =
    createNature({ buildingZones });
  outdoorRoot.add(nature);

  const rocks = createRocks({ buildingZones });
  outdoorRoot.add(rocks.group);

  const landscapeProps = createLandscapeProps();
  outdoorRoot.add(landscapeProps.group);

  const worldColliders = createWorldColliders({
    treeColliders,
    rockColliders: rocks.colliders,
  });

  const unifiedBuildings = campus.unifiedBuildings ?? [];
  for (const building of unifiedBuildings) {
    worldColliders.boxes.push(...building.colliders.boxes);
  }

  const { group: cloudGroup, clouds } = createClouds();
  outdoorRoot.add(cloudGroup);

  const birdPerches = [...treePerches, ...getCampusPerches()];
  const { group: birdGroup, birds } = createBirds(birdPerches);
  outdoorRoot.add(birdGroup);

  const motes = createMotes();
  outdoorRoot.add(motes.points);

  const kiosk = createKiosk();
  outdoorRoot.add(kiosk.group);

  const guide = createGuideFigure();
  outdoorRoot.add(guide.group);

  const playerAvatar = createPlayerAvatar(outdoorScene);
  playerAvatar.updateFromProfile(playerState.profile);

  const animations = createWorldAnimations({
    swayTargets,
    waterMaterial: campus.waterMaterial,
    motes,
    clouds,
    birds,
    birdPerches,
  });

  const outdoorComposer = createPostProcessing(renderer, outdoorScene, camera);

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
  outdoorRoot.add(areaGates.root);

  const sectionGates = createSectionGates({
    gates: unifiedBuildings.flatMap((b) => b.sectionGates ?? []),
    getState: () => playerState,
    onGateMessage: (message) => hud.setGateMessage(message),
  });
  outdoorRoot.add(sectionGates.root);

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
      sectionGates.refresh();
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

  const controls = createFirstPersonControls(camera, canvas, {
    colliders: worldColliders,
    getFloorY(x, z, currentY) {
      for (const building of unifiedBuildings) {
        const y = building.getFloorY(x, z, currentY);
        if (y != null) return y;
      }
      return 0;
    },
    onLockChange(locked) {
      appState.pointerLocked = locked;
      canvas.classList.toggle('is-locked', locked);
      hud.setPointerLocked(locked);
    },
  });

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
    isBlocked: () => isUiBlocking(),
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
    outdoorComposer.setSize(window.innerWidth, window.innerHeight);
  });

  let sessionSaveTimer = 0;
  let perfTimer = 0;
  let perfFrames = 0;
  let lastFps = 0;

  window.logPerf = () => {
    console.log('renderer.info.render:', { ...renderer.info.render });
    console.log('renderer.info.memory:', { ...renderer.info.memory });
  };

  window.addEventListener('beforeunload', () => {
    persist();
  });

  createRenderLoop({
    renderer,
    scene: outdoorScene,
    camera,
    render: () => {
      outdoorComposer.composer.render();
      hud.setPerfStats({
        fps: lastFps,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
      });
    },
    onUpdate(delta) {
      perfFrames += 1;
      perfTimer += delta;
      if (perfTimer >= 0.5) {
        lastFps = Math.round(perfFrames / perfTimer);
        perfTimer = 0;
        perfFrames = 0;
      }

      if (!isUiBlocking()) {
        controls.update(delta);
      }

      animations.update(delta);
      areaGates.update(camera);
      sectionGates.update(camera);

      playerAvatar.syncToCamera(camera);
      addCampusTime(delta);

      const nearTarget = interaction.update();
      hud.setInteractPrompt(nearTarget);

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

bootstrap().catch((error) => {
  console.error('Failed to start Massaro University 3D:', error);
});