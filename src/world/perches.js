/**
 * World-space perch points for birds (roofs, tree crowns, structures).
 */
export function getCampusPerches() {
  return [
    { x: 0, y: 12.2, z: -48, label: 'library-roof' },
    { x: -14, y: 10.8, z: -48, label: 'library-wing-l' },
    { x: 14, y: 10.8, z: -48, label: 'library-wing-r' },
    { x: 22, y: 4.2, z: -6, label: 'stillness-pavilion' },
    { x: -24, y: 3.5, z: -8, label: 'patron-garden' },
    { x: 6, y: 2.8, z: 2, label: 'sanctuary-kiosk' },
    { x: -6, y: 2.6, z: 6, label: 'sage-grove' },
    { x: 0, y: 1.2, z: -18, label: 'pool-rim' },
  ];
}