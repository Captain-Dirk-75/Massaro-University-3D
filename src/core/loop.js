export function createRenderLoop({ renderer, scene, camera, onUpdate }) {
  const clock = { last: performance.now() };

  function frame(now) {
    requestAnimationFrame(frame);

    const delta = Math.min((now - clock.last) / 1000, 0.1);
    clock.last = now;

    onUpdate(delta);
    renderer.render(scene, camera);
  }

  requestAnimationFrame(frame);
}