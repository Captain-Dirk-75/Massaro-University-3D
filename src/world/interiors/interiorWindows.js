import * as THREE from 'three';

const RT_HEIGHT = 480;
const WINDOW_W = 3.0;
const WINDOW_H = 2.2;
const V_FOV = 42;

/**
 * One outdoor render per wall row; each pane shows a slice (continuous panorama).
 */
export function createInteriorWindowViews({ outdoorScene, outdoorRoot, renderer }) {
  /** @type {Map<string, { rt: THREE.WebGLRenderTarget, camera: THREE.PerspectiveCamera, meshes: THREE.Mesh[] }>} */
  const wallGroups = new Map();
  const pending = [];
  const worldOffset = new THREE.Vector3();
  const lookTarget = new THREE.Vector3();
  let finalized = false;

  function registerWindow(mesh, localPosition, outwardNormal, offset, meta = {}) {
    pending.push({
      mesh,
      localPosition: localPosition.clone(),
      outwardNormal: outwardNormal.clone(),
      wallKey: meta.wallKey ?? 'default',
      wallX: meta.wallX ?? 0,
    });
    worldOffset.copy(offset);
  }

  function finalize() {
    if (finalized) return;
    finalized = true;

    const grouped = new Map();
    for (const entry of pending) {
      if (!grouped.has(entry.wallKey)) grouped.set(entry.wallKey, []);
      grouped.get(entry.wallKey).push(entry);
    }

    for (const [wallKey, entries] of grouped) {
      entries.sort((a, b) => a.wallX - b.wallX);
      const count = entries.length;
      const rtWidth = Math.round(RT_HEIGHT * ((WINDOW_W * count) / WINDOW_H));

      const rt = new THREE.WebGLRenderTarget(rtWidth, RT_HEIGHT, {
        generateMipmaps: false,
        depthBuffer: true,
      });
      rt.texture.colorSpace = THREE.SRGBColorSpace;
      rt.texture.flipY = false;

      const aspect = rtWidth / RT_HEIGHT;
      const camera = new THREE.PerspectiveCamera(V_FOV, aspect, 0.5, 200);

      const ref = entries[0];
      const camPos = new THREE.Vector3(0, ref.localPosition.y, ref.localPosition.z);
      camera.position.copy(camPos).add(worldOffset);
      lookTarget.copy(camera.position).add(ref.outwardNormal);
      camera.lookAt(lookTarget);

      wallGroups.set(wallKey, { rt, camera, meshes: [] });

      const sliceW = 1 / count;

      entries.forEach((entry, index) => {
        const map = rt.texture.clone();
        map.repeat.set(sliceW, 1);
        map.offset.set(index * sliceW, 0);
        map.wrapS = THREE.ClampToEdgeWrapping;
        map.wrapT = THREE.ClampToEdgeWrapping;

        entry.mesh.material = new THREE.MeshBasicMaterial({
          map,
          toneMapped: false,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
        });
        entry.mesh.renderOrder = 2;
        wallGroups.get(wallKey).meshes.push(entry.mesh);
      });
    }

    pending.length = 0;
  }

  function update() {
    if (!finalized) finalize();
    if (wallGroups.size === 0) return;

    const prevTarget = renderer.getRenderTarget();
    const prevAutoClear = renderer.autoClear;
    const prevToneMapping = renderer.toneMapping;

    outdoorRoot.visible = true;
    renderer.autoClear = true;
    renderer.toneMapping = THREE.NoToneMapping;

    for (const { rt, camera } of wallGroups.values()) {
      camera.updateMatrixWorld(true);
      renderer.setRenderTarget(rt);
      renderer.setViewport(0, 0, rt.width, rt.height);
      renderer.clear();
      renderer.render(outdoorScene, camera);
    }

    renderer.setRenderTarget(prevTarget);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.autoClear = prevAutoClear;
    renderer.toneMapping = prevToneMapping;
    outdoorRoot.visible = false;
  }

  function dispose() {
    for (const { rt, meshes } of wallGroups.values()) {
      for (const mesh of meshes) {
        mesh.material.dispose();
      }
      rt.dispose();
    }
    wallGroups.clear();
    pending.length = 0;
    finalized = false;
  }

  return { registerWindow, finalize, update, dispose };
}