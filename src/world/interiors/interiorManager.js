import * as THREE from 'three';
import { buildInterior } from './interiorBuilder.js';
import { applyInteriorAtmosphere } from './interiorAtmosphere.js';
import { createInteriorWindowViews } from './interiorWindows.js';

/**
 * Manages outdoor ↔ indoor scene swaps with fade transitions.
 */
export function createInteriorManager({
  outdoorScene,
  indoorScene,
  outdoorRoot,
  camera,
  outdoorComposer,
  indoorComposer,
  fade,
  playerAvatar,
  controls,
  outdoorColliders,
  interiors,
  renderer,
}) {
  let active = 'outdoor';
  let currentInterior = null;
  let transitioning = false;
  const built = new Map();
  let getFloorY = null;

  const windowViews = createInteriorWindowViews({
    outdoorScene,
    outdoorRoot,
    renderer,
  });

  applyInteriorAtmosphere(indoorScene);

  function getBuilt(def) {
    if (!built.has(def.id)) {
      const result = buildInterior(def);
      result.group.visible = false;

      const offset = new THREE.Vector3(
        def.worldOffset?.x ?? 0,
        def.worldOffset?.y ?? 0,
        def.worldOffset?.z ?? 0,
      );
      for (const slot of result.windows ?? []) {
        windowViews.registerWindow(slot.mesh, slot.localPosition, slot.outwardNormal, offset);
      }

      indoorScene.add(result.group);
      built.set(def.id, result);
    }
    return built.get(def.id);
  }

  function hideAllInteriors() {
    for (const data of built.values()) {
      data.group.visible = false;
    }
  }

  function setOutdoorVisible(visible) {
    outdoorRoot.visible = visible;
  }

  async function enter(def) {
    if (transitioning || active !== 'outdoor') return;

    transitioning = true;
    await fade.toBlack();

    const interior = getBuilt(def);
    hideAllInteriors();
    interior.group.visible = true;

    setOutdoorVisible(false);
    playerAvatar.root.removeFromParent();
    indoorScene.add(playerAvatar.root);

    camera.position.set(def.spawn.x, def.spawn.y, def.spawn.z);
    if (def.spawn.yaw != null) {
      controls.setYaw(def.spawn.yaw);
    }
    controls.setColliders(interior.colliders);
    getFloorY = interior.getFloorY ?? null;

    active = def.id;
    currentInterior = def;

    await fade.fromBlack();
    transitioning = false;
  }

  async function exit() {
    if (transitioning || active === 'outdoor' || !currentInterior) return;

    const def = currentInterior;
    transitioning = true;
    await fade.toBlack();

    hideAllInteriors();
    setOutdoorVisible(true);

    playerAvatar.root.removeFromParent();
    outdoorScene.add(playerAvatar.root);

    camera.position.set(
      def.returnSpawn.x,
      def.returnSpawn.y,
      def.returnSpawn.z,
    );
    if (def.returnSpawn.yaw != null) {
      controls.setYaw(def.returnSpawn.yaw);
    }
    controls.setColliders(outdoorColliders);
    getFloorY = null;

    active = 'outdoor';
    currentInterior = null;

    await fade.fromBlack();
    transitioning = false;
  }

  function isIndoor() {
    return active !== 'outdoor';
  }

  function isTransitioning() {
    return transitioning || fade.isBusy();
  }

  function render() {
    if (active === 'outdoor') {
      outdoorComposer.render();
    } else {
      windowViews.update();
      indoorComposer.render();
    }
  }

  function resolveFloorY(x, z) {
    return getFloorY ? getFloorY(x, z, camera.position.y) : 0;
  }

  function createEntranceTargets() {
    return interiors.map((def) => ({
      id: `enter-${def.id}`,
      type: 'entrance',
      interiorId: def.id,
      label: def.entrance.label,
      radius: def.entrance.radius,
      position: new THREE.Vector3(
        def.entrance.position.x,
        def.entrance.position.y,
        def.entrance.position.z,
      ),
    }));
  }

  function getExitTarget() {
    if (!currentInterior) return null;
    const def = currentInterior;
    return {
      id: `exit-${def.id}`,
      type: 'exit',
      interiorId: def.id,
      label: def.exit.label,
      radius: def.exit.radius,
      position: new THREE.Vector3(
        def.exit.position.x,
        def.exit.position.y,
        def.exit.position.z,
      ),
    };
  }

  function findInterior(id) {
    return interiors.find((def) => def.id === id) ?? null;
  }

  return {
    enter,
    exit,
    render,
    isIndoor,
    isTransitioning,
    createEntranceTargets,
    getExitTarget,
    findInterior,
    resolveFloorY,
  };
}