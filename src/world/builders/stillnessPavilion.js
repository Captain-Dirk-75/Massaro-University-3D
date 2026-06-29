import * as THREE from 'three';

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildStillnessPavilion(area) {
  const pavilion = new THREE.Group();
  pavilion.position.set(area.position.x, area.position.y, area.position.z);
  pavilion.userData.campusAreaId = area.id;

  const woodMat = new THREE.MeshStandardMaterial({
    color: 0x9a8878,
    roughness: 0.85,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xb8a898,
    roughness: 0.88,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xd0c8b8,
    roughness: 0.9,
  });

  const floor = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 7), floorMat),
  );
  floor.position.y = 0.08;
  pavilion.add(floor);

  const postH = 2.8;
  const postPositions = [[-3.2, -2.5], [3.2, -2.5], [-3.2, 2.5], [3.2, 2.5]];
  for (const [x, z] of postPositions) {
    const post = addShadowed(
      new THREE.Mesh(new THREE.BoxGeometry(0.25, postH, 0.25), woodMat),
    );
    post.position.set(x, postH / 2, z);
    pavilion.add(post);
  }

  const roof = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.25, 7.5), roofMat),
  );
  roof.position.y = postH + 0.12;
  pavilion.add(roof);

  const bench = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 0.6), woodMat),
  );
  bench.position.set(0, 0.35, 0);
  pavilion.add(bench);

  return pavilion;
}