import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, hashSeed } from './procedural/random.js';
import { createWaterMaterial } from './waterFeature.js';
import { getTerrainHeight } from './ground.js';
import {
  CREEK_NODES,
  WATERFALL_SEGMENT,
  WATERFALL,
  CREEK_HALF_WIDTH,
} from './creek.js';

// ── Mood knobs ──
export const CREEK_SURFACE_LIFT = 0.03; // water sits just above the carved bed
export const CREEK_WATER_OPACITY = 0.8;
export const CREEK_DEEP = new THREE.Color(0x35606a);
export const CREEK_SHALLOW = new THREE.Color(0x6fa6b0);
export const WATERFALL_SHALLOW = new THREE.Color(0xdff0f2);
export const WATERFALL_OPACITY = 0.72;
export const MIST_COUNT = 26;
export const MIST_RISE_SPEED = 0.5;
export const MIST_GLOW = new THREE.Color(0xeef2f0);
export const BANK_STONE_COLOR = 0x9a9088;

// ── Bridge knobs ──
export const BRIDGE_NODE = 8; // which creek node the little bridge crosses
export const BRIDGE_LENGTH = 5.4; // span across the creek (bank to bank)
export const BRIDGE_WIDTH = 1.5;
export const BRIDGE_ARCH = 0.5; // rise at the crown
export const BRIDGE_WOOD = 0x8a6a4a;
export const BRIDGE_WOOD_DARK = 0x6f543a;

const UP = new THREE.Vector3(0, 1, 0);

/** One flat, horizontally-oriented water quad aligned to a stream segment. */
function buildStreamSegment(a, b, material) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  if (len < 1e-3) return null;

  const width = CREEK_HALF_WIDTH * 2 * 1.05;
  // Overlap ends slightly so bends don't gap.
  const geo = new THREE.PlaneGeometry(width, len + 0.4, 2, Math.max(2, Math.round(len * 2)));

  const forward = new THREE.Vector3(dx, 0, dz).divideScalar(len);
  // right = forward × UP keeps the basis right-handed (det +1) so the quad lies
  // FLAT with its normal up; the shader's ripple (local +z) then bobs vertically.
  const right = new THREE.Vector3().crossVectors(forward, UP).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, forward, UP);

  const mesh = new THREE.Mesh(geo, material);
  mesh.quaternion.setFromRotationMatrix(basis);
  mesh.position.set(
    (a.x + b.x) / 2,
    (a.bed + b.bed) / 2 + CREEK_SURFACE_LIFT,
    (a.z + b.z) / 2,
  );
  mesh.renderOrder = 1;
  return mesh;
}

/** The little waterfall — a steep sheet from the lip down to the plunge pool. */
function buildWaterfallSheet(material) {
  const dir = new THREE.Vector3(WATERFALL.dir.x, 0, WATERFALL.dir.z).normalize();
  const right = new THREE.Vector3().crossVectors(UP, dir).normalize();
  const halfW = WATERFALL.width / 2;

  const drop = WATERFALL.lipY - WATERFALL.plungeY;
  const run = Math.max(0.5, drop * 0.7); // steep but not a sheer cliff

  const lip = new THREE.Vector3(WATERFALL.x, WATERFALL.lipY, WATERFALL.z);
  const base = lip
    .clone()
    .addScaledVector(dir, run)
    .add(new THREE.Vector3(0, -drop, 0));

  const lL = lip.clone().addScaledVector(right, -halfW);
  const lR = lip.clone().addScaledVector(right, halfW);
  const bL = base.clone().addScaledVector(right, -halfW * 1.15);
  const bR = base.clone().addScaledVector(right, halfW * 1.15);

  const positions = new Float32Array([
    lL.x, lL.y, lL.z,
    lR.x, lR.y, lR.z,
    bR.x, bR.y, bR.z,
    bL.x, bL.y, bL.z,
  ]);
  const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, material);
  mesh.renderOrder = 1;
  return { mesh, base };
}

function buildMist(plungeBase) {
  const positions = new Float32Array(MIST_COUNT * 3);
  const seeds = [];
  const baseY = WATERFALL.plungeY;

  for (let i = 0; i < MIST_COUNT; i++) {
    const rand = seededRandom(1700 + i);
    const ox = plungeBase.x + (rand() - 0.5) * 2.2;
    const oz = plungeBase.z + (rand() - 0.5) * 2.2;
    positions[i * 3] = ox;
    positions[i * 3 + 1] = baseY + rand() * 0.6;
    positions[i * 3 + 2] = oz;
    seeds.push({
      ox,
      oz,
      phase: rand() * Math.PI * 2,
      speed: 0.6 + rand() * 0.8,
      rise: 0.7 + rand() * 0.9,
      sway: 0.2 + rand() * 0.3,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: MIST_GLOW,
    size: 0.55,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    blending: THREE.NormalBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return { points, seeds, positions, baseY };
}

function buildBankStones() {
  const geometries = [];
  const rand = seededRandom(2200);

  for (let i = 0; i < CREEK_NODES.length; i++) {
    const n = CREEK_NODES[i];
    // A couple of stones framing the channel at each node.
    for (const side of [-1, 1]) {
      if (rand() > 0.72) continue;
      const dxTo = (CREEK_NODES[Math.min(i + 1, CREEK_NODES.length - 1)].x - n.x);
      const dzTo = (CREEK_NODES[Math.min(i + 1, CREEK_NODES.length - 1)].z - n.z);
      const len = Math.hypot(dxTo, dzTo) || 1;
      const px = -dzTo / len;
      const pz = dxTo / len;
      const off = CREEK_HALF_WIDTH + 0.25 + rand() * 0.3;
      const sx = n.x + px * off * side;
      const sz = n.z + pz * off * side;
      const scale = 0.22 + rand() * 0.3;
      const y = getTerrainHeight(sx, sz) + scale * 0.25;

      const geo = new THREE.IcosahedronGeometry(scale, 0);
      const pos = geo.attributes.position;
      const r2 = seededRandom(hashSeed(sx, sz));
      for (let v = 0; v < pos.count; v++) {
        pos.setXYZ(
          v,
          pos.getX(v) * (0.8 + r2() * 0.5),
          pos.getY(v) * (0.6 + r2() * 0.4),
          pos.getZ(v) * (0.8 + r2() * 0.5),
        );
      }
      geo.computeVertexNormals();
      geo.translate(sx, y, sz);
      geometries.push(geo);
    }
  }

  if (geometries.length === 0) return null;
  const merged = mergeGeometries(geometries, false);
  const mesh = new THREE.Mesh(
    merged,
    new THREE.MeshStandardMaterial({
      color: BANK_STONE_COLOR,
      roughness: 0.95,
      flatShading: true,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A little arched wooden footbridge so people can cross the creek. */
function buildBridge() {
  const node = CREEK_NODES[BRIDGE_NODE];
  const prev = CREEK_NODES[BRIDGE_NODE - 1];
  const next = CREEK_NODES[Math.min(BRIDGE_NODE + 1, CREEK_NODES.length - 1)];
  // Flow direction, then the span (across the creek) perpendicular to it.
  const fdx = next.x - prev.x;
  const fdz = next.z - prev.z;
  const flen = Math.hypot(fdx, fdz) || 1;
  const span = new THREE.Vector3(-fdz / flen, 0, fdx / flen); // perpendicular, horizontal
  const zAxis = new THREE.Vector3().crossVectors(span, UP); // right-handed width axis
  const basis = new THREE.Matrix4().makeBasis(span, UP, zAxis);

  const L = BRIDGE_LENGTH;
  const half = L / 2;
  const arch = (x) => BRIDGE_ARCH * (1 - (x / half) * (x / half));

  // Seat the deck ends on the banks (sample terrain just past each end).
  const endAx = node.x + span.x * (half + 0.3);
  const endAz = node.z + span.z * (half + 0.3);
  const endBx = node.x - span.x * (half + 0.3);
  const endBz = node.z - span.z * (half + 0.3);
  const baseY =
    Math.max(getTerrainHeight(endAx, endAz), getTerrainHeight(endBx, endBz)) + 0.05;

  const wood = [];
  const darkWood = [];

  // Arched plank deck.
  const planks = 10;
  const step = L / planks;
  for (let i = 0; i < planks; i++) {
    const x = -half + (i + 0.5) * step;
    const g = new THREE.BoxGeometry(step * 1.06, 0.08, BRIDGE_WIDTH);
    g.translate(x, arch(x) + 0.04, 0);
    wood.push(g);
  }

  // Two side beams following the arch, posts, and handrails.
  for (const side of [-1, 1]) {
    const z = (side * BRIDGE_WIDTH) / 2;
    for (let i = 0; i < planks; i++) {
      const x = -half + (i + 0.5) * step;
      const beam = new THREE.BoxGeometry(step * 1.06, 0.12, 0.12);
      beam.translate(x, arch(x), z);
      darkWood.push(beam);
    }
    for (const px of [-half * 0.82, -half * 0.28, half * 0.28, half * 0.82]) {
      const post = new THREE.BoxGeometry(0.1, 0.62, 0.1);
      post.translate(px, arch(px) + 0.31, z);
      darkWood.push(post);
      const rail = new THREE.BoxGeometry(0.52, 0.07, 0.07);
      rail.translate(px, arch(px) + 0.6, z);
      wood.push(rail);
    }
  }

  const group = new THREE.Group();
  const deck = new THREE.Mesh(
    mergeGeometries(wood, false),
    new THREE.MeshStandardMaterial({ color: BRIDGE_WOOD, roughness: 0.85, flatShading: true }),
  );
  deck.castShadow = true;
  deck.receiveShadow = true;
  const frame = new THREE.Mesh(
    mergeGeometries(darkWood, false),
    new THREE.MeshStandardMaterial({ color: BRIDGE_WOOD_DARK, roughness: 0.85, flatShading: true }),
  );
  frame.castShadow = true;
  group.add(deck, frame);

  group.quaternion.setFromRotationMatrix(basis);
  group.position.set(node.x, baseY, node.z);
  return group;
}

/**
 * The creek + little waterfall that winds down the valley into the pool.
 * Returns the group, the animated water materials (drive uTime each frame),
 * and the mist particle system.
 */
export function createWaterways() {
  const group = new THREE.Group();
  const waterMaterials = [];

  const streamMat = createWaterMaterial({
    deep: CREEK_DEEP,
    shallow: CREEK_SHALLOW,
    opacity: CREEK_WATER_OPACITY,
  });
  waterMaterials.push(streamMat);

  // Stream segments, skipping the waterfall gap (handled separately).
  for (let i = 0; i < CREEK_NODES.length - 1; i++) {
    if (i === WATERFALL_SEGMENT) continue;
    const seg = buildStreamSegment(CREEK_NODES[i], CREEK_NODES[i + 1], streamMat);
    if (seg) group.add(seg);
  }

  const fallMat = createWaterMaterial({
    deep: CREEK_SHALLOW,
    shallow: WATERFALL_SHALLOW,
    opacity: WATERFALL_OPACITY,
  });
  waterMaterials.push(fallMat);
  const { mesh: fall, base: plungeBase } = buildWaterfallSheet(fallMat);
  group.add(fall);

  // A little foam disc where the fall meets the plunge pool.
  const foam = new THREE.Mesh(
    new THREE.CircleGeometry(WATERFALL.width * 0.7, 20),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(plungeBase.x, WATERFALL.plungeY + 0.04, plungeBase.z);
  foam.renderOrder = 2;
  group.add(foam);

  const bankStones = buildBankStones();
  if (bankStones) group.add(bankStones);

  group.add(buildBridge());

  const mist = buildMist(plungeBase);
  group.add(mist.points);

  return { group, waterMaterials, mist };
}
