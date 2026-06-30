/**
 * Warm dark-timber British collegiate library — interior layout config.
 *
 * Built entirely on the proven createCompoundBuilding wall / opening / collider /
 * split-stair / floor-Y systems (see buildingPrimitives.js + createCompoundBuilding.js).
 * This file is DATA ONLY: it never invents geometry, it describes it.
 *
 * ── Plan (local coords; +z = SOUTH = entrance, walk in heading −z) ──
 *
 *        NORTH  (z = −10, rear)
 *   ┌──────────┬───────────────────┬──────────┐
 *   │  WEST     │   north gallery   │   EAST   │   ← upper rooms reached from
 *   │  reading  │   walkway / stair │  reading │     the gallery (floor 1)
 *   │  room /   │   top lands here  │  room /  │
 *   │  archive  ├───────────────────┤  upper   │
 *   │ (gated    │                   │          │
 *   │  upstairs)│   GRAND HALL      │          │
 *   │           │   double-height   │          │
 *   │           │   void + split    │          │
 *   │           │   staircase       │          │
 *   │           │                   │          │
 *   │           │   ── open hall ── │          │
 *   │           │   reception desk  │          │
 *   └──────────┴─────[ DOOR ]──────┴──────────┘
 *        SOUTH  (z = +10, entrance)
 *
 * Campus position lives in src/content/campus.js (library entry) — keep in sync:
 *   position { x: 0, y: 0, z: -44 }, footprint { width: 32, depth: 20 }
 */

// ════════════════════════════════════════════════════════════════════════════
//  TUNABLE CONSTANTS — adjust the whole library from here
// ════════════════════════════════════════════════════════════════════════════

// ── Campus placement (mirror of campus.js — update both together) ──
export const LIBRARY_CAMPUS_POSITION = { x: 0, y: 0, z: -44 };

// ── Building shell (exterior facade / windows use these) ──
export const LIBRARY_WIDTH = 32;          // x ∈ [−16, 16]
export const LIBRARY_DEPTH = 20;          // z ∈ [−10, 10]  (deepened for a grand hall)
export const LIBRARY_STORY_HEIGHT = 4.0;  // → 8.0 m double-height hall
export const LIBRARY_FLOOR_COUNT = 2;
export const LIBRARY_WALL_THICKNESS = 0.35;
export const LIBRARY_FLOOR_HEIGHT = 0.14;

// ── Bay layout: two side bays split off a wide central hall ──
export const LIBRARY_PARTITION_X = 8;     // interior walls at x = ±8
export const LIBRARY_GROUND_DOOR_Z = -7;  // rear doorway — clear of both stair flights
export const LIBRARY_UPPER_DOOR_Z = -7;   // gallery → upper-room doorway (rear, aligned)

// ── Double-height hall void (hole in floor-0 ceiling + floor-1 deck) ──
//    Open the whole front of the hall to full height; the walkable gallery is
//    the rear (north) walkway plus the two side staircases that climb to it.
export const LIBRARY_HALL_VOID = { minX: -5.5, maxX: 5.5, minZ: -2.8, maxZ: 9.65 };

// ── TWO matching straight staircases (foyer-style) ──
//    One hugs the WEST hall wall, one the EAST, symmetric. Each is a single
//    straight flight rising from the FRONT (south, floor 0) up to the REAR
//    gallery walkway (north, floor 1). They stand clear of the partition walls
//    with open floor at the base, and use STRAIGHT-run floor handling — NOT the
//    split-stair handler.
export const LIBRARY_STAIR_WIDTH = 1.8;
export const LIBRARY_STAIR_VOID_GAP_X = 5.6; // inner (void-side) edge of each flight
export const LIBRARY_STAIR_BASE_Z = 8.0;     // south foot — stepped onto from the hall
export const LIBRARY_STAIR_TOP_Z = -2.5;     // north head — lands on the rear gallery
export const LIBRARY_STAIR_STEPS = 14;

const STAIR_OUTER_X = LIBRARY_STAIR_VOID_GAP_X + LIBRARY_STAIR_WIDTH; // 7.4 (≈0.4 m off the wall)

export const LIBRARY_SIDE_STAIRS = [
  { minX: -STAIR_OUTER_X, maxX: -LIBRARY_STAIR_VOID_GAP_X, minZ: LIBRARY_STAIR_TOP_Z, maxZ: LIBRARY_STAIR_BASE_Z, steps: LIBRARY_STAIR_STEPS },
  { minX: LIBRARY_STAIR_VOID_GAP_X, maxX: STAIR_OUTER_X, minZ: LIBRARY_STAIR_TOP_Z, maxZ: LIBRARY_STAIR_BASE_Z, steps: LIBRARY_STAIR_STEPS },
];

// Deck/ceiling holes for the stair columns run to the south wall so no isolated
// balcony patch is left above the stair feet (mesh + climb stay base→top above).
const STAIR_HOLES = [
  { minX: -STAIR_OUTER_X, maxX: -LIBRARY_STAIR_VOID_GAP_X, minZ: LIBRARY_STAIR_TOP_Z, maxZ: 9.65 },
  { minX: LIBRARY_STAIR_VOID_GAP_X, maxX: STAIR_OUTER_X, minZ: LIBRARY_STAIR_TOP_Z, maxZ: 9.65 },
];

// ── Lighting — everything hangs HIGH; the player never meets a lamp ──
//    Chandeliers drop from the 8.0 m grand ceiling (shades ~4.6 m up) and sit
//    only over the double-height void, never over the walkable rear gallery.
export const LIBRARY_CHANDELIERS = [
  { x: 0, z: 6.0, cordLength: 2.6, fromY: 'total' },
  { x: 0, z: 1.5, cordLength: 2.6, fromY: 'total' },
  { x: 0, z: -2.2, cordLength: 2.6, fromY: 'total' },
];
// Wall sconces in side rooms — 3 m up a wall, well clear of any head.
export const LIBRARY_SCONCE_HEIGHT = 3.0;

// ── Warm dark-timber collegiate palette (kept from the working build) ──
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
  serviceDesk: 0xc8a882,
};

// ── Classical entrance facade (decoration only — see classicalFacade.js) ──
export const LIBRARY_FACADE = {
  wall: 'south',
  bayWidth: 14,
  bayProjection: 0.45,
  columnCount: 4,
  columnRadius: 0.28,
  columnHeight: 7.2,
  pedimentHeight: 1.4,
  entablatureHeight: 0.5,
  stepCount: 4,
  stepDepth: 0.5,
  stepRise: 0.16,
  corniceHeight: 0.26,
  roofOverhang: 1.2,
  doorClearWidth: 4.2,
  columnGapFromDoor: 0.55,
  doorTrim: false,
  exteriorSteps: false,
  porticoDeck: false,
};

// ── Heavy timber ceiling beams (grand vaulted feel, top ceiling only) ──
export const LIBRARY_CEILING_BEAMS = 5;

// ── Service / help desk — half-round counter centred between the two staircases ──
export const LIBRARY_SERVICE_DESK_SIZE = { radius: 1.62, height: 1.26 }; // +20% over base 1.35 / 1.05
export const LIBRARY_SERVICE_DESK = { x: 0, z: 3.5, floor: 0, ...LIBRARY_SERVICE_DESK_SIZE };

// ── Membership-gated section: the upper-floor west archive ──
//    Evaluated live by sectionGates.js against the existing access system.
export const LIBRARY_GATED_SECTION = {
  id: 'library-upper-archive',
  bounds: { minX: -16, maxX: -LIBRARY_PARTITION_X, minZ: -9.65, maxZ: 9.65 },
  floorMin: 1,
  access: { requiresTier: 'member' },
  lockedMessage: 'The Upper Archive opens to Members and Patrons.',
  barrierAxis: 'x',
  barrierAt: -LIBRARY_PARTITION_X,
  ejectSide: 1, // push the player back east, into the gallery
};

// ════════════════════════════════════════════════════════════════════════════
//  ASSEMBLY — feed the tunables into the proven compound-building system
// ════════════════════════════════════════════════════════════════════════════

export function createLibraryOpts(area) {
  const px = LIBRARY_PARTITION_X;
  const halfD = LIBRARY_DEPTH / 2;
  const spanMin = -(halfD - LIBRARY_WALL_THICKNESS); // symmetric full-depth partition
  const spanMax = halfD - LIBRARY_WALL_THICKNESS;

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

    // ── Entrance: one wide, clear doorway on the south facade ──
    exteriorDoors: [
      { wall: 'south', width: 3.6, height: 3.4, offset: 0, bottom: 0 },
    ],

    // ── See-through arched windows (unchanged glass system) ──
    exteriorWindows: [
      { wall: 'south', width: 2.0, height: 5.2, offset: -9.5, sill: 0.9, arched: true },
      { wall: 'south', width: 2.0, height: 5.2, offset: 9.5, sill: 0.9, arched: true },
      { wall: 'north', width: 2.2, height: 5.8, offset: -11, sill: 0.8, arched: true },
      { wall: 'north', width: 2.2, height: 5.8, offset: 0, sill: 0.8, arched: true },
      { wall: 'north', width: 2.2, height: 5.8, offset: 11, sill: 0.8, arched: true },
      { wall: 'east', width: 1.8, height: 4.8, offset: -6, sill: 1.0, arched: true },
      { wall: 'east', width: 1.8, height: 4.8, offset: 0, sill: 1.0, arched: true },
      { wall: 'east', width: 1.8, height: 4.8, offset: 6, sill: 1.0, arched: true },
      { wall: 'west', width: 1.8, height: 4.8, offset: -6, sill: 1.0, arched: true },
      { wall: 'west', width: 1.8, height: 4.8, offset: 0, sill: 1.0, arched: true },
      { wall: 'west', width: 1.8, height: 4.8, offset: 6, sill: 1.0, arched: true },
    ],

    // ── Solid interior walls splitting the side bays off the hall ──
    //    Spans are symmetric about z=0 (full depth) so the proven builder
    //    centres them correctly; each carries one real doorway opening.
    hallVoid: LIBRARY_HALL_VOID,

    partitions: [
      { axis: 'x', at: -px, spanMin, spanMax, floors: [0], colliderLevel: 'all',
        openings: [{ at: LIBRARY_GROUND_DOOR_Z, width: 2.8, height: 3.0, bottom: 0 }] },
      { axis: 'x', at: px, spanMin, spanMax, floors: [0], colliderLevel: 'all',
        openings: [{ at: LIBRARY_GROUND_DOOR_Z, width: 2.8, height: 3.0, bottom: 0 }] },
      { axis: 'x', at: -px, spanMin, spanMax, floors: [1], colliderLevel: 'all',
        openings: [{ at: LIBRARY_UPPER_DOOR_Z, width: 2.6, height: 3.0, bottom: 0 }] },
      { axis: 'x', at: px, spanMin, spanMax, floors: [1], colliderLevel: 'all',
        openings: [{ at: LIBRARY_UPPER_DOOR_Z, width: 2.6, height: 3.0, bottom: 0 }] },
    ],

    straightStairs: LIBRARY_SIDE_STAIRS,

    // ── Open the hall vertically: cut floor-1 deck + floor-0 ceiling for the
    //    void AND the two stair columns (so the stairs rise into the open) ──
    floorHoles: [
      { floor: 1, ...LIBRARY_HALL_VOID },
      { floor: 1, ...STAIR_HOLES[0] },
      { floor: 1, ...STAIR_HOLES[1] },
    ],
    ceilingHoles: [
      { floor: 0, ...LIBRARY_HALL_VOID },
      { floor: 0, ...STAIR_HOLES[0] },
      { floor: 0, ...STAIR_HOLES[1] },
    ],

    floorPads: [
      // North gallery walkway (floor 1 deck over the void edge)
      { floor: 1, minX: -5.5, maxX: 5.5, minZ: -9.65, maxZ: -2.8 },
      // Stair top landings continuing into the gallery + side-room approach
      { floor: 1, minX: -STAIR_OUTER_X, maxX: -LIBRARY_STAIR_VOID_GAP_X, minZ: -9.65, maxZ: -2.0 },
      { floor: 1, minX: LIBRARY_STAIR_VOID_GAP_X, maxX: STAIR_OUTER_X, minZ: -9.65, maxZ: -2.0 },
    ],

    // ── Rear gallery railing along the void edge (collides on the upper level);
    //    the staircases carry their own banisters down each side ──
    galleryRailings: [
      { minX: -5.5, maxX: -2.0, minZ: -2.9, maxZ: -2.8 },
      { minX: 2.0, maxX: 5.5, minZ: -2.9, maxZ: -2.8 },
    ],

    gates: [LIBRARY_GATED_SECTION],

    // ── Lighting per room (all fixtures hang/sit well above head height) ──
    rooms: [
      {
        id: 'grand-hall', floor: 0, x: 0, z: 2, width: 11, depth: 20,
        lightStyle: 'chandelier', chandeliers: LIBRARY_CHANDELIERS,
      },
      {
        id: 'west-reading', floor: 0, x: -11.8, z: 0, width: 7.6, depth: 20,
        lightStyle: 'sconce', sconceHeight: LIBRARY_SCONCE_HEIGHT, sconceCount: 4,
      },
      {
        id: 'east-reading', floor: 0, x: 11.8, z: 0, width: 7.6, depth: 20,
        lightStyle: 'sconce', sconceHeight: LIBRARY_SCONCE_HEIGHT, sconceCount: 4,
      },
      {
        id: 'west-archive', floor: 1, x: -11.8, z: 0, width: 7.6, depth: 20,
        lightStyle: 'sconce', sconceHeight: LIBRARY_SCONCE_HEIGHT, sconceCount: 4,
      },
      {
        id: 'east-upper', floor: 1, x: 11.8, z: 0, width: 7.6, depth: 20,
        lightStyle: 'sconce', sconceHeight: LIBRARY_SCONCE_HEIGHT, sconceCount: 4,
      },
    ],

    // ── Light, sensible furnishing — nothing in doorways, stairs, or paths ──
    furniture: [
      { type: 'serviceDesk', x: LIBRARY_SERVICE_DESK.x, z: LIBRARY_SERVICE_DESK.z, floor: LIBRARY_SERVICE_DESK.floor },

      // West reading room (ground)
      { type: 'bookshelf', x: -14.6, z: -3, floor: 0 },
      { type: 'bookshelf', x: -14.6, z: 3, floor: 0 },
      { type: 'table', x: -11.8, z: 0, floor: 0 },
      { type: 'chair', x: -11.8, z: 1.0, floor: 0 },
      { type: 'chair', x: -11.8, z: -1.0, floor: 0 },

      // East reading room (ground)
      { type: 'bookshelf', x: 14.6, z: -3, floor: 0 },
      { type: 'bookshelf', x: 14.6, z: 3, floor: 0 },
      { type: 'table', x: 11.8, z: 0, floor: 0 },
      { type: 'chair', x: 11.8, z: 1.0, floor: 0 },
      { type: 'chair', x: 11.8, z: -1.0, floor: 0 },

      // Gallery: a couple of shelves along the rear walkway
      { type: 'bookshelf', x: -3, z: -9.0, floor: 1 },
      { type: 'bookshelf', x: 3, z: -9.0, floor: 1 },

      // West upper archive (gated)
      { type: 'bookshelf', x: -14.6, z: -3, floor: 1 },
      { type: 'bookshelf', x: -14.6, z: 3, floor: 1 },
      { type: 'table', x: -11.8, z: 0, floor: 1 },

      // East upper reading room
      { type: 'bookshelf', x: 14.6, z: -3, floor: 1 },
      { type: 'bookshelf', x: 14.6, z: 3, floor: 1 },
      { type: 'table', x: 11.8, z: 0, floor: 1 },
      { type: 'chair', x: 11.8, z: 1.0, floor: 1 },
    ],
  };
}
