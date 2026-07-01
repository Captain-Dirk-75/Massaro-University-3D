import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { seededRandom, hashSeed } from './procedural/random.js';
import { getTerrainHeight } from './ground.js';

// ── Mood knobs ──
export const POOL_DEEP_COLOR = new THREE.Color(0x2a4a58);
export const POOL_SHALLOW_COLOR = new THREE.Color(0x4a7a8a);
export const POOL_SUN_REFLECT = new THREE.Color(0xffd8a8);
export const RIPPLE_SPEED = 0.85;
export const RIPPLE_HEIGHT = 0.035;

// ── Natural pond knobs ──
export const POND_BASE_RADIUS = 4.9; // average radius of the organic outline
export const POND_ELONGATION = 1.05; // stretch along z (footprint is deeper)
export const POND_SURFACE_Y = -0.04; // water surface, just below the shore
export const POND_SHORE_STONES = 16;
export const POND_REED_CLUSTERS = 9;
export const POND_LILY_PADS = 4;
export const SHORE_STONE_COLOR = 0x9a9088;
export const REED_COLOR = new THREE.Color(0x6f8a48);
export const LILY_COLOR = new THREE.Color(0x3f6a44);

const waterVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float wave = sin(pos.x * 1.1 + uTime * 1.3) * 0.5
               + sin(pos.y * 0.9 + uTime * 0.95) * 0.4
               + sin((pos.x + pos.y) * 0.7 + uTime * 0.6) * 0.3;
    pos.z += wave * ${RIPPLE_HEIGHT.toFixed(4)};
    vWave = wave;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const waterFragmentShader = /* glsl */ `
  uniform vec3 uDeepColor;
  uniform vec3 uShallowColor;
  uniform vec3 uSunColor;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    float fresnel = pow(1.0 - abs(vWave) * 0.6, 2.0);
    vec3 waterColor = mix(uDeepColor, uShallowColor, fresnel * 0.6 + 0.2);

    float shimmer = sin(vUv.x * 40.0 + uTime * 2.0) * sin(vUv.y * 35.0 + uTime * 1.5);
    waterColor += uSunColor * shimmer * 0.04;

    gl_FragColor = vec4(waterColor, uOpacity);
  }
`;

/** Organic pond outline radius at angle a (local units). */
function pondRadius(a) {
  return (
    POND_BASE_RADIUS *
    (1 + 0.1 * Math.sin(a * 3 + 0.7) + 0.05 * Math.sin(a * 5 + 2) + 0.03 * Math.sin(a * 7))
  );
}

/** Wobbly water surface that reads as a natural pond, not a rectangular pool. */
function buildPondSurface(material) {
  const shape = new THREE.Shape();
  const steps = 48;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const r = pondRadius(a);
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * POND_ELONGATION;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const geo = new THREE.ShapeGeometry(shape, 20);
  const water = new THREE.Mesh(geo, material);
  water.rotation.x = -Math.PI / 2; // lay flat; shader keeps a vertical ripple
  water.position.y = POND_SURFACE_Y;
  water.renderOrder = 1;
  return water;
}

function displaceStone(geo, seed) {
  const rand = seededRandom(seed);
  const pos = geo.attributes.position;
  for (let v = 0; v < pos.count; v++) {
    pos.setXYZ(
      v,
      pos.getX(v) * (0.8 + rand() * 0.5),
      pos.getY(v) * (0.55 + rand() * 0.4),
      pos.getZ(v) * (0.8 + rand() * 0.5),
    );
  }
  geo.computeVertexNormals();
  return geo;
}

/** Scattered shoreline boulders + one mossy focal stone, merged. */
function buildShoreStones(areaPos) {
  const rand = seededRandom(4242);
  const geometries = [];

  for (let i = 0; i < POND_SHORE_STONES; i++) {
    const a = rand() * Math.PI * 2;
    const r = pondRadius(a) * (0.96 + rand() * 0.16);
    const lx = Math.cos(a) * r;
    const lz = Math.sin(a) * r * POND_ELONGATION;
    const scale = 0.28 + rand() * 0.4;
    const y = getTerrainHeight(areaPos.x + lx, areaPos.z + lz) - areaPos.y + scale * 0.2;
    const geo = displaceStone(new THREE.IcosahedronGeometry(scale, 0), hashSeed(lx, lz));
    geo.translate(lx, y, lz);
    geometries.push(geo);
  }

  // One larger mossy boulder as a natural focal point (replaces the fountain).
  const bx = pondRadius(0.6) * 0.5;
  const bz = pondRadius(0.6) * 0.5 * POND_ELONGATION;
  const by = getTerrainHeight(areaPos.x + bx, areaPos.z + bz) - areaPos.y + 0.2;
  const boulder = displaceStone(new THREE.IcosahedronGeometry(0.85, 0), 99);
  boulder.translate(bx, by, bz);
  geometries.push(boulder);

  const mesh = new THREE.Mesh(
    mergeGeometries(geometries, false),
    new THREE.MeshStandardMaterial({
      color: SHORE_STONE_COLOR,
      roughness: 0.95,
      flatShading: true,
    }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Reed tufts around the water's edge. */
function buildReeds(areaPos) {
  const rand = seededRandom(707);
  const blades = [];
  const bladeGeo = new THREE.CylinderGeometry(0.012, 0.03, 1, 4);
  bladeGeo.translate(0, 0.5, 0);

  for (let c = 0; c < POND_REED_CLUSTERS; c++) {
    const a = rand() * Math.PI * 2;
    const r = pondRadius(a) * (0.98 + rand() * 0.1);
    const cx = Math.cos(a) * r;
    const cz = Math.sin(a) * r * POND_ELONGATION;
    const cy = getTerrainHeight(areaPos.x + cx, areaPos.z + cz) - areaPos.y;
    const count = 4 + Math.floor(rand() * 4);
    for (let b = 0; b < count; b++) {
      const h = 0.5 + rand() * 0.7;
      const g = bladeGeo.clone();
      const m = new THREE.Matrix4();
      const lean = (rand() - 0.5) * 0.5;
      m.makeRotationZ(lean);
      m.setPosition(cx + (rand() - 0.5) * 0.5, cy, cz + (rand() - 0.5) * 0.5);
      g.scale(1, h, 1);
      g.applyMatrix4(m);
      blades.push(g);
    }
  }

  const mesh = new THREE.Mesh(
    mergeGeometries(blades, false),
    new THREE.MeshStandardMaterial({
      color: REED_COLOR,
      roughness: 0.9,
      flatShading: true,
      side: THREE.DoubleSide,
    }),
  );
  mesh.castShadow = true;
  return mesh;
}

/** A few lily pads floating on the surface. */
function buildLilyPads() {
  const rand = seededRandom(313);
  const geometries = [];
  for (let i = 0; i < POND_LILY_PADS; i++) {
    const a = rand() * Math.PI * 2;
    const r = pondRadius(a) * (0.3 + rand() * 0.45);
    const pad = new THREE.CircleGeometry(0.28 + rand() * 0.22, 10);
    pad.rotateX(-Math.PI / 2);
    // small notch not modelled; keep it a simple disc for the low-poly look
    pad.translate(Math.cos(a) * r, POND_SURFACE_Y + 0.02, Math.sin(a) * r * POND_ELONGATION);
    geometries.push(pad);
  }
  const mesh = new THREE.Mesh(
    mergeGeometries(geometries, false),
    new THREE.MeshStandardMaterial({
      color: LILY_COLOR,
      roughness: 0.85,
      side: THREE.DoubleSide,
    }),
  );
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * Shared animated-water material — reused by the pool, the creek, and the
 * waterfall so all water reads cohesively. Drive `uniforms.uTime` each frame.
 */
export function createWaterMaterial({
  deep = POOL_DEEP_COLOR,
  shallow = POOL_SHALLOW_COLOR,
  sun = POOL_SUN_REFLECT,
  opacity = 0.88,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeepColor: { value: deep },
      uShallowColor: { value: shallow },
      uSunColor: { value: sun },
      uOpacity: { value: opacity },
    },
    vertexShader: waterVertexShader,
    fragmentShader: waterFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

export function buildWaterFeature(area) {
  const feature = new THREE.Group();
  feature.position.set(area.position.x, area.position.y, area.position.z);
  feature.userData.campusAreaId = area.id;

  const waterMaterial = createWaterMaterial({ opacity: 0.9 });

  feature.add(buildPondSurface(waterMaterial));
  feature.add(buildShoreStones(area.position));
  feature.add(buildReeds(area.position));
  feature.add(buildLilyPads());

  return { group: feature, waterMaterial };
}