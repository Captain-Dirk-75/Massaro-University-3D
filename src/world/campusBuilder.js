import * as THREE from 'three';
import { getCachedCampusAreas } from '../platform/index.js';
import { buildLibrary } from './library.js';
import { buildWaterFeature } from './waterFeature.js';
import { buildPatronGarden } from './builders/patronGarden.js';
import { buildStillnessPavilion } from './builders/stillnessPavilion.js';

const BUILDERS = {
  library: buildLibrary,
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
  const campusAreas = getCachedCampusAreas();

  const gatedAreas = campusAreas.filter(
    (area) => area.access !== 'open' && area.build,
  );

  for (const area of campusAreas) {
    if (!area.build) continue;

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
  };
}