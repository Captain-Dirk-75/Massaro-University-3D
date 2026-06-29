import * as THREE from 'three';
import { addShadowed, shellMat } from './buildingPrimitives.js';

// ── Default facade proportions (override per building) ──
export const DEFAULT_FACADE = {
  bayWidth: 14,
  bayProjection: 2.6,
  columnCount: 6,
  columnRadius: 0.3,
  columnHeight: 6.6,
  pedimentHeight: 1.5,
  entablatureHeight: 0.52,
  stepCount: 4,
  stepDepth: 0.5,
  stepRise: 0.18,
  corniceHeight: 0.28,
  roofOverhang: 1.2,
  wingSetback: 0,
};

function facadeStoneMat(palette, dark = false) {
  return new THREE.MeshStandardMaterial({
    color: dark ? (palette.facadeDark ?? 0xb8a898) : (palette.facadeStone ?? palette.shell),
    roughness: 0.8,
    metalness: 0.03,
    polygonOffset: true,
    polygonOffsetFactor: dark ? -1 : 1,
    polygonOffsetUnits: 1,
  });
}

function createFlutedColumn(height, radius, palette) {
  const profile = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const y = t * height;
    let r = radius;
    if (t < 0.07) r = radius * (1.12 - t * 1.4);
    else if (t > 0.9) r = radius * (1.0 + (t - 0.9) * 2.5);
    else if (t > 0.1 && t < 0.18) r = radius * 0.9;
    profile.push(new THREE.Vector2(r, y));
  }

  const col = addShadowed(
    new THREE.Mesh(new THREE.LatheGeometry(profile, 18), facadeStoneMat(palette)),
  );

  const capital = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.42, radius * 1.02, 0.36, 14),
      facadeStoneMat(palette),
    ),
  );
  capital.position.y = height + 0.18;
  col.add(capital);

  const base = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 1.12, radius * 1.35, 0.3, 14),
      facadeStoneMat(palette, true),
    ),
  );
  base.position.y = 0.15;
  col.add(base);

  return col;
}

function buildSteps(group, config, halfD, bayWidth, palette) {
  const { stepCount, stepDepth, stepRise } = config;
  const mat = facadeStoneMat(palette, true);
  const baseZ = halfD + 0.35;

  for (let i = 0; i < stepCount; i++) {
    const t = (i + 1) / stepCount;
    const w = bayWidth * (0.55 + t * 0.4);
    const step = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, stepRise, stepDepth * 0.95), mat));
    step.position.set(0, stepRise * (i + 0.5), baseZ + i * stepDepth);
    group.add(step);
  }
}

function buildPediment(group, config, y, z, width, palette) {
  const { pedimentHeight } = config;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(width / 2, 0);
  shape.lineTo(0, pedimentHeight);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.2,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 2,
  });
  geo.rotateX(-Math.PI / 2);

  const pediment = addShadowed(new THREE.Mesh(geo, facadeStoneMat(palette)));
  pediment.position.set(0, y, z);
  group.add(pediment);
}

/**
 * Classical portico facade (columns, pediment, steps, entablature).
 * @param {'south'|'north'} wall — which face the portico faces outward on
 */
export function buildClassicalFacade({
  wall = 'south',
  halfW,
  halfD,
  totalHeight,
  storyHeight,
  palette,
  shellGroup,
  config = {},
}) {
  const cfg = { ...DEFAULT_FACADE, ...config };
  const group = new THREE.Group();
  const sign = wall === 'south' ? 1 : -1;
  const faceZ = sign * halfD;
  const outward = sign;

  const bayZ = faceZ + outward * (cfg.bayProjection * 0.45);
  const porticoZ = faceZ + outward * (cfg.bayProjection + 0.4);

  const bay = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bayWidth, totalHeight * 0.92, cfg.bayProjection),
      shellMat(palette),
    ),
  );
  bay.position.set(0, totalHeight * 0.46, bayZ);
  group.add(bay);

  if (cfg.wingSetback > 0) {
    for (const side of [-1, 1]) {
      const wingW = halfW * 2 - cfg.wingSetback * 2 - cfg.bayWidth * 0.15;
      const wing = addShadowed(
        new THREE.Mesh(
          new THREE.BoxGeometry(wingW, totalHeight * 0.88, halfD * 1.35),
          shellMat(palette),
        ),
      );
      wing.position.set(side * (cfg.bayWidth / 2 + wingW / 2 + 0.3), totalHeight * 0.44, -halfD * 0.08);
      group.add(wing);
    }
  }

  const cornice = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 2 + cfg.roofOverhang, cfg.corniceHeight, 0.42),
      facadeStoneMat(palette),
    ),
  );
  cornice.position.set(0, storyHeight - 0.12, faceZ + outward * 0.22);
  group.add(cornice);

  const entablature = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bayWidth - 0.4, cfg.entablatureHeight, cfg.bayProjection + 0.6),
      facadeStoneMat(palette),
    ),
  );
  const columnTop = cfg.columnHeight + 0.5;
  entablature.position.set(0, columnTop, porticoZ - outward * 0.15);
  group.add(entablature);

  const spacing = (cfg.bayWidth - 2.4) / (cfg.columnCount - 1);
  const startX = -(cfg.bayWidth - 2.4) / 2;
  for (let i = 0; i < cfg.columnCount; i++) {
    const col = createFlutedColumn(cfg.columnHeight, cfg.columnRadius, palette);
    col.position.set(startX + i * spacing, 0, porticoZ);
    group.add(col);
  }

  buildPediment(group, cfg, columnTop + cfg.entablatureHeight + 0.1, porticoZ, cfg.bayWidth + 0.6, palette);

  const doorArch = addShadowed(
    new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.16, 10, 20, Math.PI),
      facadeStoneMat(palette, true),
    ),
  );
  doorArch.position.set(0, storyHeight * 0.42, faceZ + outward * 0.28);
  doorArch.rotation.x = Math.PI / 2;
  group.add(doorArch);

  const doorFrame = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.4, 0.22), facadeStoneMat(palette, true)),
  );
  doorFrame.position.set(0, storyHeight * 0.22, faceZ + outward * 0.2);
  group.add(doorFrame);

  buildSteps(group, cfg, halfD, cfg.bayWidth, palette);

  const porticoDeck = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(cfg.bayWidth - 0.6, 0.18, cfg.bayProjection + 0.8),
      facadeStoneMat(palette, true),
    ),
  );
  porticoDeck.position.set(0, 0.09, faceZ + outward * (cfg.bayProjection * 0.55));
  group.add(porticoDeck);

  const roofCap = addShadowed(
    new THREE.Mesh(
      new THREE.BoxGeometry(halfW * 2 + cfg.roofOverhang * 1.6, 0.32, 1.8),
      facadeStoneMat(palette, true),
    ),
  );
  roofCap.position.set(0, totalHeight + 0.28, faceZ + outward * 0.1);
  group.add(roofCap);

  shellGroup.add(group);
  return group;
}