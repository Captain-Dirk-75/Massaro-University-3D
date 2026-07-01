import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { seededRandom } from './procedural/random.js';
import { isInsideBuildingFootprint } from './buildingFootprints.js';
import {
  isStonePath,
  distanceToNearestPath,
  POND_CENTER,
  POND_RADIUS,
} from './campusPaths.js';
import { creekCarveAt } from './creek.js';

export { isStonePath } from './campusPaths.js';

const GROUND_SIZE = 130;
const SEGMENTS = 128;

// ── Valley / mountain-sanctuary knobs ──
// The campus sits on a calm valley floor (flat near 0); gentle green hills rise
// around it to cradle the sanctuary. Keep slopes soft and walkable.
export const VALLEY_CENTER = { x: 0, z: -17 };
export const BASIN_RADIUS = 36; // flat valley floor out to here (holds all buildings)
export const HILL_RADIUS = 60; // hills reach near-full height by here
export const HILL_HEIGHT = 10; // valley-wall height (the creek springs from these)
export const RIM_RISE = 4.5; // extra backdrop rise past the ring
export const SOUTH_OPENING = 0.5; // how much the southern wall opens toward the approach

// ── Rolling / surface knobs ──
export const HEIGHT_SCALE = 0.03;
export const BASIN_ROLL = 0.13; // gentle undulation on the valley floor (well under the stair threshold)
export const HILL_ROLL = 0.5; // rolling relief that grows onto the hillsides (kept gentle)

// ── Building pad knobs ──
export const PAD_HEIGHT = 0; // buildings sit on level pads at the valley floor
export const PAD_APRON = 4.5; // blend distance from pad edge into the slope

// ── Pond knobs ──
export const POND_DEPTH = 0.55; // the natural pond sits in a shallow bowl

// ── Colour knobs ──
export const GRASS_BASE = new THREE.Color(0x5a8a52);
export const GRASS_VARIATION = 0.12;
export const MEADOW_LIGHT = new THREE.Color(0x6a9a5a);
export const MEADOW_STRENGTH = 0.22;
export const HILL_TINT = new THREE.Color(0x4f7d4a); // slightly deeper green up high
export const STONE_LIGHT = new THREE.Color(0xc4b8a8);
export const STONE_DARK = new THREE.Color(0xa89880);
export const CREEK_EARTH = new THREE.Color(0x6f5f4a); // damp bank/bed earth
export const PATH_EDGE_BLEND = 0.55;

const noise2D = createNoise2D(() => seededRandom(90210)());

// Pads flatten the terrain under building footprints. Registered at bootstrap
// once the campus (and its unified building footprints) is known.
let terrainPads = [];
export function setTerrainPads(zones) {
  terrainPads = zones ?? [];
}

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function noise2(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(a, b, ux),
    THREE.MathUtils.lerp(c, d, ux),
    uy,
  );
}

/** Large-scale valley bowl: flat floor cradled by uneven green hills. */
function valleyBase(x, z) {
  const dx = x - VALLEY_CENTER.x;
  const dz = z - VALLEY_CENTER.z;
  const d = Math.hypot(dx, dz);

  const ringT = smoothstep(BASIN_RADIUS, HILL_RADIUS, d);
  // Uneven cradle — some shoulders higher, some saddles lower.
  const prof = 0.78 + 0.34 * (noise2D(x * 0.016 + 11, z * 0.016 - 7) * 0.5 + 0.5);

  // Open the valley toward the southern approach so it doesn't feel sealed.
  const dirZ = d > 1e-3 ? dz / d : 0;
  const dirXabs = d > 1e-3 ? Math.abs(dx) / d : 0;
  const open = 1 - SOUTH_OPENING * smoothstep(0.15, 0.95, dirZ) * (1 - dirXabs * 0.6);

  let h = HILL_HEIGHT * ringT * prof * open;
  h += RIM_RISE * smoothstep(HILL_RADIUS, 92, d) * open;
  return { h, ringT };
}

function rollingRelief(x, z, ringT, damp) {
  const n =
    noise2D(x * HEIGHT_SCALE, z * HEIGHT_SCALE) * 0.6 +
    noise2D(x * HEIGHT_SCALE * 2.3 + 40, z * HEIGHT_SCALE * 2.3 + 40) * 0.28 +
    noise2D(x * HEIGHT_SCALE * 0.5 - 20, z * HEIGHT_SCALE * 0.5 + 80) * 0.12;
  const amp = (BASIN_ROLL + ringT * HILL_ROLL) * damp;
  return n * amp;
}

// A shallow natural bowl under the pond so the water reads as sunken, not a
// plane sitting on the flat. Applied after pads so it wins inside the pond.
function pondBasin(x, z) {
  const d = Math.hypot(x - POND_CENTER.x, z - POND_CENTER.z);
  if (d >= POND_RADIUS) return { weight: 0, floor: 0 };
  const t = d / POND_RADIUS;
  return {
    weight: 1 - smoothstep(0.8, 1.0, t),
    floor: -POND_DEPTH * (1 - t * t),
  };
}

function padBlend(x, z) {
  let blend = 0;
  for (const zone of terrainPads) {
    const ox = Math.max(0, zone.minX - x, x - zone.maxX);
    const oz = Math.max(0, zone.minZ - z, z - zone.maxZ);
    const outside = Math.hypot(ox, oz);
    const b = outside <= 0 ? 1 : 1 - smoothstep(0, PAD_APRON, outside);
    if (b > blend) blend = b;
    if (blend >= 1) break;
  }
  return blend;
}

/**
 * Canonical terrain height. Everything in the world sits on this — the ground
 * mesh, buildings' pads, paths, planting, props, water, and the player's floor.
 */
export function getTerrainHeight(x, z) {
  const { h: baseH, ringT } = valleyBase(x, z);
  let h = baseH;

  const carve = creekCarveAt(x, z);
  // Damp fine relief near the creek so the channel reads clean.
  const damp = 1 - 0.85 * carve.influence;
  h += rollingRelief(x, z, ringT, damp);

  // Stone paths ease gently below the surrounding grade.
  if (isStonePath(x, z)) h *= 0.5;

  // Carve the creek channel.
  if (carve.influence > 0) {
    h = h * (1 - carve.influence) + carve.bottom * carve.influence;
  }

  // Flatten onto building pads (wins over everything so buildings stay level).
  const pb = padBlend(x, z);
  if (pb > 0) h = h * (1 - pb) + PAD_HEIGHT * pb;

  // Sink the pond bowl (overrides the pad so the pond stays natural).
  const pond = pondBasin(x, z);
  if (pond.weight > 0) h = h * (1 - pond.weight) + pond.floor * pond.weight;

  return h;
}

// Back-compat alias — existing modules import `sampleGroundHeight`.
export const sampleGroundHeight = getTerrainHeight;

function vertexColorAt(wx, wz) {
  const n = noise2(wx * 0.12, wz * 0.12);
  const n2 = noise2(wx * 0.35 + 40, wz * 0.35 + 40);
  const meadow = noise2(wx * 0.08 - 30, wz * 0.08 + 20);

  if (isStonePath(wx, wz)) {
    const blend = n * 0.5 + n2 * 0.3;
    return STONE_DARK.clone().lerp(STONE_LIGHT, blend);
  }

  const pathDist = distanceToNearestPath(wx, wz);
  const nearPath = pathDist < 2.2;
  const pathBlend = nearPath ? (1 - pathDist / 2.2) * PATH_EDGE_BLEND : 0;

  const color = GRASS_BASE.clone();
  const variation = (n - 0.5) * GRASS_VARIATION + (n2 - 0.5) * 0.06;
  color.offsetHSL(variation * 0.15, variation * 0.2, variation * 0.35);

  if (meadow > 0.58 && !nearPath) {
    color.lerp(MEADOW_LIGHT, MEADOW_STRENGTH * (meadow - 0.58) * 2.2);
  }

  // Deepen the green as the hills rise for a lush, cradled feel.
  const { h } = valleyBase(wx, wz);
  if (h > 0.6) {
    color.lerp(HILL_TINT, THREE.MathUtils.clamp((h - 0.6) / 9, 0, 0.55));
  }

  // Damp earthy bank along the creek.
  const carve = creekCarveAt(wx, wz);
  if (carve.influence > 0.05) {
    color.lerp(CREEK_EARTH, carve.influence * 0.5);
  }

  if (pathBlend > 0) {
    const edgeStone = STONE_DARK.clone().lerp(STONE_LIGHT, 0.35);
    color.lerp(edgeStone, pathBlend * 0.35);
  }

  return color;
}

export function createGround({ interiorZones = [] } = {}) {
  const geometry = new THREE.PlaneGeometry(
    GROUND_SIZE,
    GROUND_SIZE,
    SEGMENTS,
    SEGMENTS,
  );
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const interiorStone = STONE_DARK.clone().lerp(STONE_LIGHT, 0.42);

  for (let i = 0; i < positions.count; i++) {
    const wx = positions.getX(i);
    const wz = positions.getZ(i);

    positions.setY(i, getTerrainHeight(wx, wz));

    let color;
    if (isInsideBuildingFootprint(wx, wz, interiorZones)) {
      color = interiorStone;
    } else {
      color = vertexColorAt(wx, wz);
    }
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.9,
    metalness: 0.0,
    flatShading: false,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.receiveShadow = true;

  return ground;
}
