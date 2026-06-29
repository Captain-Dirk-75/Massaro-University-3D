/**
 * Collegiate Gothic library — Stage 2a structure config.
 * Tunable layout, aesthetic, gated-section rules, and classical facade.
 *
 * Campus position lives in src/content/campus.js (library entry) — keep in sync:
 *   { x: 0, y: 0, z: -48 }
 */

// ── Campus placement (mirror of campus.js — update both together) ──
export const LIBRARY_CAMPUS_POSITION = { x: 0, y: 0, z: -48 };

// ── Building shell ──
export const LIBRARY_WIDTH = 32;
export const LIBRARY_DEPTH = 14;
export const LIBRARY_STORY_HEIGHT = 4.0;
export const LIBRARY_FLOOR_COUNT = 2;
export const LIBRARY_WALL_THICKNESS = 0.35;
export const LIBRARY_FLOOR_HEIGHT = 0.14;

// ── Collegiate Gothic palette (dark timber, stone, warm glow) ──
export const LIBRARY_PALETTE = {
  shell: 0xd8d0c4,
  facadeStone: 0xe0d6c8,
  facadeDark: 0xb8a898,
  liner: 0x5a4838,
  floor: 0x4a3828,
  timber: 0x3a2c20,
  ceiling: 0x342a22,
  emissive: 0xffe8c8,
  emissiveIntensity: 0.14,
  roof: 0x6a5a4a,
};

// ── Classical entrance facade (see classicalFacade.js) ──
export const LIBRARY_FACADE = {
  wall: 'south',
  bayWidth: 14,
  bayProjection: 0.45,
  columnCount: 4,
  columnRadius: 0.26,
  columnHeight: 6.8,
  pedimentHeight: 1.35,
  entablatureHeight: 0.48,
  stepCount: 4,
  stepDepth: 0.48,
  stepRise: 0.16,
  corniceHeight: 0.26,
  roofOverhang: 1.2,
  doorClearWidth: 4.2,
  columnGapFromDoor: 0.55,
};

// ── Ceiling beams (heavy timber, vaulted feel) ──
export const LIBRARY_CEILING_BEAMS = 4;

// ── Membership-gated section (data-driven — change access here) ──
export const LIBRARY_GATED_SECTION = {
  id: 'library-upper-archive',
  bounds: { minX: -16, maxX: 0, minZ: -7, maxZ: 7 },
  floorMin: 1,
  access: { requiresTier: 'member' },
  lockedMessage: 'The Upper Archive opens to Members and Patrons.',
  barrierAxis: 'x',
  barrierAt: 0,
  ejectSide: 1,
};

// ── Interior placement (tunable) ──
export const LIBRARY_RECEPTION = { x: -5.5, z: 3.2, floor: 0 };
export const LIBRARY_STAIRS = {
  minX: 5,
  maxX: 8.5,
  minZ: -2.5,
  maxZ: 2,
  topFloor: 1,
};

// ── Room layout (local coords, building centre = 0,0) ──
const ATRIUM_Z = 4;
const READING_SPLIT_X = 0;
const ATRIUM_DIVIDER_Z = 1;

export function createLibraryOpts(area) {
  return {
    id: area.id,
    position: area.position,
    width: LIBRARY_WIDTH,
    depth: LIBRARY_DEPTH,
    storyHeight: LIBRARY_STORY_HEIGHT,
    floorCount: LIBRARY_FLOOR_COUNT,
    wallThickness: LIBRARY_WALL_THICKNESS,
    floorHeight: LIBRARY_FLOOR_HEIGHT,
    palette: LIBRARY_PALETTE,
    ceilingBeams: LIBRARY_CEILING_BEAMS,
    facade: LIBRARY_FACADE,

    exteriorDoors: [
      {
        wall: 'south',
        width: 3.6,
        height: 3.4,
        offset: 0,
        bottom: 0,
      },
    ],

    exteriorWindows: [
      { wall: 'south', width: 2.0, height: 5.2, offset: -8.5, sill: 0.9, arched: true },
      { wall: 'south', width: 2.0, height: 5.2, offset: 8.5, sill: 0.9, arched: true },
      { wall: 'north', width: 2.2, height: 5.8, offset: -9, sill: 0.8, arched: true },
      { wall: 'north', width: 2.2, height: 5.8, offset: 0, sill: 0.8, arched: true },
      { wall: 'north', width: 2.2, height: 5.8, offset: 9, sill: 0.8, arched: true },
      { wall: 'east', width: 1.8, height: 4.8, offset: -2, sill: 1.0, arched: true },
      { wall: 'east', width: 1.8, height: 4.8, offset: 3, sill: 1.0, arched: true },
      { wall: 'west', width: 1.8, height: 4.8, offset: -2, sill: 1.0, arched: true },
      { wall: 'west', width: 1.8, height: 4.8, offset: 3, sill: 1.0, arched: true },
    ],

    partitions: [
      {
        axis: 'z',
        at: ATRIUM_DIVIDER_Z,
        spanMin: -16,
        spanMax: 16,
        floors: [0],
        colliderLevel: 'all',
        openings: [{ at: 0, width: 3.4, height: 3.0, bottom: 0 }],
      },
      {
        axis: 'x',
        at: READING_SPLIT_X,
        spanMin: -7,
        spanMax: ATRIUM_DIVIDER_Z,
        floors: [0],
        colliderLevel: 'all',
        openings: [{ at: -3, width: 2.6, height: 2.8, bottom: 0 }],
      },
      {
        axis: 'x',
        at: READING_SPLIT_X,
        spanMin: -7,
        spanMax: 7,
        floors: [1],
        colliderLevel: 'all',
        openings: [{ at: 0, width: 2.4, height: 2.6, bottom: 0 }],
      },
    ],

    stairs: LIBRARY_STAIRS,

    floorHoles: [],

    gates: [LIBRARY_GATED_SECTION],

    rooms: [
      { id: 'atrium', floor: 0, x: 0, z: ATRIUM_Z, width: 30, depth: 6, lightCount: 2 },
      { id: 'west-reading', floor: 0, x: -8, z: -3, width: 14, depth: 8, lightCount: 2 },
      { id: 'east-reading', floor: 0, x: 8, z: -3, width: 14, depth: 8, lightCount: 2 },
      { id: 'upper-gallery', floor: 1, x: 8, z: 0, width: 14, depth: 12, lightCount: 2 },
      { id: 'upper-archive', floor: 1, x: -8, z: 0, width: 14, depth: 12, lightCount: 2 },
    ],

    furniture: [
      { type: 'reception', x: LIBRARY_RECEPTION.x, z: LIBRARY_RECEPTION.z, floor: LIBRARY_RECEPTION.floor },
      { type: 'table', x: -8, z: -2, floor: 0 },
      { type: 'chair', x: -9, z: -1.2, floor: 0 },
      { type: 'bookshelf', x: -14, z: -4, floor: 0 },
      { type: 'table', x: 8, z: -2, floor: 0 },
      { type: 'bookshelf', x: 14, z: -4, floor: 0 },
      { type: 'table', x: 8, z: 2, floor: 1 },
      { type: 'bookshelf', x: -12, z: 3, floor: 1 },
    ],
  };
}