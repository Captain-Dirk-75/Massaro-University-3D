import * as THREE from 'three';

const RT_WIDTH = 512;
const RT_HEIGHT = 384;
const WINDOW_FOV = 52;

/**
 * Renders the outdoor scene into per-window textures while the player is indoors.
 * Each pane shows the correct perspective — one shared sun, no per-window glow.
 */
export function createInteriorWindowViews({ outdoorScene, outdoorRoot, renderer }) {
  const views = [];
  const camera = new THREE.PerspectiveCamera(WINDOW_FOV, RT_WIDTH / RT_HEIGHT, 0.5, 180);
  const lookTarget = new THREE.Vector3();
  const worldOffset = new THREE.Vector3();

  function registerWindow(mesh, localPosition, outwardNormal, offset) {
    worldOffset.copy(offset);

    const rt = new THREE.WebGLRenderTarget(RT_WIDTH, RT_HEIGHT);
    rt.texture.colorSpace = THREE.SRGBColorSpace;

    mesh.material = new THREE.MeshBasicMaterial({
      map: rt.texture,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

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
    outdoorRoot.visible = true;
    renderer.autoClear = true;

    for (const view of views) {
      camera.position.copy(view.localPosition).add(worldOffset);
      lookTarget.copy(camera.position).add(view.outwardNormal);
      camera.lookAt(lookTarget);

      renderer.setRenderTarget(view.rt);
      renderer.clear();
      renderer.render(outdoorScene, camera);
    }

    renderer.setRenderTarget(prevTarget);
    renderer.autoClear = prevAutoClear;
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