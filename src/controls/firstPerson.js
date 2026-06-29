import * as THREE from 'three';
import { applyCollisionMovement } from './collisions.js';

const MOVE_SPEED = 5;
const LOOK_SENSITIVITY = 0.002;
const PLAYER_HEIGHT = 1.7;
const PITCH_LIMIT = Math.PI / 2 - 0.01;

export function createFirstPersonControls(camera, canvas, { onLockChange, colliders } = {}) {
  const keys = new Set();
  let yaw = 0;
  let pitch = 0;

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();

  canvas.addEventListener('click', () => {
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    onLockChange?.(locked);
  });

  document.addEventListener('keydown', (event) => {
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
      keys.add(event.code);
    }
  });

  document.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });

  document.addEventListener('mousemove', (event) => {
    if (document.pointerLockElement !== canvas) return;

    yaw -= event.movementX * LOOK_SENSITIVITY;
    pitch -= event.movementY * LOOK_SENSITIVITY;
    pitch = THREE.MathUtils.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
  });

  function update(delta) {
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;

    forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    right.set(1, 0, 0).applyQuaternion(camera.quaternion);
    right.y = 0;
    right.normalize();

    move.set(0, 0, 0);
    if (keys.has('KeyW')) move.add(forward);
    if (keys.has('KeyS')) move.sub(forward);
    if (keys.has('KeyD')) move.add(right);
    if (keys.has('KeyA')) move.sub(right);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(MOVE_SPEED * delta);
      applyCollisionMovement(camera, move, colliders);
    }

    camera.position.y = PLAYER_HEIGHT;
  }

  return { update };
}