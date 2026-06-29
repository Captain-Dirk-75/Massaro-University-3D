import { FOLIAGE_SWAY_SPEED } from './nature.js';
import { RIPPLE_SPEED } from './waterFeature.js';
import { MOTE_DRIFT_SPEED } from './motes.js';

export function createWorldAnimations({ swayTargets, waterMaterial, motes }) {
  let elapsed = 0;

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

    if (waterMaterial) {
      waterMaterial.uniforms.uTime.value = elapsed * RIPPLE_SPEED;
    }

    if (motes) {
      const { positions, seeds, points } = motes;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const i3 = i * 3;
        positions[i3] += Math.sin(elapsed * s.speed + s.phase) * delta * MOTE_DRIFT_SPEED;
        positions[i3 + 1] +=
          Math.sin(elapsed * s.speed * 0.7 + s.phase) * delta * MOTE_DRIFT_SPEED * 0.4;
        positions[i3 + 2] += Math.cos(elapsed * s.speed * 0.5 + s.phase) * delta * MOTE_DRIFT_SPEED;
      }
      points.geometry.attributes.position.needsUpdate = true;
    }
  }

  return { update };
}