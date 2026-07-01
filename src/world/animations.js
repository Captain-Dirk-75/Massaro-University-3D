import { FOLIAGE_SWAY_SPEED } from './nature.js';
import { RIPPLE_SPEED } from './waterFeature.js';
import { MIST_RISE_SPEED } from './waterways.js';
import { MOTE_ORBIT_SPEED } from './motes.js';
import { CLOUD_DRIFT_SPEED } from './clouds.js';
import { BIRD_WING_FLAP_SPEED } from './birds.js';

function updateBirds(birds, perches, elapsed, delta) {
  for (const bird of birds) {
    const { mesh } = bird;
    const wingL = mesh.getObjectByName('wingL');
    const wingR = mesh.getObjectByName('wingR');

    if (bird.mode === 'perch') {
      bird.perchTimer -= delta;
      const perch = perches[bird.perchIndex];
      mesh.position.set(perch.x, perch.y + 0.12 + Math.sin(elapsed * 2 + bird.phase) * 0.03, perch.z);
      mesh.rotation.y += delta * 0.15;

      if (wingL && wingR) {
        wingL.rotation.z = 0.15;
        wingR.rotation.z = -0.15;
      }

      if (bird.perchTimer <= 0) {
        bird.mode = 'fly';
        bird.progress = 0;
        let next = bird.perchIndex;
        for (let attempt = 0; attempt < 6 && next === bird.perchIndex; attempt++) {
          next = Math.floor(Math.random() * perches.length);
        }
        bird.targetIndex = next;
      }
      continue;
    }

    const from = perches[bird.perchIndex];
    const to = perches[bird.targetIndex];
    bird.progress += delta * bird.speed * 0.12;

    if (bird.progress >= 1) {
      bird.mode = 'perch';
      bird.perchIndex = bird.targetIndex;
      bird.perchTimer = 2 + Math.random() * 5;
      bird.targetIndex = (bird.targetIndex + 1 + Math.floor(Math.random() * (perches.length - 1))) % perches.length;
      mesh.position.set(to.x, to.y + 0.12, to.z);
      continue;
    }

    const t = bird.progress;
    const arc = Math.sin(t * Math.PI) * bird.flightHeight;
    mesh.position.set(
      from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t + arc,
      from.z + (to.z - from.z) * t,
    );

    mesh.lookAt(
      from.x + (to.x - from.x) * Math.min(t + 0.05, 1),
      from.y + (to.y - from.y) * Math.min(t + 0.05, 1) + arc,
      from.z + (to.z - from.z) * Math.min(t + 0.05, 1),
    );

    const flap = Math.sin(elapsed * BIRD_WING_FLAP_SPEED + bird.phase) * 0.55;
    if (wingL && wingR) {
      wingL.rotation.z = 0.55 + flap;
      wingR.rotation.z = -0.55 - flap;
    }
  }
}

export function createWorldAnimations({
  swayTargets,
  waterMaterial,
  waterMaterials = [],
  waterfallMist,
  groundMist,
  motes,
  clouds,
  birds,
  birdPerches,
}) {
  let elapsed = 0;
  const allWater = [...(waterMaterial ? [waterMaterial] : []), ...waterMaterials];

  function update(delta) {
    elapsed += delta;

    for (const target of swayTargets) {
      const phase = target.userData.swayPhase ?? 0;
      const amount = target.userData.swayAmount ?? 0.03;
      const sway =
        Math.sin(elapsed * FOLIAGE_SWAY_SPEED + phase) * amount +
        Math.sin(elapsed * FOLIAGE_SWAY_SPEED * 0.6 + phase * 1.3) * amount * 0.4;
      target.rotation.z = sway;
      target.rotation.x = sway * 0.35;
    }

    for (const mat of allWater) {
      mat.uniforms.uTime.value = elapsed * RIPPLE_SPEED;
    }

    if (waterfallMist) {
      const { positions, seeds, points, baseY } = waterfallMist;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const i3 = i * 3;
        const cycle = (elapsed * MIST_RISE_SPEED * s.rise + s.phase) % 2.4;
        positions[i3] = s.ox + Math.sin(elapsed * s.speed + s.phase) * s.sway;
        positions[i3 + 1] = baseY + cycle;
        positions[i3 + 2] = s.oz + Math.cos(elapsed * s.speed * 0.8 + s.phase) * s.sway;
      }
      points.geometry.attributes.position.needsUpdate = true;
      points.material.opacity = 0.24 + 0.06 * Math.sin(elapsed * 0.8);
    }

    if (groundMist) {
      groundMist.update(elapsed);
    }

    if (motes) {
      const { positions, seeds, points } = motes;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const i3 = i * 3;
        const t = elapsed * s.speed * MOTE_ORBIT_SPEED;

        positions[i3] = s.ox + Math.sin(t + s.phase) * s.radius;
        positions[i3 + 1] =
          s.oy +
          Math.sin(t * 0.65 + s.phase * 1.3) * s.radius * 0.45 +
          Math.sin(elapsed * 0.2 + s.phase) * 0.25;
        positions[i3 + 2] = s.oz + Math.cos(t * 0.8 + s.phase) * s.radius * 0.85;
      }
      points.geometry.attributes.position.needsUpdate = true;
    }

    if (clouds) {
      for (const cloud of clouds) {
        const drift = Math.sin(elapsed * cloud.speed * CLOUD_DRIFT_SPEED + cloud.phase) * 6;
        if (cloud.driftAxis === 'x') {
          cloud.mesh.position.x = cloud.baseX + drift;
        } else {
          cloud.mesh.position.z = cloud.baseZ + drift;
        }
      }
    }

    if (birds && birdPerches?.length) {
      updateBirds(birds, birdPerches, elapsed, delta);
    }
  }

  return { update };
}