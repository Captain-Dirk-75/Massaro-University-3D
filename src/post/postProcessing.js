import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ── Mood knobs — tweak these to shift the cinematic feel ──
export const BLOOM_STRENGTH = 0.38;
export const BLOOM_RADIUS = 0.48;
export const BLOOM_THRESHOLD = 0.78;
export const COLOR_WARMTH = 0.22;
export const COLOR_SATURATION = 1.1;

const WarmGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    warmth: { value: COLOR_WARMTH },
    saturation: { value: COLOR_SATURATION },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float warmth;
    uniform float saturation;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      color.r += warmth * 0.1;
      color.g += warmth * 0.03;
      color.b -= warmth * 0.06;

      float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      color.rgb = mix(vec3(luma), color.rgb, saturation);

      gl_FragColor = color;
    }
  `,
};

export function createPostProcessing(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    BLOOM_STRENGTH,
    BLOOM_RADIUS,
    BLOOM_THRESHOLD,
  );
  composer.addPass(bloomPass);

  const gradePass = new ShaderPass(WarmGradeShader);
  composer.addPass(gradePass);

  composer.addPass(new OutputPass());

  function setSize(width, height) {
    composer.setSize(width, height);
    bloomPass.resolution.set(width, height);
  }

  return { composer, setSize };
}