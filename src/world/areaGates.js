import * as THREE from 'three';
import { hasAreaAccess, getAreaLockedMessage } from '../commerce/access.js';

const BARRIER_COLOR = 0xc8d8e8;
const NEAR_DISTANCE = 4.5;

function halfExtents(area) {
  return {
    hw: area.footprint.width / 2,
    hd: area.footprint.depth / 2,
  };
}

function isInsideFootprint(position, area) {
  const { hw, hd } = halfExtents(area);
  return (
    position.x >= area.position.x - hw &&
    position.x <= area.position.x + hw &&
    position.z >= area.position.z - hd &&
    position.z <= area.position.z + hd
  );
}

function ejectPosition(position, area) {
  const { hw, hd } = halfExtents(area);
  const out = position.clone();
  const side = area.entrance ?? 'east';

  switch (side) {
    case 'east':
      out.x = area.position.x + hw + 0.6;
      break;
    case 'west':
      out.x = area.position.x - hw - 0.6;
      break;
    case 'north':
      out.z = area.position.z - hd - 0.6;
      break;
    case 'south':
      out.z = area.position.z + hd + 0.6;
      break;
    default:
      break;
  }

  return out;
}

function barrierCenter(area) {
  const { hw, hd } = halfExtents(area);
  const center = new THREE.Vector3(area.position.x, 1.4, area.position.z);
  const side = area.entrance ?? 'east';

  switch (side) {
    case 'east':
      center.x = area.position.x + hw;
      break;
    case 'west':
      center.x = area.position.x - hw;
      break;
    case 'north':
      center.z = area.position.z - hd;
      break;
    case 'south':
      center.z = area.position.z + hd;
      break;
    default:
      break;
  }

  return center;
}

function createBarrierMesh(area) {
  const { hw, hd } = halfExtents(area);
  const side = area.entrance ?? 'east';
  const isVertical = side === 'east' || side === 'west';
  const width = isVertical ? hd * 2 : hw * 2;
  const height = 2.6;

  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshStandardMaterial({
    color: BARRIER_COLOR,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    roughness: 0.2,
    metalness: 0.05,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(barrierCenter(area));

  if (side === 'east') mesh.rotation.y = Math.PI / 2;
  else if (side === 'west') mesh.rotation.y = -Math.PI / 2;
  else if (side === 'north') mesh.rotation.y = 0;
  else if (side === 'south') mesh.rotation.y = Math.PI;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.85,
  });

  const group = new THREE.Group();
  group.add(mesh);

  const postGeom = new THREE.CylinderGeometry(0.08, 0.1, height, 8);
  const offsets = isVertical
    ? [[0, 0, -width / 2], [0, 0, width / 2]]
    : [[-width / 2, 0, 0], [width / 2, 0, 0]];

  for (const [x, y, z] of offsets) {
    const post = new THREE.Mesh(postGeom, frameMat);
    post.position.set(x, 0, z);
    post.castShadow = true;
    group.add(post);
  }

  group.userData.campusAreaId = area.id;
  return group;
}

export function createAreaGates({ gatedAreas, getState, onGateMessage }) {
  const root = new THREE.Group();
  const barriers = new Map();

  for (const area of gatedAreas) {
    const barrier = createBarrierMesh(area);
    root.add(barrier);
    barriers.set(area.id, { area, barrier });
  }

  const probe = new THREE.Vector3();

  function refresh() {
    const state = getState();

    for (const { area, barrier } of barriers.values()) {
      const open = hasAreaAccess(area, state);
      barrier.visible = !open;
    }
  }

  function update(camera) {
    const state = getState();
    refresh();

    let nearestMessage = null;
    let nearestDist = Infinity;

    for (const { area, barrier } of barriers.values()) {
      const open = hasAreaAccess(area, state);
      if (open) continue;

      if (isInsideFootprint(camera.position, area)) {
        const ejected = ejectPosition(camera.position, area);
        camera.position.copy(ejected);
      }

      probe.copy(barrierCenter(area));
      const dist = camera.position.distanceTo(probe);
      if (dist < NEAR_DISTANCE && dist < nearestDist) {
        nearestDist = dist;
        nearestMessage = getAreaLockedMessage(area);
      }
    }

    onGateMessage?.(nearestMessage);
  }

  refresh();

  return { root, update, refresh };
}