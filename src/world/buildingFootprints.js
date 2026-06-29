/** Margin around each building footprint where scatter is skipped. */
export const BUILDING_EXCLUSION_MARGIN = 1.0;

/**
 * Build XZ exclusion rectangles for procedural scatter (trees, bushes, rocks).
 * Uses campus area footprints plus unified createBuilding() results.
 */
export function getBuildingExclusionZones({ areas = [], unifiedBuildings = [] } = {}) {
  const margin = BUILDING_EXCLUSION_MARGIN;
  const zones = [];

  for (const area of areas) {
    if (!area.build || !area.footprint) continue;
    const hw = area.footprint.width / 2 + margin;
    const hd = area.footprint.depth / 2 + margin;
    zones.push({
      minX: area.position.x - hw,
      maxX: area.position.x + hw,
      minZ: area.position.z - hd,
      maxZ: area.position.z + hd,
    });
  }

  for (const building of unifiedBuildings) {
    const { halfW, halfD, position } = building.footprint;
    zones.push({
      minX: position.x - halfW - margin,
      maxX: position.x + halfW + margin,
      minZ: position.z - halfD - margin,
      maxZ: position.z + halfD + margin,
    });
  }

  return zones;
}

export function isInsideBuildingFootprint(wx, wz, zones) {
  if (!zones?.length) return false;
  return zones.some(
    (zone) =>
      wx >= zone.minX &&
      wx <= zone.maxX &&
      wz >= zone.minZ &&
      wz <= zone.maxZ,
  );
}