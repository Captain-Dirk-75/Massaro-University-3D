/**
 * ── INTERIOR DEFINITIONS (local mode seed data) ──
 * Consumed only by src/platform/adapters/local.js.
 *
 * TODO: Remove the scene-swap system (src/world/interiors/) once nothing
 * references it. The library now uses unified-world createCompoundBuilding().
 * This list is intentionally empty — interiorManager remains for future use.
 */

export const INTERIORS = [];

export function getInteriorByBuildingId(buildingId) {
  return INTERIORS.find((interior) => interior.buildingId === buildingId) ?? null;
}

export function getInteriorById(id) {
  return INTERIORS.find((interior) => interior.id === id) ?? null;
}