/**
 * Glass Pavilion — Stage 1 unified-world sandbox building.
 */
export function createPavilionOpts(area) {
  return {
    id: area.id,
    position: area.position,
    width: 12,
    depth: 9,
    height: 4.2,
    wallThickness: 0.32,
    floorHeight: 0.14,
    door: {
      wall: 'south',
      width: 2.5,
      height: 2.75,
      offset: 0,
      bottom: 0,
    },
    windows: [
      { wall: 'south', width: 2.0, height: 1.55, offset: -3.6, sill: 1.05 },
      { wall: 'south', width: 2.0, height: 1.55, offset: 3.6, sill: 1.05 },
      { wall: 'north', width: 2.4, height: 1.65, offset: 0, sill: 1.05 },
      { wall: 'east', width: 1.9, height: 1.5, offset: 0, sill: 1.05 },
      { wall: 'west', width: 1.9, height: 1.5, offset: 0, sill: 1.05 },
    ],
    furniture: [
      { type: 'table', x: 0, z: -1.2 },
      { type: 'chair', x: -1.1, z: -0.6 },
      { type: 'chair', x: 1.1, z: -0.6 },
      { type: 'bookshelf', x: -3.8, z: -2.2 },
    ],
  };
}