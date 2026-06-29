/**
 * Collegiate Gothic library — interior layout config.
 * Tunable layout, aesthetic, gated-section rules, and classical facade.
 *
 * Campus position lives in src/content/campus.js (library entry) — keep in sync:
 *   { x: 0, y: 0, z: -48 }
 */

// ── Campus placement (mirror of campus.js — update both together) ──
export const LIBRARY_CAMPUS_POSITION = { x: 0, y: 0, z: -48 };

// ── Building shell (exterior facade/windows use these) ──
export const LIBRARY_WIDTH = 32;
export const LIBRARY_DEPTH = 14;
export const LIBRARY_STORY_HEIGHT = 4.0;
export const LIBRARY_FLOOR_COUNT = 2;
export const LIBRARY_WALL_THICKNESS = 0.35;
export const LIBRARY_FLOOR_HEIGHT = 0.14;

// ── Interior layout (tunable) ──
export const LIBRARY_HALL_VOID = { minX: -9.5, maxX: 9.5, minZ: -0.5, maxZ: 7 };
export const LIBRARY_READING_DIVIDER_X = 6.5;
export const LIBRARY_HALL_NORTH_Z = -0.5;

export const LIBRARY_RECEPTION = { x: -9, z: 5.5, floor: 0 };

export const LIBRARY_SPLIT_STAIRS = {
  landingY: 2.0,
  topFloor: 1,
  main: { minX: -1.8, maxX: 1.8, minZ: -0.5, maxZ: 4.8 },
  left: { minX: -5.5, maxX: -1.8, minZ: -4.2, maxZ: -0.5 },
  right: { minX: 1.8, maxX: 5.5, minZ: -4.2, maxZ: -0.5 },
};

export const LIBRARY_CHANDELIER = {
  x: 0,
  z: 2.5,
  cordLength: 3.2,
  fromY: 'total',
};

export const LIBRARY_SIDE_LAMP_HEIGHT = 2.6;

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
  bounds: { minX: -16, maxX: -6.5, minZ: -6.5, maxZ: 2 },
  floorMin: 1,
  access: { requiresTier: 'member' },
  lockedMessage: 'The Upper Archive opens to Members and Patrons.',
  barrierAxis: 'x',
  barrierAt: -6.5,
  ejectSide: 1,
};

export function createLibraryOpts(area) {
  const divX = LIBRARY_READING_DIVIDER_X;

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
        axis: 'x',
        at: -divX,
        spanMin: -6.5,
        spanMax: 0.5,
        floors: [0],
        colliderLevel: 'all',
        openings: [{ at: -2.5, width: 2.6, height: 2.8, bottom: 0 }],
      },
      {
        axis: 'x',
        at: divX,
        spanMin: -6.5,
        spanMax: 0.5,
        floors: [0],
        colliderLevel: 'all',
        openings: [{ at: -2.5, width: 2.6, height: 2.8, bottom: 0 }],
      },
      {
        axis: 'x',
        at: -divX,
        spanMin: -6.5,
        spanMax: 2,
        floors: [1],
        colliderLevel: 'all',
        openings: [{ at: 0, width: 2.4, height: 2.6, bottom: 0 }],
      },
      {
        axis: 'x',
        at: divX,
        spanMin: -6.5,
        spanMax: 2,
        floors: [1],
        colliderLevel: 'all',
        openings: [{ at: 0, width: 2.4, height: 2.6, bottom: 0 }],
      },
    ],

    splitStairs: LIBRARY_SPLIT_STAIRS,

    floorHoles: [
      { floor: 1, ...LIBRARY_HALL_VOID },
    ],

    ceilingHoles: [
      { floor: 0, ...LIBRARY_HALL_VOID },
    ],

    galleryRailings: [
      { minX: -9.5, maxX: 9.5, minZ: -0.5, maxZ: -0.35 },
      { minX: -9.35, maxX: -9.15, minZ: -0.5, maxZ: 5.5 },
      { minX: 9.15, maxX: 9.35, minZ: -0.5, maxZ: 5.5 },
    ],

    gates: [LIBRARY_GATED_SECTION],

    rooms: [
      {
        id: 'grand-hall',
        floor: 0,
        x: 0,
        z: 3,
        width: 20,
        depth: 12,
        lightStyle: 'chandelier',
        chandelier: LIBRARY_CHANDELIER,
      },
      {
        id: 'west-reading',
        floor: 0,
        x: -11,
        z: -3.5,
        width: 9,
        depth: 6,
        lightStyle: 'sconce',
        sconceHeight: LIBRARY_SIDE_LAMP_HEIGHT,
      },
      {
        id: 'east-reading',
        floor: 0,
        x: 11,
        z: -3.5,
        width: 9,
        depth: 6,
        lightStyle: 'sconce',
        sconceHeight: LIBRARY_SIDE_LAMP_HEIGHT,
      },
      {
        id: 'gallery-west',
        floor: 1,
        x: -11,
        z: -2,
        width: 9,
        depth: 8,
        lightStyle: 'sconce',
        sconceHeight: LIBRARY_SIDE_LAMP_HEIGHT,
      },
      {
        id: 'gallery-east',
        floor: 1,
        x: 11,
        z: -2,
        width: 9,
        depth: 8,
        lightStyle: 'sconce',
        sconceHeight: LIBRARY_SIDE_LAMP_HEIGHT,
      },
      {
        id: 'upper-archive',
        floor: 1,
        x: -11,
        z: -2,
        width: 9,
        depth: 8,
        lightStyle: 'sconce',
        sconceHeight: LIBRARY_SIDE_LAMP_HEIGHT,
      },
    ],

    furniture: [
      { type: 'reception', x: LIBRARY_RECEPTION.x, z: LIBRARY_RECEPTION.z, floor: LIBRARY_RECEPTION.floor },
      { type: 'bookshelf', x: -12, z: 4.5, floor: 0 },
      { type: 'bookshelf', x: 12, z: 4.5, floor: 0 },
      { type: 'bookshelf', x: -12, z: 1.5, floor: 0 },
      { type: 'bookshelf', x: 12, z: 1.5, floor: 0 },
      { type: 'table', x: -11, z: -2, floor: 0 },
      { type: 'chair', x: -12, z: -1.2, floor: 0 },
      { type: 'table', x: 11, z: -2, floor: 0 },
      { type: 'chair', x: 12, z: -1.2, floor: 0 },
      { type: 'table', x: 3, z: 3.5, floor: 0 },
      { type: 'chair', x: 4, z: 3.5, floor: 0 },
      { type: 'bookshelf', x: -12, z: 1, floor: 1 },
      { type: 'bookshelf', x: 12, z: 1, floor: 1 },
      { type: 'table', x: 11, z: -1, floor: 1 },
      { type: 'bookshelf', x: -14, z: -3, floor: 1 },
    ],
  };
}