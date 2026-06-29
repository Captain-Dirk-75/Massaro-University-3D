import * as THREE from 'three';

const GUIDE_POSITION = { x: -7, y: 0, z: 5 };
const INTERACT_RADIUS = 3.2;

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Sage Grove — a calm robed figure, distinct from the stone kiosk.
 */
export function createGuideFigure() {
  const guide = new THREE.Group();
  guide.position.set(GUIDE_POSITION.x, GUIDE_POSITION.y, GUIDE_POSITION.z);

  const robeMat = new THREE.MeshStandardMaterial({
    color: 0x6a8a72,
    roughness: 0.92,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x8a9a88,
    roughness: 0.88,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xe0c8a8,
    roughness: 0.85,
  });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xc8e0c8,
    emissive: 0x8ab89a,
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });

  const base = addShadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.12, 12), innerMat),
  );
  base.position.y = 0.06;
  guide.add(base);

  const robe = addShadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 1.35, 14), robeMat),
  );
  robe.position.y = 0.78;
  guide.add(robe);

  const torso = addShadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.55, 12), innerMat),
  );
  torso.position.y = 1.55;
  guide.add(torso);

  const head = addShadowed(
    new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), skinMat),
  );
  head.position.y = 2.02;
  guide.add(head);

  const hood = addShadowed(
    new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), robeMat),
  );
  hood.position.y = 2.08;
  hood.rotation.x = 0.15;
  guide.add(hood);

  const orb = addShadowed(
    new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), glowMat),
  );
  orb.position.set(0.45, 2.25, 0);
  guide.add(orb);

  const staff = addShadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.5, 8), innerMat),
  );
  staff.position.set(0.42, 0.95, 0.1);
  staff.rotation.z = 0.12;
  guide.add(staff);

  return {
    group: guide,
    position: new THREE.Vector3(GUIDE_POSITION.x, 1.4, GUIDE_POSITION.z),
    radius: INTERACT_RADIUS,
    id: 'sage-grove',
    label: 'Sage Grove',
  };
}