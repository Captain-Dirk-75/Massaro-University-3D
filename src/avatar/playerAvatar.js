import * as THREE from 'three';
import { replaceAvatarFigure } from './avatarFigure.js';

/**
 * World-space avatar synced to the player camera.
 * Hidden in first-person; kept for future third-person / multiplayer.
 */
export function createPlayerAvatar(scene) {
  const root = new THREE.Group();
  root.visible = false;
  scene.add(root);

  function updateFromProfile(profile) {
    replaceAvatarFigure(root, profile);
  }

  function syncToCamera(camera) {
    root.position.copy(camera.position);
    root.position.y = 0;
    root.rotation.y = camera.rotation.y;
  }

  return { root, updateFromProfile, syncToCamera };
}