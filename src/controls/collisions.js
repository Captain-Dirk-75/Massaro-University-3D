function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function circleHitsAabb(x, z, radius, box) {
  if (box.boundary) return false;

  const closestX = clamp(x, box.minX, box.maxX);
  const closestZ = clamp(z, box.minZ, box.maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

function pushCircleFromAabb(x, z, radius, box) {
  if (box.boundary) {
    return {
      x: clamp(x, box.minX + radius, box.maxX - radius),
      z: clamp(z, box.minZ + radius, box.maxZ - radius),
    };
  }

  const closestX = clamp(x, box.minX, box.maxX);
  const closestZ = clamp(z, box.minZ, box.maxZ);
  let dx = x - closestX;
  let dz = z - closestZ;
  const distSq = dx * dx + dz * dz;

  if (distSq >= radius * radius) {
    return { x, z };
  }

  if (distSq < 1e-8) {
    const toLeft = x - box.minX;
    const toRight = box.maxX - x;
    const toNear = z - box.minZ;
    const toFar = box.maxZ - z;
    const min = Math.min(toLeft, toRight, toNear, toFar);

    if (min === toLeft) return { x: box.minX - radius, z };
    if (min === toRight) return { x: box.maxX + radius, z };
    if (min === toNear) return { x, z: box.minZ - radius };
    return { x, z: box.maxZ + radius };
  }

  const dist = Math.sqrt(distSq);
  const push = radius - dist;
  return {
    x: x + (dx / dist) * push,
    z: z + (dz / dist) * push,
  };
}

function pushCircleFromCircle(x, z, playerRadius, obstacle) {
  const dx = x - obstacle.x;
  const dz = z - obstacle.z;
  const dist = Math.hypot(dx, dz);
  const minDist = playerRadius + obstacle.r;

  if (dist >= minDist) {
    return { x, z };
  }

  if (dist < 1e-6) {
    return { x: x + minDist, z };
  }

  const overlap = minDist - dist;
  return {
    x: x + (dx / dist) * overlap,
    z: z + (dz / dist) * overlap,
  };
}

function collidesAt(x, z, radius, colliders) {
  for (const box of colliders.boxes) {
    if (box.boundary) continue;
    if (circleHitsAabb(x, z, radius, box)) return true;
  }
  for (const circle of colliders.circles) {
    if (Math.hypot(x - circle.x, z - circle.z) < radius + circle.r) return true;
  }
  return false;
}

function resolvePosition(x, z, radius, colliders) {
  let rx = x;
  let rz = z;

  for (let i = 0; i < 6; i++) {
    for (const box of colliders.boxes) {
      if (circleHitsAabb(rx, rz, radius, box) || box.boundary) {
        const pushed = pushCircleFromAabb(rx, rz, radius, box);
        rx = pushed.x;
        rz = pushed.z;
      }
    }
    for (const circle of colliders.circles) {
      const pushed = pushCircleFromCircle(rx, rz, radius, circle);
      rx = pushed.x;
      rz = pushed.z;
    }
  }

  return { x: rx, z: rz };
}

/**
 * Apply horizontal movement with slide + depenetration against world colliders.
 */
export function applyCollisionMovement(camera, delta, colliders) {
  if (!colliders) {
    camera.position.add(delta);
    return;
  }

  const radius = colliders.playerRadius ?? 0.38;
  const startX = camera.position.x;
  const startZ = camera.position.z;
  const targetX = startX + delta.x;
  const targetZ = startZ + delta.z;

  let nextX = targetX;
  let nextZ = targetZ;

  if (collidesAt(nextX, nextZ, radius, colliders)) {
    const slideX = !collidesAt(targetX, startZ, radius, colliders);
    const slideZ = !collidesAt(startX, targetZ, radius, colliders);

    if (slideX) nextX = targetX;
    else nextX = startX;

    if (slideZ) nextZ = targetZ;
    else nextZ = startZ;
  }

  const resolved = resolvePosition(nextX, nextZ, radius, colliders);
  camera.position.x = resolved.x;
  camera.position.z = resolved.z;
}

export function createCollisionDebugHelpers(colliders) {
  const group = new THREE.Group();
  if (!colliders) return group;

  const boxMat = new THREE.MeshBasicMaterial({
    color: 0xff4444,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const circleMat = new THREE.MeshBasicMaterial({
    color: 0x44ff88,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });

  for (const box of colliders.boxes) {
    if (box.boundary) continue;
    const w = box.maxX - box.minX;
    const d = box.maxZ - box.minZ;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 2.5, d), boxMat);
    mesh.position.set((box.minX + box.maxX) / 2, 1.25, (box.minZ + box.maxZ) / 2);
    group.add(mesh);
  }

  for (const circle of colliders.circles) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(circle.r, circle.r, 2.5, 16),
      circleMat,
    );
    mesh.position.set(circle.x, 1.25, circle.z);
    group.add(mesh);
  }

  return group;
}