import * as THREE from 'three';

const RT_WIDTH = 640;
const RT_HEIGHT = 480;
const WINDOW_FOV = 54;

/**
 * Renders the outdoor scene into per-window textures while the player is indoors.
 */
export function createInteriorWindowViews({ outdoorScene, outdoorRoot, renderer }) {
  const views = [];
  const camera = new THREE.PerspectiveCamera(WINDOW_FOV, RT_WIDTH / RT_HEIGHT, 0.5, 200);
  const lookTarget = new THREE.Vector3();
  const worldOffset = new THREE.Vector3();

  function registerWindow(mesh, localPosition, outwardNormal, offset) {
    worldOffset.copy(offset);

    const rt = new THREE.WebGLRenderTarget(RT_WIDTH, RT_HEIGHT, {
      generateMipmaps: false,
      depthBuffer: true,
    });
    rt.texture.colorSpace = THREE.SRGBColorSpace;
    rt.texture.flipY = false;

    mesh.material = new THREE.MeshBasicMaterial({
      map: rt.texture,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    mesh.renderOrder = 2;

    views.push({
      mesh,
      localPosition: localPosition.clone(),
      outwardNormal: outwardNormal.clone(),
      rt,
    });
  }

  function update() {
    if (views.length === 0) return;

    const prevTarget = renderer.getRenderTarget();
    const prevAutoClear = renderer.autoClear;
    const prevToneMapping = renderer.toneMapping;
    const prevExposure = renderer.toneMappingExposure;

    outdoorRoot.visible = true;
    renderer.autoClear = true;
    renderer.toneMapping = THREE.NoToneMapping;

    for (const view of views) {
      camera.position.copy(view.localPosition).add(worldOffset);
      lookTarget.copy(camera.position).add(view.outwardNormal);
      camera.lookAt(lookTarget);
      camera.updateMatrixWorld(true);

      renderer.setRenderTarget(view.rt);
      renderer.setViewport(0, 0, RT_WIDTH, RT_HEIGHT);
      renderer.clear();
      renderer.render(outdoorScene, camera);
    }

    renderer.setRenderTarget(prevTarget);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.autoClear = prevAutoClear;
    renderer.toneMapping = prevToneMapping;
    renderer.toneMappingExposure = prevExposure;
    outdoorRoot.visible = false;
  }

  function dispose() {
    for (const view of views) {
      view.rt.dispose();
      view.mesh.material.dispose();
    }
    views.length = 0;
  }

  return { registerWindow, update, dispose };
}