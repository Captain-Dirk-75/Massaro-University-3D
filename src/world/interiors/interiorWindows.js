import * as THREE from 'three';

const CUBE_SIZE = 512;

/** Campus-world point used to capture and sample the shared outdoor environment. */
export const LIBRARY_PROBE_WORLD = new THREE.Vector3(0, 5, -32);

const WindowCubemapShader = {
  uniforms: {
    tCube: { value: null },
    cubeOriginWorld: { value: LIBRARY_PROBE_WORLD.clone() },
    spaceOffset: { value: new THREE.Vector3() },
  },
  vertexShader: /* glsl */ `
    varying vec3 vWorldPos;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vWorldPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform samplerCube tCube;
    uniform vec3 cubeOriginWorld;
    uniform vec3 spaceOffset;
    varying vec3 vWorldPos;

    void main() {
      vec3 worldPos = vWorldPos + spaceOffset;
      vec3 dir = normalize(worldPos - cubeOriginWorld);
      vec3 color = texture(tCube, dir).rgb;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

function createWindowMaterial(cubeTexture, spaceOffset) {
  return new THREE.ShaderMaterial({
    uniforms: {
      tCube: { value: cubeTexture },
      cubeOriginWorld: { value: LIBRARY_PROBE_WORLD.clone() },
      spaceOffset: { value: spaceOffset.clone() },
    },
    vertexShader: WindowCubemapShader.vertexShader,
    fragmentShader: WindowCubemapShader.fragmentShader,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

/**
 * One shared cubemap of the campus; each pane samples by its world position (true parallax).
 */
export function createInteriorWindowViews({ outdoorScene, outdoorRoot, renderer }) {
  const views = [];
  let cubeRenderTarget = null;
  let cubeCamera = null;

  function ensureCube() {
    if (cubeRenderTarget) return;
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(CUBE_SIZE);
    cubeRenderTarget.texture.colorSpace = THREE.SRGBColorSpace;
    cubeCamera = new THREE.CubeCamera(0.5, 220, cubeRenderTarget);
  }

  function registerWindow(mesh, _localPosition, _outwardNormal, offset, _meta = {}) {
    ensureCube();
    mesh.material = createWindowMaterial(cubeRenderTarget.texture, offset);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    views.push({ mesh });
  }

  function registerExteriorWindow(mesh) {
    ensureCube();
    mesh.material = createWindowMaterial(cubeRenderTarget.texture, new THREE.Vector3(0, 0, 0));
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    views.push({ mesh });
  }

  function finalize() {
    // Cubemap path has no deferred grouping.
  }

  function update() {
    if (views.length === 0 || !cubeCamera) return;

    const prevTarget = renderer.getRenderTarget();
    const prevAutoClear = renderer.autoClear;
    const prevToneMapping = renderer.toneMapping;
    const prevExposure = renderer.toneMappingExposure;
    const prevPixelRatio = renderer.getPixelRatio();
    const wasOutdoorVisible = outdoorRoot.visible;

    outdoorRoot.visible = true;
    outdoorRoot.traverse((obj) => {
      obj.visible = true;
    });
    renderer.autoClear = true;
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;

    cubeCamera.position.copy(LIBRARY_PROBE_WORLD);
    cubeCamera.update(renderer, outdoorScene);

    renderer.setRenderTarget(prevTarget);
    renderer.setPixelRatio(prevPixelRatio);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.autoClear = prevAutoClear;
    renderer.toneMapping = prevToneMapping;
    renderer.toneMappingExposure = prevExposure;
    outdoorRoot.visible = wasOutdoorVisible;
  }

  function dispose() {
    for (const { mesh } of views) {
      mesh.material.dispose();
    }
    views.length = 0;
    cubeRenderTarget?.dispose();
    cubeRenderTarget = null;
    cubeCamera = null;
  }

  return { registerWindow, registerExteriorWindow, finalize, update, dispose };
}