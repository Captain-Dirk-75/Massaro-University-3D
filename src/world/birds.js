import * as THREE from 'three';
import { seededRandom } from './procedural/random.js';

// ── Mood knobs ──
export const BIRD_COUNT = 10;
export const BIRD_FLIGHT_SPEED = 2.8;
export const BIRD_WING_FLAP_SPEED = 14;

const BIRD_BODY = new THREE.Color(0x3a3835);
const BIRD_WING = new THREE.Color(0x5a5650);

function createBirdMesh() {
  const bird = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: BIRD_BODY,
    roughness: 0.8,
    flatShading: true,
  });
  const wingMat = new THREE.MeshStandardMaterial({
    color: BIRD_WING,
    roughness: 0.82,
    flatShading: true,
  });

  const body = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), bodyMat);
  body.rotation.x = Math.PI / 2;
  bird.add(body);

  const wingGeo = new THREE.ConeGeometry(0.11, 0.04, 3);
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.06, 0, 0.02);
  wingL.rotation.z = 0.55;
  wingL.name = 'wingL';
  bird.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.position.set(0.06, 0, 0.02);
  wingR.rotation.z = -0.55;
  wingR.name = 'wingR';
  bird.add(wingR);

  return bird;
}

function pickPerchIndex(perches, current, rand) {
  if (perches.length <= 1) return 0;
  let next = Math.floor(rand() * perches.length);
  let guard = 0;
  while (next === current && guard++ < 8) {
    next = Math.floor(rand() * perches.length);
  }
  return next;
}

export function createBirds(perches) {
  const group = new THREE.Group();
  const birds = [];
  const rand = seededRandom(4400);

  if (perches.length === 0) {
    return { group, birds };
  }

  for (let i = 0; i < BIRD_COUNT; i++) {
    const mesh = createBirdMesh();
    const perchIndex = i % perches.length;
    const perch = perches[perchIndex];
    const state = {
      mesh,
      mode: 'perch',
      perchIndex,
      targetIndex: pickPerchIndex(perches, perchIndex, rand),
      progress: rand(),
      perchTimer: 1.5 + rand() * 4,
      flightHeight: 4 + rand() * 6,
      speed: BIRD_FLIGHT_SPEED * (0.75 + rand() * 0.5),
      phase: rand() * Math.PI * 2,
    };

    mesh.position.set(perch.x, perch.y + 0.15, perch.z);
    mesh.rotation.y = rand() * Math.PI * 2;
    group.add(mesh);
    birds.push(state);
  }

  return { group, birds, perches };
}