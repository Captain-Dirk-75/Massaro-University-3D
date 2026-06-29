import * as THREE from 'three';

// ── Mood knobs ──
export const LEAF_HUE_BASE = 0.32;
export const LEAF_SAT_BASE = 0.28;
export const LEAF_LIGHT_BASE = 0.42;
export const LEAF_HUE_VARIATION = 0.072;
export const LEAF_SAT_VARIATION = 0.096;
export const TRUNK_HUE_BASE = 0.08;
export const TRUNK_SAT_BASE = 0.28;
export const TRUNK_LIGHT_BASE = 0.28;

/**
 * Soft, slightly desaturated greens with per-tree hue variation.
 */
export function foliageColor(rand, lightnessJitter = 0.1, profileShift = {}) {
  const hue =
    LEAF_HUE_BASE +
    (profileShift.hueShift ?? 0) +
    (rand() - 0.5) * LEAF_HUE_VARIATION;
  const sat =
    LEAF_SAT_BASE +
    (profileShift.satShift ?? 0) +
    (rand() - 0.5) * LEAF_SAT_VARIATION;
  const light =
    LEAF_LIGHT_BASE +
    (profileShift.lightShift ?? 0) +
    (rand() - 0.5) * lightnessJitter;
  return new THREE.Color().setHSL(
    THREE.MathUtils.euclideanModulo(hue, 1),
    THREE.MathUtils.clamp(sat, 0.12, 0.48),
    THREE.MathUtils.clamp(light, 0.24, 0.58),
  );
}

/**
 * Warm bark browns with subtle per-tree variation.
 */
export function trunkColor(rand) {
  const hue = TRUNK_HUE_BASE + (rand() - 0.5) * 0.04;
  const sat = TRUNK_SAT_BASE + (rand() - 0.5) * 0.1;
  const light = TRUNK_LIGHT_BASE + (rand() - 0.5) * 0.12;
  return new THREE.Color().setHSL(
    THREE.MathUtils.euclideanModulo(hue, 1),
    THREE.MathUtils.clamp(sat, 0.15, 0.42),
    THREE.MathUtils.clamp(light, 0.18, 0.38),
  );
}

export function applyVertexColor(geometry, color) {
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}