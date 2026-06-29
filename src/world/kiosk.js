import * as THREE from 'three';

const KIOSK_POSITION = { x: 6, y: 0, z: 3 };
const INTERACT_RADIUS = 3.2;

function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Course Sanctuary kiosk — a simple stone marker in the quad.
 */
export function createKiosk() {
  const kiosk = new THREE.Group();
  kiosk.position.set(KIOSK_POSITION.x, KIOSK_POSITION.y, KIOSK_POSITION.z);
  kiosk.userData.interactId = 'course-sanctuary';
  kiosk.userData.interactLabel = 'Course Sanctuary';

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xc8b8a4,
    roughness: 0.88,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xa89070,
    roughness: 0.85,
  });
  const signMat = new THREE.MeshStandardMaterial({
    color: 0xe8dcc8,
    roughness: 0.75,
    emissive: 0x3a3020,
    emissiveIntensity: 0.08,
  });

  const base = addShadowed(
    new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.35, 10), stoneMat),
  );
  base.position.y = 0.18;
  kiosk.add(base);

  const pillar = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), accentMat),
  );
  pillar.position.y = 1.05;
  kiosk.add(pillar);

  const cap = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.7), stoneMat),
  );
  cap.position.y = 1.82;
  kiosk.add(cap);

  const sign = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.12), signMat),
  );
  sign.position.set(0, 2.35, 0);
  kiosk.add(sign);

  const symbol = addShadowed(
    new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 16), accentMat),
  );
  symbol.position.set(0, 2.35, 0.1);
  symbol.rotation.x = Math.PI / 2;
  kiosk.add(symbol);

  return {
    group: kiosk,
    position: new THREE.Vector3(KIOSK_POSITION.x, 1.2, KIOSK_POSITION.z),
    radius: INTERACT_RADIUS,
    id: 'course-sanctuary',
    label: 'Course Sanctuary',
  };
}