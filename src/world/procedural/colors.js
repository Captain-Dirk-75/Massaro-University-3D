import * as THREE from 'three';

// ── Mood knobs ──
export const LEAF_HUE_BASE = 0.32;
export const LEAF_SAT_BASE = 0.28;
export const LEAF_LIGHT_BASE = 0.42;

/**
 * Soft, slightly desaturated greens with subtle hue variation per tree.
 */
export function foliageColor(rand, lightnessJitter = 0.08) {
  const hue = LEAF_HUE_BASE + (rand() - 0.5) * 0.06;
  const sat = LEAF_SAT_BASE + (rand() - 0.5) * 0.08;
  const light = LEAF_LIGHT_BASE + (rand() - 0.5) * lightnessJitter;
  return new THREE.Color().setHSL(
    THREE.MathUtils.euclideanModulo(hue, 1),
    THREE.MathUtils.clamp(sat, 0.15, 0.45),
    THREE.MathUtils.clamp(light, 0.28, 0.55),
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