import * as THREE from 'three';
import { addShadowed } from './buildingPrimitives.js';

// ── Default facade proportions (override per building) ──
export const DEFAULT_FACADE = {
  bayWidth: 14,
  bayProjection: 0.45,
  columnCount: 4,
  columnRadius: 0.26,
  columnHeight: 6.8,
  pedimentHeight: 1.35,
  entablatureHeight: 0.48,
  stepCount: 4,
  stepDepth: 0.48,
  stepRise: 0.16,
  corniceHeight: 0.26,
  roofOverhang: 1.2,
  doorClearWidth: 4.2,
  columnGapFromDoor: 0.55,
};

function decorMat(palette, dark = false) {
  return new THREE.MeshStandardMaterial({
    color: dark ? (palette.facadeDark ?? 0xb8a898) : (palette.facadeStone ?? palette.shell),
    roughness: 0.82,
    metalness: 0.03,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
}

function createFlutedColumn(height, radius, palette) {
  const profile = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    let r = radius;
    if (t < 0.07) r = radius * (1.1 - t * 1.3);
    else if (t > 0.9) r = radius * (1.0 + (t - 0.9) * 2.2);
    else if (t > 0.1 && t < 0.18) r = radius * 0.9;
    profile.push(new THREE.Vector2(r, y));
  }

  const col = addShadowed(
    new THREE.Mesh(new THREE.LatheGeometry(profile, 18), decorMat(palette)),
  );

  const capital = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.38, radius * 1.0, 0.34, 14),
      decorMat(palette),
    ),
  );
  capital.position.y = height + 0.17;
  col.add(capital);

  const base = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.1, radius * 1.32, 0.28, 14),
      decorMat(palette, true),
    ),
  );
  base.position.y = 0.14;
  col.add(base);

  return col;
}

function columnPositions(cfg) {
  const halfDoor = cfg.doorClearWidth / 2;
  const gap = cfg.columnGapFromDoor + cfg.columnRadius;
  const inner = halfDoor + gap;
  const outer = inner + cfg.columnRadius * 4.5;

  if (cfg.columnCount === 4) {
    return [-outer, -inner, inner, outer];
  }

  const span = cfg.bayWidth - 2.2;
  const spacing = span / (cfg.columnCount - 1);
  const start = -span / 2;
  const positions = [];
  for (let i = 0; i < cfg.columnCount; i++) {
    const x = start + i * spacing;
    if (Math.abs(x) < halfDoor + cfg.columnRadius * 0.5) continue;
    positions.push(x);
  }
  return positions;
}

function buildSteps(group, cfg, halfD, palette) {
  const { stepCount, stepDepth, stepRise, bayWidth } = cfg;
  const mat = decorMat(palette, true);
  const baseZ = halfD + 0.4;

  for (let i = 0; i < stepCount; i++) {
    const t = (i + 1) / stepCount;
    const w = bayWidth * (0.62 + t * 0.32);
    const step = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, stepRise, stepDepth * 0.92), mat));
    step.position.set(0, stepRise * (i + 0.5), baseZ + i * stepDepth);
    group.add(step);
  }
}

function buildPediment(group, cfg, y, z, width, palette) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, cfg.pedimentHeight);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.55,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.05,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);

  const pediment = addShadowed(new THREE.Mesh(geo, decorMat(palette)));
  pediment.position.set(0, y, z);
  group.add(pediment);
}

function buildDoorTrim(group, cfg, faceZ, outward, storyHeight, palette) {
  if (cfg.doorTrim === false) return;

  const half = cfg.doorClearWidth / 2;
  const z = faceZ + outward * 0.55;
  const trim = decorMat(palette, true);
  const h = storyHeight * 0.38;
  const y = h / 2;

  for (const side of [-1, 1]) {
    const jamb = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.14, h, 0.12), trim));
    jamb.position.set(side * half, y, z);
    group.add(jamb);
  }

  const lintel = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(cfg.doorClearWidth + 0.5, 0.16, 0.14), trim));
  lintel.position.set(0, h, z);
  group.add(lintel);
}

/**
 * Neo-Classical frieze inscription — engraved Roman capitals on the entablature,
 * centred on the portico. Rendered to a canvas texture on a thin plane.
 */
function buildInscription(text, cfg, y, z, outward, group) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 176;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  try {
    ctx.letterSpacing = '20px'; // Trajan-like generous spacing
  } catch {
    /* older canvas — spacing unsupported, still renders */
  }
  ctx.font = "700 118px Georgia, 'Times New Roman', 'Palatino Linotype', serif";

  const measured = ctx.measureText(text).width || 1;
  const scaleX = Math.min(1, 1900 / measured); // keep it inside the frieze

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scaleX, 1);
  ctx.fillStyle = 'rgba(255, 250, 240, 0.4)'; // faint highlight = shallow engrave
  ctx.fillText(text, 0, 3);
  ctx.fillStyle = '#3a2c20'; // dark timber, reads on light stone
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const w = cfg.bayWidth * 0.62;
  const h = w * (canvas.height / canvas.width);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
  );
  plane.position.set(0, y, z);
  plane.rotation.y = outward > 0 ? 0 : Math.PI; // face outward from the wall
  plane.renderOrder = 4;
  group.add(plane);
}

/**
 * Classical portico — DECORATION ONLY. Never replaces structural walls.
 * Columns frame the doorway; no colliders; sits in front of the real wall.
 */
export function buildClassicalFacade({
  wall = 'south',
  halfW,
  halfD,
  totalHeight,
  storyHeight,
  palette,
  facadeGroup,
  config = {},
}) {
  const cfg = { ...DEFAULT_FACADE, ...config };
  const sign = wall === 'south' ? 1 : -1;
  const faceZ = sign * halfD;
  const outward = sign;
  const porticoZ = faceZ + outward * (cfg.bayProjection + 1.1);

  for (const side of [-1, 1]) {
    const pilaster = addShadowed(
      new THREE.Mesh(
        new THREE.BoxGeometry(0.42, totalHeight * 0.82, cfg.bayProjection + 0.2),
        decorMat(palette),
      ),
    );
    pilaster.position.set(side * (cfg.bayWidth / 2 - 0.2), totalHeight * 0.41, faceZ + outward * cfg.bayProjection * 0.5);
    facadeGroup.add(pilaster);
  }

  const cornice = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 2 + cfg.roofOverhang, cfg.corniceHeight, 0.28),
      decorMat(palette),
    ),
  );
  cornice.position.set(0, storyHeight * 2 - 0.2, faceZ + outward * 0.18);
  facadeGroup.add(cornice);

  const lowerCornice = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 2 + 0.4, cfg.corniceHeight * 0.85, 0.22),
      decorMat(palette),
    ),
  );
  lowerCornice.position.set(0, storyHeight - 0.1, faceZ + outward * 0.16);
  facadeGroup.add(lowerCornice);

  // Capital top = columnHeight + 0.34 (matches createFlutedColumn geometry).
  const columnCrownY = cfg.columnHeight + 0.34;
  const entablature = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bayWidth, cfg.entablatureHeight, 0.5),
      decorMat(palette),
    ),
  );
  entablature.position.set(0, columnCrownY + cfg.entablatureHeight / 2, porticoZ);
  facadeGroup.add(entablature);

  if (cfg.inscription) {
    buildInscription(
      cfg.inscription,
      cfg,
      columnCrownY + cfg.entablatureHeight / 2 - 0.05,
      porticoZ + outward * (0.25 + 0.03),
      outward,
      facadeGroup,
    );
  }

  for (const x of columnPositions(cfg)) {
    const col = createFlutedColumn(cfg.columnHeight, cfg.columnRadius, palette);
    col.position.set(x, 0, porticoZ);
    facadeGroup.add(col);
  }

  buildPediment(
    facadeGroup, cfg,
    columnCrownY + cfg.entablatureHeight + 0.08,
    porticoZ, cfg.bayWidth + 0.4, palette,
  );
  if (cfg.exteriorSteps !== false) {
    buildSteps(facadeGroup, cfg, halfD, palette);
  }
  buildDoorTrim(facadeGroup, cfg, faceZ, outward, storyHeight, palette);

  if (cfg.porticoDeck !== false) {
    const deckDepth = cfg.bayProjection + cfg.stepCount * cfg.stepDepth + 0.6;
    const deck = addShadowed(
      new THREE.Mesh(
        new THREE.BoxGeometry(cfg.bayWidth + 1.2, 0.12, deckDepth),
        decorMat(palette, true),
      ),
    );
    deck.position.set(0, 0.06, faceZ + outward * (deckDepth / 2 + 0.08));
    facadeGroup.add(deck);
  }

  const roofCap = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 2 + cfg.roofOverhang, 0.24, 1.1),
      decorMat(palette, true),
    ),
  );
  roofCap.position.set(0, totalHeight + 0.22, faceZ + outward * 0.08);
  facadeGroup.add(roofCap);

  return facadeGroup;
}