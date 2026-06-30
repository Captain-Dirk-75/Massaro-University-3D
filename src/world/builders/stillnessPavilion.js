import * as THREE from 'three';

// ── Mood knobs ──
export const WOOD_COLOR = 0xa09080;
export const ROOF_COLOR = 0xc8b8a8;
export const FLOOR_COLOR = 0xd8d0c0;

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createLathePost(height, radius) {
  const profile = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = t * height;
    const r = radius * (t < 0.1 ? 1.2 - t * 1.5 : t > 0.85 ? 1.0 + (t - 0.85) * 1.8 : 0.95);
    profile.push(new THREE.Vector2(r, y));
  }

  return addShadowed(
    new THREE.Mesh(
      new THREE.LatheGeometry(profile, 10),
      new THREE.MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.82 }),
    ),
  );
}

export function buildStillnessPavilion(area) {
  const pavilion = new THREE.Group();
  pavilion.position.set(area.position.x, area.position.y, area.position.z);
  pavilion.userData.campusAreaId = area.id;

  const floorShape = new THREE.Shape();
  floorShape.moveTo(-3.8, -3.2);
  floorShape.lineTo(3.8, -3.2);
  floorShape.quadraticCurveTo(4.2, -3.2, 4.2, -2.8);
  floorShape.lineTo(4.2, 2.8);
  floorShape.quadraticCurveTo(4.2, 3.2, 3.8, 3.2);
  floorShape.lineTo(-3.8, 3.2);
  floorShape.quadraticCurveTo(-4.2, 3.2, -4.2, 2.8);
  floorShape.lineTo(-4.2, -2.8);
  floorShape.quadraticCurveTo(-4.2, -3.2, -3.8, -3.2);

  const floorGeo = new THREE.ExtrudeGeometry(floorShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 1,
  });
  floorGeo.rotateX(-Math.PI / 2);

  const floor = addShadowed(
    new THREE.Mesh(
      floorGeo,
      new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.88 }),
    ),
  );
  floor.position.y = 0.06;
  pavilion.add(floor);

  const postH = 2.9;
  const postPositions = [[-3.2, -2.5], [3.2, -2.5], [-3.2, 2.5], [3.2, 2.5]];
  for (const [x, z] of postPositions) {
    const post = createLathePost(postH, 0.14);
    post.position.set(x, 0, z);
    pavilion.add(post);
  }

  const roofThickness = 0.18;
  const roofOverhang = 0.9;
  const postSpanX = 6.4;
  const postSpanZ = 5.0;
  const roof = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(postSpanX + roofOverhang * 2, roofThickness, postSpanZ + roofOverhang * 2),
      new THREE.MeshStandardMaterial({ color: ROOF_COLOR, roughness: 0.86 }),
    ),
  );
  roof.position.set(0, postH + roofThickness / 2, 0);
  pavilion.add(roof);

  const benchGeo = new THREE.BoxGeometry(2.8, 0.28, 0.55);
  const bench = addShadowed(
    new THREE.Mesh(
      benchGeo,
      new THREE.MeshStandardMaterial({ color: WOOD_COLOR, roughness: 0.85 }),
    ),
  );
  bench.position.set(0, 0.32, 0);
  pavilion.add(bench);

  return pavilion;
}