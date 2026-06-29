import * as THREE from 'three';

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildPatronGarden(area) {
  const garden = new THREE.Group();
  garden.position.set(area.position.x, area.position.y, area.position.z);
  garden.userData.campusAreaId = area.id;

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xc0b0a0,
    roughness: 0.9,
  });
  const hedgeMat = new THREE.MeshStandardMaterial({
    color: 0x4a7a48,
    roughness: 0.92,
    flatShading: true,
  });
  const pathMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.88,
  });

  const ground = addShadowed(
    new THREE.Mesh(new THREE.PlaneGeometry(12, 10), pathMat),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0.02;
  garden.add(ground);

  const borderPositions = [
    [0, 0.35, -4.8, 12, 0.5, 0.4],
    [0, 0.35, 4.8, 12, 0.5, 0.4],
    [-5.8, 0.35, 0, 0.4, 0.5, 10],
  ];
  for (const [x, y, z, w, h, d] of borderPositions) {
    const wall = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hedgeMat));
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

  for (let i = 0; i < 4; i++) {
    const tree = new THREE.Group();
    const trunk = addShadowed(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x6a5040, roughness: 0.95 }),
      ),
    );
    trunk.position.y = 0.6;
    tree.add(trunk);
    const foliage = addShadowed(
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.55, 0),
        hedgeMat,
      ),
    );
    foliage.position.y = 1.35;
    tree.add(foliage);
    tree.position.set(-3.5 + i * 2.2, 0, -2.5 + (i % 2) * 3);
    garden.add(tree);
  }

  return garden;
}