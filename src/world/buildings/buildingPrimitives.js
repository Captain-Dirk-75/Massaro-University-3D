import * as THREE from 'three';

export const GLASS_OPACITY = 0.18;
export const LINER_INSET = 0.03;
export const FLOOR_COLLIDER_MAX_Y = 0.15;
export const GLASS_RENDER_ORDER = 2;

export function segmentTouchesFloor(y1, floorBase = 0) {
  return y1 <= floorBase + FLOOR_COLLIDER_MAX_Y;
}

export function createPalette(overrides = {}) {
  return {
    shell: 0xd8d0c4,
    liner: 0xe8e0d4,
    floor: 0xc8b8a0,
    timber: 0x8a7060,
    ceiling: 0xf0ebe2,
    emissive: 0xfff0d8,
    emissiveIntensity: 0.12,
    roof: 0xb8a898,
    ...overrides,
  };
}

export function shellMat(palette) {
  return new THREE.MeshStandardMaterial({
    color: palette.shell,
    roughness: 0.88,
    metalness: 0.02,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
}

export function linerMat(palette) {
  return new THREE.MeshStandardMaterial({
    color: palette.liner,
    emissive: palette.emissive,
    emissiveIntensity: palette.emissiveIntensity,
    roughness: 0.92,
    metalness: 0,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
}

export function glassMat() {
  return new THREE.MeshStandardMaterial({
    color: 0xd8e8f4,
    transparent: true,
    opacity: GLASS_OPACITY,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.06,
    metalness: 0.02,
  });
}

export function woodMat(palette) {
  return new THREE.MeshStandardMaterial({
    color: palette.timber,
    roughness: 0.82,
    metalness: 0.02,
  });
}

export function ceilingMat(palette) {
  return new THREE.MeshStandardMaterial({
    color: palette.ceiling,
    emissive: palette.emissive,
    emissiveIntensity: palette.emissiveIntensity * 0.45,
    roughness: 0.92,
    metalness: 0,
  });
}

export function floorMat(palette) {
  return new THREE.MeshStandardMaterial({
    color: palette.floor,
    roughness: 0.9,
    metalness: 0.02,
  });
}

export function addShadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function openingsToRects(openings, wallH, floorBase = 0) {
  return openings.map((o) => {
    const bottom = floorBase + (o.sill ?? o.bottom ?? 0);
    const top = Math.min(bottom + o.height, floorBase + wallH - 0.05);
    const half = o.width / 2;
    return {
      left: o.offset - half,
      right: o.offset + half,
      bottom,
      top,
      isDoor: o.isDoor ?? false,
      arched: o.arched ?? false,
    };
  });
}

export const ARCHED_SPRING_RATIO = 0.78;
export const ARCHED_RISE_RATIO = 0.22;

export function archedSpringY(bottom, top) {
  return bottom + (top - bottom) * ARCHED_SPRING_RATIO;
}

function addArchedGlass(glassGroup, cx, cy, cz, w, h, rotY) {
  const rectH = h * ARCHED_SPRING_RATIO;
  const archH = h * ARCHED_RISE_RATIO;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, rectH), glassMat());
  glass.position.set(cx, cy - (h - rectH) / 2, cz);
  glass.rotation.y = rotY;
  glass.renderOrder = GLASS_RENDER_ORDER;
  glassGroup.add(glass);

  const arch = new THREE.Mesh(
    new THREE.ConeGeometry(w * 0.48, archH, 4, 1, true, 0, Math.PI * 2),
    glassMat(),
  );
  arch.position.set(cx, cy + rectH / 2 + archH / 2, cz);
  arch.rotation.y = rotY + Math.PI / 4;
  arch.renderOrder = GLASS_RENDER_ORDER;
  glassGroup.add(arch);
}

function addArchedSeal(shellGroup, linerGroup, cx, springY, top, cz, w, sign, palette) {
  const shellM = shellMat(palette);
  const linerM = linerMat(palette);
  const inset = LINER_INSET * sign;
  const rotY = sign > 0 ? Math.PI : 0;
  const bar = 0.16;
  const archR = w / 2;

  const sill = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w + bar * 2, bar, 0.22), shellM));
  sill.position.set(cx, springY - bar * 0.55, cz);
  sill.rotation.y = rotY;
  shellGroup.add(sill);

  for (const side of [-1, 1]) {
    const jamb = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(bar, top - springY + bar, 0.2), shellM));
    jamb.position.set(cx + side * (w / 2 + bar / 2), (springY + top) / 2, cz);
    jamb.rotation.y = rotY;
    shellGroup.add(jamb);
  }

  const arch = addShadowed(
    new THREE.Mesh(new THREE.TorusGeometry(archR, bar * 0.55, 8, 20, Math.PI), shellM),
  );
  arch.position.set(cx, springY, cz);
  arch.rotation.y = rotY;
  arch.rotation.x = Math.PI / 2;
  shellGroup.add(arch);

  const linerSill = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w + bar, bar * 0.7, 0.12), linerM));
  linerSill.position.set(cx, springY - bar * 0.45, cz - inset);
  linerSill.rotation.y = rotY;
  linerGroup.add(linerSill);
}

function addArchedSealAlongZ(shellGroup, linerGroup, x, springY, top, cz, w, sign, palette) {
  const shellM = shellMat(palette);
  const linerM = linerMat(palette);
  const inset = LINER_INSET * sign;
  const rotY = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
  const bar = 0.16;
  const archR = w / 2;

  const sill = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.22, bar, w + bar * 2), shellM));
  sill.position.set(x, springY - bar * 0.55, cz);
  sill.rotation.y = rotY;
  shellGroup.add(sill);

  for (const side of [-1, 1]) {
    const jamb = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.2, top - springY + bar, bar), shellM));
    jamb.position.set(x - inset, (springY + top) / 2, cz + side * (w / 2 + bar / 2));
    jamb.rotation.y = rotY;
    shellGroup.add(jamb);
  }

  const arch = addShadowed(
    new THREE.Mesh(new THREE.TorusGeometry(archR, bar * 0.55, 8, 20, Math.PI), shellM),
  );
  arch.position.set(x - inset * 0.5, springY, cz);
  arch.rotation.z = Math.PI / 2;
  arch.rotation.y = rotY;
  shellGroup.add(arch);

  const linerSill = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, bar * 0.7, w + bar), linerM));
  linerSill.position.set(x - inset, springY - bar * 0.45, cz);
  linerSill.rotation.y = rotY;
  linerGroup.add(linerSill);
}

export function buildWallSegmentsAlongX(
  z, halfW, yBase, wallH, thickness, openings, shellGroup, linerGroup, glassGroup,
  colliderBoxes, sign, palette, colliderLevel = 'all', floorBase = 0, emitColliders = true,
) {
  const rects = openingsToRects(openings, wallH, floorBase).sort((a, b) => a.left - b.left);
  const shellM = shellMat(palette);
  const linerM = linerMat(palette);
  const inset = LINER_INSET * sign;
  let cursor = -halfW;

  function addSegment(x1, x2, y1, y2) {
    if (x2 - x1 < 0.02 || y2 - y1 < 0.02) return;
    const w = x2 - x1;
    const h = y2 - y1;
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;

    const shell = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, thickness), shellM));
    shell.position.set(cx, cy, z);
    shellGroup.add(shell);

    const liner = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, thickness * 0.6), linerM));
    liner.position.set(cx, cy, z - inset);
    linerGroup.add(liner);

    if (emitColliders && segmentTouchesFloor(y1, floorBase)) {
      colliderBoxes.push({
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minZ: z - thickness / 2 - 0.05,
        maxZ: z + thickness / 2 + 0.05,
        level: colliderLevel,
      });
    }
  }

  function addGlass(rect) {
    const w = rect.right - rect.left;
    const h = rect.top - rect.bottom;
    const cx = (rect.left + rect.right) / 2;
    const cy = (rect.bottom + rect.top) / 2;
    const rotY = sign > 0 ? Math.PI : 0;
    if (rect.arched) {
      addArchedGlass(glassGroup, cx, cy, z - inset * 0.5, w, h, rotY);
    } else {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat());
      glass.position.set(cx, cy, z - inset * 0.5);
      glass.rotation.y = rotY;
      glass.renderOrder = GLASS_RENDER_ORDER;
      glassGroup.add(glass);
    }
  }

  for (const rect of rects) {
    const openTop = rect.arched ? archedSpringY(rect.bottom, rect.top) : rect.top;
    if (rect.left > cursor) addSegment(cursor, rect.left, yBase, yBase + wallH);
    if (openTop < yBase + wallH) addSegment(rect.left, rect.right, openTop, yBase + wallH);
    if (rect.bottom > yBase) addSegment(rect.left, rect.right, yBase, rect.bottom);
    if (!rect.isDoor) {
      addGlass(rect);
      if (rect.arched) {
        const cx = (rect.left + rect.right) / 2;
        const w = rect.right - rect.left;
        addArchedSeal(shellGroup, linerGroup, cx, openTop, rect.top, z, w, sign, palette);
      }
    }
    cursor = rect.right;
  }

  if (cursor < halfW) addSegment(cursor, halfW, yBase, yBase + wallH);
}

export function buildWallSegmentsAlongZ(
  x, halfD, yBase, wallH, thickness, openings, shellGroup, linerGroup, glassGroup,
  colliderBoxes, sign, palette, colliderLevel = 'all', floorBase = 0, emitColliders = true,
) {
  const rects = openingsToRects(openings, wallH, floorBase).sort((a, b) => a.left - b.left);
  const shellM = shellMat(palette);
  const linerM = linerMat(palette);
  const inset = LINER_INSET * sign;
  let cursor = -halfD;

  function addSegment(z1, z2, y1, y2) {
    if (z2 - z1 < 0.02 || y2 - y1 < 0.02) return;
    const d = z2 - z1;
    const h = y2 - y1;
    const cz = (z1 + z2) / 2;
    const cy = (y1 + y2) / 2;

    const shell = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(thickness, h, d), shellM));
    shell.position.set(x, cy, cz);
    shellGroup.add(shell);

    const liner = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(thickness * 0.6, h, d), linerM));
    liner.position.set(x - inset, cy, cz);
    linerGroup.add(liner);

    if (emitColliders && segmentTouchesFloor(y1, floorBase)) {
      colliderBoxes.push({
        minX: x - thickness / 2 - 0.05,
        maxX: x + thickness / 2 + 0.05,
        minZ: cz - d / 2,
        maxZ: cz + d / 2,
        level: colliderLevel,
      });
    }
  }

  function addGlass(rect) {
    const w = rect.right - rect.left;
    const h = rect.top - rect.bottom;
    const cz = (rect.left + rect.right) / 2;
    const cy = (rect.bottom + rect.top) / 2;
    const rotY = sign > 0 ? -Math.PI / 2 : Math.PI / 2;
    if (rect.arched) {
      addArchedGlass(glassGroup, x - inset * 0.5, cy, cz, w, h, rotY);
    } else {
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat());
      glass.position.set(x - inset * 0.5, cy, cz);
      glass.rotation.y = rotY;
      glass.renderOrder = GLASS_RENDER_ORDER;
      glassGroup.add(glass);
    }
  }

  for (const rect of rects) {
    const openTop = rect.arched ? archedSpringY(rect.bottom, rect.top) : rect.top;
    if (rect.left > cursor) addSegment(cursor, rect.left, yBase, yBase + wallH);
    if (openTop < yBase + wallH) addSegment(rect.left, rect.right, openTop, yBase + wallH);
    if (rect.bottom > yBase) addSegment(rect.left, rect.right, yBase, rect.bottom);
    if (!rect.isDoor) {
      addGlass(rect);
      if (rect.arched) {
        const cz = (rect.left + rect.right) / 2;
        const w = rect.right - rect.left;
        addArchedSealAlongZ(shellGroup, linerGroup, x, openTop, rect.top, cz, w, sign, palette);
      }
    }
    cursor = rect.right;
  }

  if (cursor < halfD) addSegment(cursor, halfD, yBase, yBase + wallH);
}

export function cutRectangles(pieces, holes) {
  for (const hole of holes) {
    const next = [];
    for (const piece of pieces) {
      if (
        hole.maxX <= piece.minX || hole.minX >= piece.maxX ||
        hole.maxZ <= piece.minZ || hole.minZ >= piece.maxZ
      ) {
        next.push(piece);
        continue;
      }
      if (hole.minZ > piece.minZ) {
        next.push({ minX: piece.minX, maxX: piece.maxX, minZ: piece.minZ, maxZ: hole.minZ });
      }
      if (hole.maxZ < piece.maxZ) {
        next.push({ minX: piece.minX, maxX: piece.maxX, minZ: hole.maxZ, maxZ: piece.maxZ });
      }
      const midMinZ = Math.max(piece.minZ, hole.minZ);
      const midMaxZ = Math.min(piece.maxZ, hole.maxZ);
      if (hole.minX > piece.minX) {
        next.push({ minX: piece.minX, maxX: hole.minX, minZ: midMinZ, maxZ: midMaxZ });
      }
      if (hole.maxX < piece.maxX) {
        next.push({ minX: hole.maxX, maxX: piece.maxX, minZ: midMinZ, maxZ: midMaxZ });
      }
    }
    pieces.length = 0;
    pieces.push(...next);
  }
  return pieces;
}

export function buildFloorDeck(insetW, insetD, floorY, thickness, holes, palette, group) {
  const mat = floorMat(palette);
  const pieces = cutRectangles(
    [{ minX: -insetW / 2, maxX: insetW / 2, minZ: -insetD / 2, maxZ: insetD / 2 }],
    holes,
  );

  for (const piece of pieces) {
    const w = piece.maxX - piece.minX;
    const d = piece.maxZ - piece.minZ;
    if (w < 0.2 || d < 0.2) continue;
    const mesh = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, thickness, d), mat));
    mesh.position.set((piece.minX + piece.maxX) / 2, floorY + thickness / 2, (piece.minZ + piece.maxZ) / 2);
    group.add(mesh);
  }
}

export function buildInteriorCeiling(insetW, insetD, ceilingY, palette, group, beamCount = 0, holes = []) {
  const mat = ceilingMat(palette);
  const thickness = 0.14;
  const pieces = cutRectangles(
    [{ minX: -insetW / 2, maxX: insetW / 2, minZ: -insetD / 2, maxZ: insetD / 2 }],
    holes,
  );

  for (const piece of pieces) {
    const w = piece.maxX - piece.minX;
    const d = piece.maxZ - piece.minZ;
    if (w < 0.2 || d < 0.2) continue;
    const slab = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, thickness, d), mat));
    slab.position.set((piece.minX + piece.maxX) / 2, ceilingY, (piece.minZ + piece.maxZ) / 2);
    group.add(slab);
  }

  if (beamCount > 0) {
    const beamMat = woodMat(palette);
    const spacing = insetD / (beamCount + 1);
    for (let i = 1; i <= beamCount; i++) {
      const beam = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(insetW * 0.92, 0.18, 0.22), beamMat));
      beam.position.set(0, ceilingY - 0.08, -insetD / 2 + spacing * i);
      group.add(beam);
    }
  }

  return { bottomY: ceilingY - 0.07, centerY: ceilingY };
}

export const CEILING_LIGHT_WARMTH = 0xffd8a0;
export const CEILING_LIGHT_SHADE_COLOR = 0xf0e8d8;
export const CEILING_LIGHT_EMISSIVE_INTENSITY = 0.28;
export const CEILING_LIGHT_CORD_LENGTH = 1.4;
export const CEILING_LIGHT_SHADE_HEIGHT = 0.38;
export const CEILING_LIGHT_MARGIN = 0.55;
export const INTERIOR_FILL_LIGHT_INTENSITY = 0.9;
export const INTERIOR_FILL_LIGHT_DISTANCE = 18;

function ceilingLightPositions(halfW, halfD, count) {
  const mx = halfW * CEILING_LIGHT_MARGIN;
  const mz = halfD * CEILING_LIGHT_MARGIN;
  const grid = [
    [-mx, -mz], [mx, -mz], [-mx, mz], [mx, mz],
    [0, 0], [-mx, 0], [mx, 0], [0, -mz], [0, mz],
  ];
  return grid.slice(0, count);
}

export function buildCeilingLights(cx, cz, halfW, halfD, ceilingBottomY, count, lightsGroup) {
  for (const [lx, lz] of ceilingLightPositions(halfW, halfD, count)) {
    const x = cx + lx;
    const z = cz + lz;

    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, CEILING_LIGHT_CORD_LENGTH, 6),
      new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.9 }),
    );
    cord.position.set(x, ceilingBottomY - CEILING_LIGHT_CORD_LENGTH / 2, z);
    lightsGroup.add(cord);

    const shade = addShadowed(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.34, 0.44, CEILING_LIGHT_SHADE_HEIGHT, 12, 1, true),
        new THREE.MeshStandardMaterial({
          color: CEILING_LIGHT_SHADE_COLOR,
          emissive: CEILING_LIGHT_WARMTH,
          emissiveIntensity: CEILING_LIGHT_EMISSIVE_INTENSITY,
          roughness: 0.75,
          side: THREE.DoubleSide,
        }),
      ),
    );
    shade.position.set(x, ceilingBottomY - CEILING_LIGHT_CORD_LENGTH - CEILING_LIGHT_SHADE_HEIGHT / 2, z);
    lightsGroup.add(shade);
  }

  const fill = new THREE.PointLight(
    CEILING_LIGHT_WARMTH,
    INTERIOR_FILL_LIGHT_INTENSITY,
    INTERIOR_FILL_LIGHT_DISTANCE,
  );
  fill.position.set(cx, ceilingBottomY - 1.1, cz);
  lightsGroup.add(fill);
}

function buildStairFlight(minX, maxX, minZ, maxZ, riseMin, riseMax, palette, group) {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const steps = 12;
  const totalRise = riseMax - riseMin;
  const stepH = totalRise / steps;
  const stepD = d / steps;
  const cx = (minX + maxX) / 2;

  for (let i = 0; i < steps; i++) {
    const step = addShadowed(
      new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.92, stepH, stepD * 0.95),
        woodMat(palette),
      ),
    );
    step.position.set(
      cx,
      riseMin + stepH * i + stepH / 2,
      maxZ - stepD * i - stepD / 2,
    );
    group.add(step);
  }

  const railMat = woodMat(palette);
  for (const side of [minX + 0.08, maxX - 0.08]) {
    const rail = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.08, totalRise + 0.5, d), railMat));
    rail.position.set(side, riseMin + totalRise / 2, (minZ + maxZ) / 2);
    group.add(rail);
  }
}

export function buildStairMesh(stair, storyHeight, palette, group) {
  buildStairFlight(stair.minX, stair.maxX, stair.minZ, stair.maxZ, 0, storyHeight, palette, group);
}

/**
 * A single straight flight that rises from its SOUTH edge (maxZ, floor level) to
 * its NORTH edge (minZ, +storyHeight) — matching the straight stairFloorY handler.
 * Solid blocky treads with an open sloped banister + balusters on each side.
 */
export function buildStraightStair(rect, storyHeight, palette, group, opts = {}) {
  const { minX, maxX, minZ, maxZ } = rect;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const steps = opts.steps ?? 14;
  const stepH = storyHeight / steps;
  const stepD = d / steps;
  const cx = (minX + maxX) / 2;
  const woodM = woodMat(palette);

  // Solid steps: each tread is a full block from the floor up to its tread height
  // (closed risers), low at the front (maxZ) climbing to the rear (minZ).
  for (let i = 0; i < steps; i++) {
    const h = stepH * (i + 1);
    const tread = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, h, stepD * 0.99), woodM));
    tread.position.set(cx, h / 2, maxZ - stepD * i - stepD / 2);
    group.add(tread);
  }

  // Sloped handrail + balusters down each side (visual railing, follows the slope).
  const railH = opts.railHeight ?? 0.95;
  const angle = Math.atan2(storyHeight, d);
  const railLen = Math.hypot(d, storyHeight);
  const balCount = opts.balusters ?? Math.max(4, Math.round(d / 1.4));
  const railMat = woodMat(palette);

  for (const sx of [minX + 0.07, maxX - 0.07]) {
    const handrail = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, railLen), railMat));
    handrail.position.set(sx, railH + storyHeight / 2, (minZ + maxZ) / 2);
    handrail.rotation.x = angle;
    group.add(handrail);

    for (let b = 0; b <= balCount; b++) {
      const t = b / balCount;
      const z = maxZ - t * d;
      const yBase = t * storyHeight;
      const bal = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.05, railH, 0.05), railMat));
      bal.position.set(sx, yBase + railH / 2, z);
      group.add(bal);
    }
  }
}

export function buildSplitStairMesh(split, storyHeight, palette, group) {
  const { main, left, right, landingY } = split;
  buildStairFlight(main.minX, main.maxX, main.minZ, main.maxZ, 0, landingY, palette, group);
  buildStairFlight(left.minX, left.maxX, left.minZ, left.maxZ, landingY, storyHeight, palette, group);
  buildStairFlight(right.minX, right.maxX, right.minZ, right.maxZ, landingY, storyHeight, palette, group);

  const landingW = right.maxX - left.minX;
  const landingD = 0.9;
  const landing = addShadowed(
    new THREE.Mesh(new THREE.BoxGeometry(landingW * 0.95, 0.12, landingD), woodMat(palette)),
  );
  landing.position.set(
    (left.minX + right.maxX) / 2,
    landingY + 0.06,
    main.minZ - landingD / 2,
  );
  group.add(landing);
}

export function buildGalleryRailing(segments, floorY, palette, group, colliderBoxes) {
  const railMat = woodMat(palette);
  for (const seg of segments) {
    const { minX, maxX, minZ, maxZ, height = 0.95 } = seg;
    const alongX = maxX - minX >= maxZ - minZ;
    if (alongX) {
      const w = maxX - minX;
      const rail = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(w, height, 0.1), railMat));
      rail.position.set((minX + maxX) / 2, floorY + height / 2, (minZ + maxZ) / 2);
      group.add(rail);
      colliderBoxes.push({
        minX: minX - 0.05,
        maxX: maxX + 0.05,
        minZ: (minZ + maxZ) / 2 - 0.12,
        maxZ: (minZ + maxZ) / 2 + 0.12,
        level: 'upper',
      });
    } else {
      const d = maxZ - minZ;
      const rail = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.1, height, d), railMat));
      rail.position.set((minX + maxX) / 2, floorY + height / 2, (minZ + maxZ) / 2);
      group.add(rail);
      colliderBoxes.push({
        minX: (minX + maxX) / 2 - 0.12,
        maxX: (minX + maxX) / 2 + 0.12,
        minZ: minZ - 0.05,
        maxZ: maxZ + 0.05,
        level: 'upper',
      });
    }
  }
}

export function buildChandelier(x, z, hangY, palette, lightsGroup, opts = {}) {
  const cordLength = opts.cordLength ?? 2.8;
  const shadeHeight = opts.shadeHeight ?? 0.55;
  const shadeTop = opts.shadeTopRadius ?? 0.28;
  const shadeBottom = opts.shadeBottomRadius ?? 0.62;

  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, cordLength, 6),
    new THREE.MeshStandardMaterial({ color: 0x3a3835, roughness: 0.9 }),
  );
  cord.position.set(x, hangY - cordLength / 2, z);
  lightsGroup.add(cord);

  const shade = addShadowed(
    new THREE.Mesh(
      new THREE.CylinderGeometry(shadeTop, shadeBottom, shadeHeight, 14, 1, true),
      new THREE.MeshStandardMaterial({
        color: CEILING_LIGHT_SHADE_COLOR,
        emissive: CEILING_LIGHT_WARMTH,
        emissiveIntensity: CEILING_LIGHT_EMISSIVE_INTENSITY * 1.2,
        roughness: 0.75,
        side: THREE.DoubleSide,
      }),
    ),
  );
  shade.position.set(x, hangY - cordLength - shadeHeight / 2, z);
  lightsGroup.add(shade);

  const fill = new THREE.PointLight(
    CEILING_LIGHT_WARMTH,
    INTERIOR_FILL_LIGHT_INTENSITY * 1.4,
    INTERIOR_FILL_LIGHT_DISTANCE * 1.5,
  );
  fill.position.set(x, hangY - cordLength - shadeHeight * 0.5, z);
  lightsGroup.add(fill);
}

export function buildWallSconces(cx, cz, halfW, halfD, floorY, height, palette, lightsGroup, count = 2) {
  const mat = new THREE.MeshStandardMaterial({
    color: palette.timber,
    emissive: CEILING_LIGHT_WARMTH,
    emissiveIntensity: 0.18,
    roughness: 0.82,
  });
  const positions = [
    [cx - halfW * 0.85, cz, Math.PI / 2],
    [cx + halfW * 0.85, cz, -Math.PI / 2],
    [cx, cz - halfD * 0.85, 0],
    [cx, cz + halfD * 0.85, Math.PI],
  ].slice(0, count);

  for (const [x, z, rotY] of positions) {
    const sconce = addShadowed(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.18), mat));
    sconce.position.set(x, floorY + height, z);
    sconce.rotation.y = rotY;
    lightsGroup.add(sconce);

    const bulb = new THREE.PointLight(CEILING_LIGHT_WARMTH, 0.35, 8);
    bulb.position.set(x, floorY + height + 0.05, z);
    lightsGroup.add(bulb);
  }
}