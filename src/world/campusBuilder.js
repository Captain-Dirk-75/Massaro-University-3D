import * as THREE from 'three';
import { CAMPUS_AREAS } from '../content/campus.js';
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
 * Generate the campus from CAMPUS_AREAS data.
 */
export function createCampus() {
  const root = new THREE.Group();
  let waterMaterial = null;

  const gatedAreas = CAMPUS_AREAS.filter(
    (area) => area.access !== 'open' && area.build,
  );

  for (const area of CAMPUS_AREAS) {
    if (!area.build) continue;

    const builder = BUILDERS[area.build];
    if (!builder) continue;

    const result = builder(area);

    if (area.build === 'water-feature') {
      root.add(result.group);
      waterMaterial = result.waterMaterial;
    } else {
      root.add(result);
    }
  }

  return {
    root,
    areas: CAMPUS_AREAS,
    gatedAreas,
    waterMaterial,
  };
}