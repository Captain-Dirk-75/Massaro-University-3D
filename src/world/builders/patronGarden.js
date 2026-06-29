import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom } from '../procedural/random.js';
import { foliageColor, applyVertexColor } from '../procedural/colors.js';
import { sampleGroundHeight } from '../ground.js';

// ── Mood knobs ──
export const HEDGE_COLOR = 0x5a8a58;
export const PATH_COLOR = 0xd8cfc0;
export const STONE_ACCENT = 0xc0b0a0;

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createGardenTree(x, z, scale, seed, areaPos) {
  const rand = seededRandom(seed);
  const group = new THREE.Group();
  const y = sampleGroundHeight(areaPos.x + x, areaPos.z + z) - areaPos.y;

  const trunkH = 1.4 * scale;
  const trunk = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.06 * scale, 0.11 * scale, trunkH, 7),
      new THREE.MeshStandardMaterial({ color: 0x6b4f3e, roughness: 0.94, flatShading: true }),
    ),
  );
  trunk.position.y = trunkH / 2;
  group.add(trunk);

  const pieces = [];
  for (let i = 0; i < 3; i++) {
    const r = scale * (0.42 - i * 0.08);
    const geo = new THREE.IcosahedronGeometry(r, 1);
    applyVertexColor(geo, foliageColor(rand, 0.06));
    const matrix = new THREE.Matrix4();
    const layerY = i === 0 ? trunkH + r : trunkH + i * scale * 0.28 + r;
    matrix.setPosition((rand() - 0.5) * 0.2, layerY, (rand() - 0.5) * 0.2);
    geo.applyMatrix4(matrix);
    pieces.push(geo);
  }

  const canopy = addShadowed(
    new THREE.Mesh(
      mergeGeometries(pieces, true),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.92,
        flatShading: true,
      }),
    ),
  );
  group.add(canopy);

  group.position.set(x, y, z);
  group.rotation.y = rand() * Math.PI * 2;
  return group;
}

export function buildPatronGarden(area) {
  const garden = new THREE.Group();
  garden.position.set(area.position.x, area.position.y, area.position.z);
  garden.userData.campusAreaId = area.id;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: STONE_ACCENT,
    roughness: 0.88,
  });
  const hedgeMat = new THREE.MeshStandardMaterial({
    color: HEDGE_COLOR,
    roughness: 0.92,
    flatShading: true,
  });
  const pathMat = new THREE.MeshStandardMaterial({
    color: PATH_COLOR,
    roughness: 0.86,
  });

  const pathShape = new THREE.Shape();
  pathShape.moveTo(-5.5, -4.5);
  pathShape.lineTo(5.5, -4.5);
  pathShape.quadraticCurveTo(6, -4.5, 6, -4);
  pathShape.lineTo(6, 4);
  pathShape.quadraticCurveTo(6, 4.5, 5.5, 4.5);
  pathShape.lineTo(-5.5, 4.5);
  pathShape.quadraticCurveTo(-6, 4.5, -6, 4);
  pathShape.lineTo(-6, -4);
  pathShape.quadraticCurveTo(-6, -4.5, -5.5, -4.5);

  const pathGeo = new THREE.ExtrudeGeometry(pathShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
  });
  pathGeo.rotateX(-Math.PI / 2);

  const ground = addShadowed(new THREE.Mesh(pathGeo, pathMat));
  ground.position.y = 0.03;
  garden.add(ground);

  const hedgePositions = [
    [0, 0.32, -4.6, 11, 0.45, 0.35],
    [0, 0.32, 4.6, 11, 0.45, 0.35],
    [-5.5, 0.32, 0, 0.35, 0.45, 9],
  ];
  for (const [x, y, z, w, h, d] of hedgePositions) {
    const wall = addShadowed(
      new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        hedgeMat,
      ),
    );
    wall.position.set(x, y, z);
    garden.add(wall);
  }

  const bench = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.7), stoneMat),
  );
  bench.position.set(-2, 0.2, 2);
  garden.add(bench);

  const circle = addShadowed(
    new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 24), stoneMat),
  );
  circle.rotation.x = Math.PI / 2;
  circle.position.set(1.5, 0.06, -1.5);
  garden.add(circle);

  const treeSpots = [[-3.5, -2.5], [-1.3, -2.5], [1.3, 1.5], [3.5, -1]];
  treeSpots.forEach(([x, z], i) => {
    garden.add(createGardenTree(x, z, 0.85 + (i % 2) * 0.15, 500 + i, area.position));
  });

  return garden;
}