import * as THREE from 'three';
import { getCachedCampusAreas } from '../platform/index.js';
import { buildWaterFeature } from './waterFeature.js';
import { buildPatronGarden } from './builders/patronGarden.js';
import { buildStillnessPavilion } from './builders/stillnessPavilion.js';
import {
  createBuilding,
  createCompoundBuilding,
  createPavilionOpts,
  createLibraryOpts,
} from './buildings/index.js';

const BUILDERS = {
  'water-feature': buildWaterFeature,
  'patron-garden': buildPatronGarden,
  'stillness-pavilion': buildStillnessPavilion,
};

/**
 * Generate the campus from platform campus-area data.
 */
export function createCampus() {
  const root = new THREE.Group();
  let waterMaterial = null;
  const unifiedBuildings = [];
  const campusAreas = getCachedCampusAreas();

  const gatedAreas = campusAreas.filter(
    (area) => area.access !== 'open' && area.build,
  );

  for (const area of campusAreas) {
    if (!area.build) continue;

    if (area.build === 'unified-pavilion') {
      const building = createBuilding(createPavilionOpts(area));
      root.add(building.group);
      unifiedBuildings.push(building);
      continue;
    }

    if (area.build === 'unified-library') {
      const building = createCompoundBuilding(createLibraryOpts(area));
      root.add(building.group);
      unifiedBuildings.push(building);
      continue;
    }

    const builder = BUILDERS[area.build];
    if (!builder) continue;

    const result = builder(area);

    if (area.build === 'water-feature') {
      root.add(result.group);
      waterMaterial = result.waterMaterial;
    } else {
      root.add(result.group ?? result);
    }
  }

  return {
    root,
    areas: campusAreas,
    gatedAreas,
    waterMaterial,
    unifiedBuildings,
  };
}