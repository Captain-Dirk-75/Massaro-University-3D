import * as THREE from 'three';
import { BODY_PRESETS } from './presets.js';
import { getColorById } from './colors.js';

const SKIN = 0xe8c8a8;
const LEG_COLOR = 0x4a4a52;

function addPart(geometry, material, position, parent) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

/**
 * Build a primitive placeholder avatar from body preset + accent colour.
 */
export function buildAvatarFigure({ bodyPreset, colorId }) {
  const preset = BODY_PRESETS[bodyPreset] ?? BODY_PRESETS.average;
  const accent = getColorById(colorId);

  const figure = new THREE.Group();
  figure.scale.setScalar(preset.scale);

  const skinMat = new THREE.MeshStandardMaterial({
    color: SKIN,
    roughness: 0.85,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: accent.hex,
    roughness: 0.8,
  });
  const legMat = new THREE.MeshStandardMaterial({
    color: LEG_COLOR,
    roughness: 0.9,
  });

  const legH = preset.legHeight;
  const torsoH = preset.torsoHeight;
  const torsoW = preset.torsoWidth;
  const legW = preset.legWidth;
  const armL = preset.armLength;
  const shoulderW = preset.shoulderWidth;

  const hipY = legH;

  addPart(
    new THREE.BoxGeometry(legW, legH, legW),
    legMat,
    new THREE.Vector3(-torsoW * 0.22, legH / 2, 0),
    figure,
  );
  addPart(
    new THREE.BoxGeometry(legW, legH, legW),
    legMat,
    new THREE.Vector3(torsoW * 0.22, legH / 2, 0),
    figure,
  );

  addPart(
    new THREE.BoxGeometry(torsoW, torsoH, torsoW * 0.55),
    accentMat,
    new THREE.Vector3(0, hipY + torsoH / 2, 0),
    figure,
  );

  const armW = legW * 0.85;
  addPart(
    new THREE.BoxGeometry(armW, armL, armW),
    accentMat,
    new THREE.Vector3(-shoulderW / 2 - armW / 2, hipY + torsoH * 0.72, 0),
    figure,
  );
  addPart(
    new THREE.BoxGeometry(armW, armL, armW),
    accentMat,
    new THREE.Vector3(shoulderW / 2 + armW / 2, hipY + torsoH * 0.72, 0),
    figure,
  );

  addPart(
    new THREE.SphereGeometry(preset.headRadius, 12, 10),
    skinMat,
    new THREE.Vector3(0, hipY + torsoH + preset.headRadius * 0.9, 0),
    figure,
  );

  return figure;
}

export function replaceAvatarFigure(container, options) {
  while (container.children.length > 0) {
    const child = container.children[0];
    container.remove(child);
    child.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
  }
  container.add(buildAvatarFigure(options));
  return container;
}