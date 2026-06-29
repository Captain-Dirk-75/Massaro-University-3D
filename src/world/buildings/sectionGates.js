import * as THREE from 'three';
import { hasAreaAccess, getAreaLockedMessage } from '../../commerce/access.js';

const BARRIER_COLOR = 0xd8c8b0;
const NEAR_DISTANCE = 4.5;

function worldBounds(gate) {
  const { buildingPosition: p, bounds: b } = gate;
  return {
    minX: p.x + b.minX,
    maxX: p.x + b.maxX,
    minZ: p.z + b.minZ,
    maxZ: p.z + b.maxZ,
  };
}

function isOnGatedFloor(cameraY, gate) {
  const floorY = gate.floorMin * gate.storyHeight + gate.floorHeight + 1.5;
  return cameraY >= floorY;
}

function isInsideBounds(position, bounds) {
  return (
    position.x >= bounds.minX &&
    position.x <= bounds.maxX &&
    position.z >= bounds.minZ &&
    position.z <= bounds.maxZ
  );
}

function barrierPosition(gate) {
  const bounds = worldBounds(gate);
  const y = gate.buildingPosition.y + gate.floorMin * gate.storyHeight + 2.2;
  const center = new THREE.Vector3(
    gate.buildingPosition.x + gate.barrierAt,
    y,
    (bounds.minZ + bounds.maxZ) / 2,
  );

  if (gate.barrierAxis === 'z') {
    center.x = (bounds.minX + bounds.maxX) / 2;
    center.z = gate.buildingPosition.z + gate.barrierAt;
  }

  return center;
}

function createBarrierMesh(gate) {
  const bounds = worldBounds(gate);
  const width = gate.barrierAxis === 'z'
    ? bounds.maxX - bounds.minX
    : bounds.maxZ - bounds.minZ;
  const height = 2.8;

  const material = new THREE.MeshStandardMaterial({
    color: BARRIER_COLOR,
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    roughness: 0.25,
    metalness: 0.04,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.copy(barrierPosition(gate));

  if (gate.barrierAxis === 'z') mesh.rotation.y = 0;
  else mesh.rotation.y = Math.PI / 2;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x8a7060, roughness: 0.85 });
  const group = new THREE.Group();
  group.add(mesh);
  group.userData.gateId = gate.id;
  return { group, frameMat, width, height };
}

function ejectFromBounds(position, bounds, gate) {
  const out = position.clone();
  const side = gate.ejectSide ?? 1;

  if (gate.barrierAxis === 'x') {
    out.x = side > 0
      ? bounds.maxX + 0.65
      : bounds.minX - 0.65;
  } else {
    out.z = side > 0
      ? bounds.maxZ + 0.65
      : bounds.minZ - 0.65;
  }

  return out;
}

/**
 * Interior membership gates for unified-world compound buildings.
 */
export function createSectionGates({ gates = [], getState, onGateMessage }) {
  const root = new THREE.Group();
  const barriers = new Map();

  for (const gate of gates) {
    const { group } = createBarrierMesh(gate);
    root.add(group);
    barriers.set(gate.id, { gate, barrier: group });
  }

  function hasGateAccess(gate) {
    return hasAreaAccess({ access: gate.access }, getState());
  }

  function getGateMessage(gate) {
    return gate.lockedMessage ?? getAreaLockedMessage({ name: 'This section', access: gate.access });
  }

  function refresh() {
    for (const { gate, barrier } of barriers.values()) {
      barrier.visible = !hasGateAccess(gate);
    }
  }

  function update(camera) {
    refresh();

    let nearestMessage = null;
    let nearestDist = Infinity;

    for (const { gate, barrier } of barriers.values()) {
      if (hasGateAccess(gate)) continue;
      if (!isOnGatedFloor(camera.position.y, gate)) continue;

      const bounds = worldBounds(gate);
      if (isInsideBounds(camera.position, bounds)) {
        const ejected = ejectFromBounds(camera.position, bounds, gate);
        camera.position.copy(ejected);
      }

      const probe = barrierPosition(gate);
      const dist = camera.position.distanceTo(probe);
      if (dist < NEAR_DISTANCE && dist < nearestDist) {
        nearestDist = dist;
        nearestMessage = getGateMessage(gate);
      }
    }

    if (nearestMessage) onGateMessage?.(nearestMessage);
    return nearestMessage;
  }

  refresh();

  return { root, update, refresh };
}