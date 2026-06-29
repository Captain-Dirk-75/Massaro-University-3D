import * as THREE from 'three';
import { seededRandom } from './procedural/random.js';

// ── Mood knobs ──
export const CLOUD_COUNT = 14;
export const CLOUD_DRIFT_SPEED = 0.35;
export const CLOUD_HEIGHT_MIN = 22;
export const CLOUD_HEIGHT_MAX = 38;

const CLOUD_MATERIAL = new THREE.MeshStandardMaterial({
  color: 0xf8f8ff,
  roughness: 0.95,
  metalness: 0.0,
  transparent: true,
  opacity: 0.82,
  flatShading: true,
  depthWrite: false,
});

function createCloudPuff(rand) {
  const group = new THREE.Group();
  const puffs = 4 + Math.floor(rand() * 4);

  for (let i = 0; i < puffs; i++) {
    const rx = 1.6 + rand() * 3.2;
    const puff = new THREE.Mesh(
      new THREE.IcosahedronGeometry(rx, 0),
      CLOUD_MATERIAL,
    );
    puff.scale.set(1.6, 0.45 + rand() * 0.25, 1.1 + rand() * 0.4);
    puff.position.set(
      (rand() - 0.5) * 5,
      (rand() - 0.5) * 0.6,
      (rand() - 0.5) * 3.5,
    );
    puff.castShadow = false;
    puff.receiveShadow = false;
    group.add(puff);
  }

  return group;
}

export function createClouds() {
  const group = new THREE.Group();
  const clouds = [];
  const rand = seededRandom(8800);

  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = createCloudPuff(rand);
    const data = {
      mesh: cloud,
      speed: 0.15 + rand() * 0.25,
      phase: rand() * Math.PI * 2,
      baseX: (rand() - 0.5) * 90,
      baseZ: (rand() - 0.5) * 70,
      driftAxis: rand() > 0.5 ? 'x' : 'z',
    };

    cloud.position.set(
      data.baseX,
      CLOUD_HEIGHT_MIN + rand() * (CLOUD_HEIGHT_MAX - CLOUD_HEIGHT_MIN),
      data.baseZ,
    );

    group.add(cloud);
    clouds.push(data);
  }

  return { group, clouds };
}