/**
 * ── INTERIOR DEFINITIONS (local mode seed data) ──
 * Consumed only by src/platform/adapters/local.js.
 * Link a building via buildingId (matches campus area id).
 *
 * entrance  — outdoor trigger (world XZ, campus coordinates)
 * exit      — indoor trigger (local XZ inside the interior scene)
 * spawn     — camera position on enter (interior local coords)
 * returnSpawn — camera position on exit (campus world coords)
 * room      — shell dimensions { width, depth, height }
 * build     — builder template id in src/world/interiors/builders/
 * furniture — optional counts passed to the builder
 */

export const INTERIORS = [
  {
    id: 'library-interior',
    buildingId: 'library',
    name: 'Library',
    entrance: {
      position: { x: 0, y: 0, z: -27.5 },
      radius: 5,
      label: 'Enter Library',
    },
    exit: {
      position: { x: 0, y: 0, z: 14.2 },
      radius: 4.5,
      label: 'Exit to Campus',
    },
    spawn: { x: 0, y: 1.7, z: 10, yaw: Math.PI },
    returnSpawn: { x: 0, y: 1.7, z: -27.5, yaw: 0 },
    worldOffset: { x: 0, y: 0, z: -40 },
    room: { width: 28, depth: 32, height: 8.4 },
    build: 'library',
    furniture: {
      readingDesks: 6,
      bookshelfRuns: 8,
      chairsPerDesk: 1,
    },
  },
];

export function getInteriorByBuildingId(buildingId) {
  return INTERIORS.find((interior) => interior.buildingId === buildingId) ?? null;
}

export function getInteriorById(id) {
  return INTERIORS.find((interior) => interior.id === id) ?? null;
}