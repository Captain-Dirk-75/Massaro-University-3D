import * as THREE from 'three';

const CUBE_MAP_SIZE = 512;

/**
 * Shared cubemap sampled by every window — one consistent outdoor world (one sun, one pool).
 */
const WindowViewShader = {
  uniforms: {
    tCube: { value: null },
    cubeOrigin: { value: new THREE.Vector3() },
  },
  vertexShader: /* glsl */ `
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform samplerCube tCube;
    uniform vec3 cubeOrigin;
    varying vec3 vWorldPos;

    void main() {
      vec3 dir = normalize(vWorldPos - cubeOrigin);
      vec3 color = texture(tCube, dir).rgb;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export function createInteriorWindowViews({ outdoorScene, outdoorRoot, renderer }) {
  const views = [];
  const cubeOrigin = new THREE.Vector3();
  let cubeRenderTarget = null;
  let cubeCamera = null;
  let sharedMaterial = null;

  function ensureCubeResources() {
    if (cubeRenderTarget) return;
    cubeRenderTarget = new THREE.WebGLCubeRenderTarget(CUBE_MAP_SIZE);
    cubeRenderTarget.texture.colorSpace = THREE.SRGBColorSpace;
    cubeCamera = new THREE.CubeCamera(0.5, 220, cubeRenderTarget);
    sharedMaterial = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(WindowViewShader.uniforms),
      vertexShader: WindowViewShader.vertexShader,
      fragmentShader: WindowViewShader.fragmentShader,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    });
    sharedMaterial.uniforms.tCube.value = cubeRenderTarget.texture;
  }

  function registerWindow(mesh, _localPosition, _outwardNormal, offset) {
    ensureCubeResources();

    cubeOrigin.set(offset.x, offset.y + 3.2, offset.z);
    sharedMaterial.uniforms.cubeOrigin.value.copy(cubeOrigin);

    mesh.material = sharedMaterial;
    mesh.renderOrder = 2;
    views.push({ mesh });
  }

  function update() {
    if (views.length === 0 || !cubeCamera) return;

    const prevToneMapping = renderer.toneMapping;

    outdoorRoot.visible = true;
    renderer.toneMapping = THREE.NoToneMapping;

    cubeCamera.position.copy(cubeOrigin);
    cubeCamera.update(renderer, outdoorScene);

    renderer.toneMapping = prevToneMapping;
    outdoorRoot.visible = false;
  }

  function dispose() {
    for (const view of views) {
      view.mesh.material = new THREE.MeshBasicMaterial({ color: 0x888888 });
    }
    views.length = 0;
    sharedMaterial?.dispose();
    cubeRenderTarget?.dispose();
    sharedMaterial = null;
    cubeRenderTarget = null;
    cubeCamera = null;
  }

  return { registerWindow, update, dispose };
}