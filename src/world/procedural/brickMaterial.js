import * as THREE from 'three';

// ── Mood knobs ──
export const BRICK_SCALE = 0.4;
export const MORTAR_WIDTH = 0.07;

/**
 * Procedural brick pattern via shader — no texture maps.
 */
export function createBrickMaterial(lightColor, darkColor) {
  const mat = new THREE.MeshStandardMaterial({
    color: lightColor,
    roughness: 0.86,
    metalness: 0.02,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uBrickScale = { value: BRICK_SCALE };
    shader.uniforms.uMortar = { value: MORTAR_WIDTH };
    shader.uniforms.uBrickLight = { value: new THREE.Color(lightColor) };
    shader.uniforms.uBrickDark = { value: new THREE.Color(darkColor) };

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vBrickPos;`,
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
      vBrickPos = worldPosition.xyz;`,
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vBrickPos;
      uniform float uBrickScale;
      uniform float uMortar;
      uniform vec3 uBrickLight;
      uniform vec3 uBrickDark;`,
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
      vec2 bp = vBrickPos.xz / uBrickScale;
      float row = floor(bp.y);
      bp.x += mod(row, 2.0) * 0.5;
      vec2 f = fract(bp);
      float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
      float variation = 0.5 + 0.5 * sin(row * 2.3 + floor(bp.x) * 0.85);
      vec3 brickCol = mix(uBrickDark, uBrickLight, variation);
      if (edge < uMortar * 0.22) brickCol *= 0.68;
      diffuseColor.rgb = brickCol;`,
    );
  };

  return mat;
}