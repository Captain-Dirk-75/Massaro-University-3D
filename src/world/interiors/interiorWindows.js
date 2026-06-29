import * as THREE from 'three';

const RT_HEIGHT = 512;
const WINDOW_W = 3.0;
const WINDOW_H = 2.2;
const V_FOV = 44;

function assignSliceGeometry(mesh, index, count) {
  const geo = mesh.geometry.clone();
  const uv = geo.attributes.uv;

  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    uv.setXY(i, u / count + index / count, v);
  }

  geo.attributes.uv.needsUpdate = true;
  mesh.geometry = geo;
}

/**
 * One outdoor render per wall row; UV-sliced panes share the same live texture.
 */
export function createInteriorWindowViews({ outdoorScene, outdoorRoot, renderer }) {
  /** @type {Map<string, { rt: THREE.WebGLRenderTarget, camera: THREE.PerspectiveCamera }>} */
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

      const camera = new THREE.PerspectiveCamera(V_FOV, rtWidth / RT_HEIGHT, 0.5, 220);

      const ref = entries[0];
      const camPos = new THREE.Vector3(0, ref.localPosition.y, ref.localPosition.z);
      camera.position.copy(camPos).add(worldOffset);
      lookTarget.copy(camera.position).add(ref.outwardNormal);
      camera.lookAt(lookTarget);
      camera.updateMatrixWorld(true);

      wallGroups.set(wallKey, { rt, camera });

      entries.forEach((entry, index) => {
        assignSliceGeometry(entry.mesh, index, count);
        entry.mesh.material = new THREE.MeshBasicMaterial({
          map: rt.texture,
          toneMapped: false,
          depthWrite: false,
          depthTest: true,
          side: THREE.DoubleSide,
        });
        entry.mesh.renderOrder = 2;
        entry.mesh.frustumCulled = false;
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
    const prevExposure = renderer.toneMappingExposure;
    const prevPixelRatio = renderer.getPixelRatio();

    outdoorRoot.visible = true;
    outdoorRoot.traverse((obj) => {
      obj.visible = true;
    });
    renderer.autoClear = true;
    renderer.setPixelRatio(1);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;

    for (const { rt, camera } of wallGroups.values()) {
      renderer.setRenderTarget(rt);
      renderer.setViewport(0, 0, rt.width, rt.height);
      renderer.clear(true, true, true);
      renderer.render(outdoorScene, camera);
    }

    renderer.setRenderTarget(prevTarget);
    renderer.setPixelRatio(prevPixelRatio);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.autoClear = prevAutoClear;
    renderer.toneMapping = prevToneMapping;
    renderer.toneMappingExposure = prevExposure;
    outdoorRoot.visible = false;
  }

  function dispose() {
    for (const { rt } of wallGroups.values()) {
      rt.dispose();
    }
    wallGroups.clear();
    pending.length = 0;
    finalized = false;
  }

  return { registerWindow, finalize, update, dispose };
}