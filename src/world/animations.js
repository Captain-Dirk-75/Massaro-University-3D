import { FOLIAGE_SWAY_SPEED } from './nature.js';
import { RIPPLE_SPEED } from './waterFeature.js';
import { MOTE_ORBIT_SPEED } from './motes.js';

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
  }

  return { update };
}