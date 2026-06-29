import * as THREE from 'three';

// ── Mood knobs ──
export const STONE_COLOR = 0xd8cfc0;
export const STONE_DARK = 0xb8a898;
export const WINDOW_GLOW = 0xffe8c0;
export const WINDOW_GLOW_INTENSITY = 0.55;

const stoneMat = () =>
  new THREE.MeshStandardMaterial({
    color: STONE_COLOR,
    roughness: 0.82,
    metalness: 0.02,
  });

const stoneDarkMat = () =>
  new THREE.MeshStandardMaterial({
    color: STONE_DARK,
    roughness: 0.88,
    metalness: 0.0,
  });

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createColumn(height, radius) {
  const col = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.08, height, 12),
      stoneMat(),
    ),
  );
  col.position.y = height / 2;

  const capital = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.35, radius * 1.1, 0.35, 12),
      stoneMat(),
    ),
  );
  capital.position.y = height + 0.18;
  col.add(capital);

  const base = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.2, radius * 1.35, 0.3, 12),
      stoneDarkMat(),
    ),
  );
  base.position.y = 0.15;
  col.add(base);

  return col;
}

function createArchedWindow(width, height) {
  const group = new THREE.Group();

  const frame = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.5, height + 0.5, 0.35),
      stoneDarkMat(),
    ),
  );
  frame.position.z = 0.1;
  group.add(frame);

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height * 0.82),
    new THREE.MeshStandardMaterial({
      color: 0x8ab0c8,
      emissive: WINDOW_GLOW,
      emissiveIntensity: WINDOW_GLOW_INTENSITY,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    }),
  );
  glass.position.z = 0.32;
  group.add(glass);

  const arch = addShadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(width / 2, 0.18, 8, 16, Math.PI),
      stoneDarkMat(),
    ),
  );
  arch.position.y = height * 0.41;
  arch.position.z = 0.1;
  arch.rotation.x = Math.PI / 2;
  group.add(arch);

  const sill = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.8, 0.15, 0.5),
      stoneMat(),
    ),
  );
  sill.position.y = -height / 2 + 0.08;
  sill.position.z = 0.2;
  group.add(sill);

  return group;
}

/**
 * Elegant library entrance facade — columns, arches, warm-lit windows.
 */
export function buildLibrary(area) {
  const library = new THREE.Group();
  library.position.set(area.position.x, area.position.y, area.position.z);
  library.userData.campusAreaId = area.id;

  const facadeWidth = 30;
  const facadeHeight = 11;
  const porticoDepth = 5;

  const mainWall = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth, facadeHeight, 1.2),
      stoneMat(),
    ),
  );
  mainWall.position.y = facadeHeight / 2;
  mainWall.position.z = -0.6;
  library.add(mainWall);

  const pediment = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth + 1, 0.6, 1.8),
      stoneMat(),
    ),
  );
  pediment.position.set(0, facadeHeight + 0.3, 0.2);
  library.add(pediment);

  const roof = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth + 2, 0.5, 4),
      stoneDarkMat(),
    ),
  );
  roof.position.set(0, facadeHeight + 0.85, -0.5);
  library.add(roof);

  const porticoFloor = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth - 2, 0.25, porticoDepth),
      stoneDarkMat(),
    ),
  );
  porticoFloor.position.set(0, 0.12, porticoDepth / 2 - 0.5);
  library.add(porticoFloor);

  const entablature = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(facadeWidth - 1, 0.5, porticoDepth + 0.4),
      stoneMat(),
    ),
  );
  entablature.position.set(0, 7.8, porticoDepth / 2 - 0.3);
  library.add(entablature);

  const columnCount = 6;
  const columnSpacing = (facadeWidth - 6) / (columnCount - 1);
  for (let i = 0; i < columnCount; i++) {
    const col = createColumn(7.2, 0.38);
    col.position.set(-(facadeWidth - 6) / 2 + i * columnSpacing, 0, 2.8);
    library.add(col);
  }

  const doorArch = addShadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.22, 10, 20, Math.PI),
      stoneDarkMat(),
    ),
  );
  doorArch.position.set(0, 3.6, 2.6);
  doorArch.rotation.x = Math.PI / 2;
  library.add(doorArch);

  const doorway = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.6, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x3a3028,
        roughness: 0.95,
      }),
    ),
  );
  doorway.position.set(0, 1.8, 2.5);
  library.add(doorway);

  const windowPositions = [-9, -3, 3, 9];
  for (const x of windowPositions) {
    const win = createArchedWindow(3.6, 4.8);
    win.position.set(x, 6.2, 0.8);
    library.add(win);
  }

  const steps = [6, 4.5, 3];
  steps.forEach((width, i) => {
    const step = addShadowed(
      new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.22, 1.2),
        stoneDarkMat(),
      ),
    );
    step.position.set(0, 0.22 * (i + 1), 4.5 + i * 1.1);
    library.add(step);
  });

  const wingL = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 8),
      stoneMat(),
    ),
  );
  wingL.position.set(-18, 4, -2);
  library.add(wingL);

  const wingR = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(6, 8, 8),
      stoneMat(),
    ),
  );
  wingR.position.set(18, 4, -2);
  library.add(wingR);

  return library;
}