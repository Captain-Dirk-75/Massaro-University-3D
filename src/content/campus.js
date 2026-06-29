/**
 * ── CAMPUS DEFINITION (local mode seed data) ──
 * Consumed only by src/platform/adapters/local.js — the rest of the app
 * reads campus data via src/platform/.
 * Add a new building by appending one entry to CAMPUS_AREAS below.
 *
 * access: 'open' | { requiresTier: 'member' | 'patron' } | { requiresItem: '<catalogItemId>' }
 * build: template id that generates geometry (null = metadata only, no mesh)
 * entrance: which side players approach from (barrier is placed here when locked)
 */

export const CAMPUS_AREAS = [
  {
    id: 'central-quad',
    name: 'Central Quad',
    type: 'garden',
    position: { x: 0, y: 0, z: 4 },
    footprint: { width: 36, depth: 32 },
    access: 'open',
    build: null,
  },
  {
    id: 'library',
    name: 'Library',
    type: 'library',
    position: { x: 0, y: 0, z: -48 },
    footprint: { width: 32, depth: 14 },
    access: 'open',
    build: 'unified-library',
    entrance: 'south',
  },
  {
    id: 'reflecting-pool',
    name: 'Reflecting Pool',
    type: 'garden',
    position: { x: 0, y: 0, z: -18 },
    footprint: { width: 12, depth: 16 },
    access: 'open',
    build: 'water-feature',
    entrance: 'south',
  },
  {
    id: 'patron-garden',
    name: 'Patron Garden',
    type: 'garden',
    position: { x: -24, y: 0, z: -8 },
    footprint: { width: 14, depth: 12 },
    access: { requiresTier: 'patron' },
    lockedMessage: 'The Patron Garden opens to Patron members.',
    build: 'patron-garden',
    entrance: 'east',
  },
  {
    id: 'glass-pavilion',
    name: 'Glass Pavilion',
    type: 'pavilion',
    position: { x: 20, y: 0, z: 12 },
    footprint: { width: 12, depth: 9 },
    access: 'open',
    build: 'unified-pavilion',
    entrance: 'south',
  },
  {
    id: 'stillness-pavilion',
    name: 'Stillness Pavilion',
    type: 'lounge',
    position: { x: 22, y: 0, z: -6 },
    footprint: { width: 10, depth: 9 },
    access: { requiresItem: 'course-stillness' },
    lockedMessage:
      'The Stillness Pavilion opens to those who hold Foundations of Stillness.',
    build: 'stillness-pavilion',
    entrance: 'west',
  },
];

export function getCampusAreaById(id) {
  return CAMPUS_AREAS.find((area) => area.id === id) ?? null;
}