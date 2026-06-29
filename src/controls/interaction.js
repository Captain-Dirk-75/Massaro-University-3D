import * as THREE from 'three';

const interactPosition = new THREE.Vector3();

/**
 * Proximity-based E-key interaction for world markers.
 */
export function createInteractionSystem({ camera, getTargets, onInteract, isBlocked }) {
  let nearestTarget = null;

  function update() {
    if (isBlocked()) {
      nearestTarget = null;
      return null;
    }

    const targets = getTargets();
    let closest = null;
    let closestDist = Infinity;

    for (const target of targets) {
      interactPosition.copy(target.position);
      const dx = camera.position.x - interactPosition.x;
      const dz = camera.position.z - interactPosition.z;
      const dist = Math.hypot(dx, dz);
      if (dist <= target.radius && dist < closestDist) {
        closest = target;
        closestDist = dist;
      }
    }

    nearestTarget = closest;
    return closest;
  }

  document.addEventListener('keydown', (event) => {
    if (event.code !== 'KeyE') return;
    if (event.repeat) return;
    if (isBlocked()) return;
    if (!nearestTarget) return;
    if (event.target.matches('input, textarea, select')) return;

    event.preventDefault();
    onInteract(nearestTarget);
  });

  return {
    update,
    getNearest: () => nearestTarget,
  };
}