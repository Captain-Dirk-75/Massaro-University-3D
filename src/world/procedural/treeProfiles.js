/**
 * Tree archetypes — each profile shifts trunk, canopy, and branch character.
 */

export const TREE_PROFILES = [
  {
    id: 'round',
    weight: 0.32,
    trunkHeight: [2.2, 4.6],
    trunkTaper: [0.08, 0.22],
    canopyScale: [0.95, 1.15],
    layerCount: [3, 5],
    layerSpread: [0.34, 0.42],
    layerJitter: [0.28, 0.42],
    branchCount: [3, 6],
    branchLength: [0.42, 0.95],
    branchAngle: [0.35, 0.65],
    leafCount: [16, 22],
    leafSpread: [0.55, 1.25],
    hueShift: 0,
    satShift: 0,
    lightShift: 0,
  },
  {
    id: 'tall',
    weight: 0.22,
    trunkHeight: [3.2, 5.8],
    trunkTaper: [0.07, 0.16],
    canopyScale: [0.68, 0.88],
    layerCount: [2, 4],
    layerSpread: [0.42, 0.52],
    layerJitter: [0.12, 0.28],
    branchCount: [2, 4],
    branchLength: [0.35, 0.7],
    branchAngle: [0.25, 0.5],
    leafCount: [12, 18],
    leafSpread: [0.45, 0.9],
    hueShift: 0.02,
    satShift: 0.04,
    lightShift: -0.04,
  },
  {
    id: 'wide',
    weight: 0.2,
    trunkHeight: [1.8, 3.4],
    trunkTaper: [0.1, 0.26],
    canopyScale: [1.12, 1.38],
    layerCount: [4, 6],
    layerSpread: [0.28, 0.36],
    layerJitter: [0.38, 0.55],
    branchCount: [4, 7],
    branchLength: [0.55, 1.05],
    branchAngle: [0.45, 0.75],
    leafCount: [18, 26],
    leafSpread: [0.75, 1.35],
    hueShift: -0.015,
    satShift: 0.02,
    lightShift: 0.03,
  },
  {
    id: 'slender',
    weight: 0.14,
    trunkHeight: [2.8, 4.2],
    trunkTaper: [0.06, 0.14],
    canopyScale: [0.72, 0.92],
    layerCount: [3, 4],
    layerSpread: [0.38, 0.48],
    layerJitter: [0.18, 0.32],
    branchCount: [2, 5],
    branchLength: [0.38, 0.82],
    branchAngle: [0.3, 0.55],
    leafCount: [14, 20],
    leafSpread: [0.5, 1.0],
    hueShift: 0.035,
    satShift: -0.03,
    lightShift: 0.02,
  },
  {
    id: 'mature',
    weight: 0.12,
    trunkHeight: [2.6, 5.2],
    trunkTaper: [0.12, 0.28],
    canopyScale: [1.0, 1.25],
    layerCount: [3, 5],
    layerSpread: [0.32, 0.4],
    layerJitter: [0.32, 0.48],
    branchCount: [5, 8],
    branchLength: [0.5, 1.1],
    branchAngle: [0.4, 0.8],
    leafCount: [20, 28],
    leafSpread: [0.65, 1.3],
    hueShift: -0.025,
    satShift: -0.02,
    lightShift: -0.05,
  },
];

function lerpRange(range, t) {
  return range[0] + (range[1] - range[0]) * t;
}

export function pickTreeProfile(rand) {
  const roll = rand();
  let cumulative = 0;
  for (const profile of TREE_PROFILES) {
    cumulative += profile.weight;
    if (roll <= cumulative) return profile;
  }
  return TREE_PROFILES[0];
}

export function sampleRange(range, t) {
  return lerpRange(range, t);
}