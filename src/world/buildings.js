import * as THREE from 'three';

const BUILDING_COLOR = 0xc4b8a8;
const ROOF_COLOR = 0x8a7f72;

const PLACEHOLDERS = [
  { x: -18, z: -22, width: 10, height: 7, depth: 8 },
  { x: 5, z: -28, width: 14, height: 5, depth: 10 },
  { x: 22, z: -15, width: 8, height: 9, depth: 12 },
  { x: -8, z: 8, width: 12, height: 4, depth: 6 },
  { x: 16, z: 12, width: 7, height: 6, depth: 7 },
];

function createBuilding({ x, z, width, height, depth }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: BUILDING_COLOR,
    roughness: 0.85,
    metalness: 0.0,
  });

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    bodyMaterial,
  );
  body.position.y = height / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.6, 0.4, depth + 0.6),
    new THREE.MeshStandardMaterial({
      color: ROOF_COLOR,
      roughness: 0.9,
    }),
  );
  roof.position.y = height + 0.2;
  roof.castShadow = true;
  group.add(roof);

  return group;
}

export function createBuildings() {
  const group = new THREE.Group();

  for (const config of PLACEHOLDERS) {
    group.add(createBuilding(config));
  }

  return group;
}